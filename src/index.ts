import {
  Web3AuthLoginProvider,
  Web3AuthMfaLevel,
  Web3AuthMode,
  Web3AuthNetwork,
} from './web3auth/types'
import {
  web3AuthFclServices,
  web3AuthNetworkToCadenceContractAddresses,
  web3AuthNetworkToFlowportApiMapping,
  web3AuthProviderMetadata,
} from './constants'
import {FlowportApiConnection} from './flowportApi'
import {getUi} from './ui'
import {Web3AuthConnection} from './web3auth/connection'
import {createApi} from './connector/api'
import {listenToMessages} from './connector'
import * as fcl from '@onflow/fcl'
import {serviceDefinition} from './connector/serviceDefinition'
import wallet from './wallet'
import {WalletActionsCallbacks} from './wallet/types'
import {assert, safeAssertUnreachable} from './typeUtils'
import {getLinkAccountCadence, publishAccountCadence} from './cadence'
import {sleep} from './utils'
import * as sdk from '@onflow/sdk'

const getDefaultWalletCallbacks = (): WalletActionsCallbacks => {
  const ui = getUi()
  return {
    confirmSign: ui.confirmSign,
    onLoginStatusChange: (loginStatus) => {
      if (loginStatus.status === 'creating_account') {
        ui.showLoading('Creating account...')
      }
      if (loginStatus.status === 'logged_in') {
        ui.close()
      }
      if (loginStatus.status === 'error') {
        ui.close()
        throw loginStatus.error
      }
    },
  }
}

export type InitArgs = {
  clientId: string
  network: Web3AuthNetwork
  mfaLevel?: Web3AuthMfaLevel
  uxMode?: Web3AuthMode
}

export function init({
  clientId,
  network,
  mfaLevel = 'none',
  uxMode = 'popup',
}: InitArgs) {
  const api = createApi(
    wallet.create(
      new Web3AuthConnection(network, clientId, mfaLevel, uxMode),
      new FlowportApiConnection(web3AuthNetworkToFlowportApiMapping[network]),
      getDefaultWalletCallbacks(),
    ),
    web3AuthFclServices,
  )
  listenToMessages(api)
}

export function setCallbacks(callbacks: Partial<WalletActionsCallbacks>) {
  wallet.instance().setCallbacks(callbacks)
}

export async function authWithProvider(loginProvider: Web3AuthLoginProvider) {
  // instead of exposing fn for unauth, we just logout user every time before he tries to log in
  await wallet.instance().logout()
  await fcl.authenticate({
    service: serviceDefinition(web3AuthFclServices[loginProvider]),
  })
}

export type AuthArgs = {
  loginProviderWhiteList: Web3AuthLoginProvider[]
}

export function auth(args?: AuthArgs): void {
  const ui = getUi()

  if (!args) {
    return ui.showLoginModal({
      onAuthWithProvider: authWithProvider,
      loginProvidersMetadata: web3AuthProviderMetadata,
    })
  }

  const web3AuthProviderMetadataWhitelist = args.loginProviderWhiteList.map(
    (whitelistedProvider) => {
      const provider = web3AuthProviderMetadata.find(
        ({loginProvider}) => loginProvider === whitelistedProvider,
      )
      assert(
        !!provider,
        `${whitelistedProvider} not among available login providers`,
      )
      return provider
    },
  )

  return ui.showLoginModal({
    onAuthWithProvider: authWithProvider,
    loginProvidersMetadata: web3AuthProviderMetadataWhitelist,
  })
}

export {web3AuthProviderMetadata as loginProviders} from './constants'

export const getUserInfo = () => {
  return wallet.instance().accountInfo?.web3authUserInfo
}

export * from './web3auth/types'
export * from './wallet/types'
export * from './types'

type AccountLinkStatus =
  | {
      status: 'initialized' | 'signing' | 'submitting'
    }
  | {
      status: 'tx_pending' | 'tx_executed' | 'tx_success' | 'tx_fail'
      transaction: fcl.TransactionMetadata
    }

const getDefaultOnAccountLinkStatusChange = (
  accountLinkStatus: AccountLinkStatus,
) => {
  const ui = getUi()
  switch (accountLinkStatus.status) {
    case 'signing':
    case 'initialized':
      return ui.showLoading('Linking account...')
    case 'submitting':
      return ui.showLoading('Submitting transaction...')
    case 'tx_pending':
      return ui.showLoading('Awaiting execution...')
    case 'tx_executed':
      return ui.showLoading('Executed, awaiting sealing...')
    case 'tx_success': {
      ui.showSuccess('Linking account successful')
      return sleep(2000).then(() => ui.close())
    }
    case 'tx_fail': {
      ui.showFail('Linking account failed')
      return sleep(2000).then(() => ui.close())
    }
    default:
      return safeAssertUnreachable(accountLinkStatus)
  }
}

type LinkAccountArgs = {
  linkedAccountName: string
  linkedAccountDescription: string
  clientThumbnailURL: string
  clientExternalURL: string
  authAccountPathSuffix: string
  handlerPathSuffix: string
  onLinkAccountStatusChange?: (status: AccountLinkStatus) => void
}

/**
 * Links web3auth accounts (child account) to regular (nufi/lilico) account, (parent account)
 * Submits two transactions, first for the child publishing the capability, then parent claiming that capability
 * Consider this a POC because
 * - UX should be improved
 * - two txs replaced with single multisig
 * - hybrid custody is work in progress, so transaction scripts and arguments will change
 */
export async function experimentalLinkAccount(
  args: LinkAccountArgs,
): Promise<string> {
  const onLinkAccountStatusChange =
    args.onLinkAccountStatusChange || getDefaultOnAccountLinkStatusChange

  onLinkAccountStatusChange({status: 'initialized'})
  const childAccountInfo = await wallet.instance().ensureUserLoggedIn()

  await fcl.unauthenticate()

  await fcl.authenticate()
  const parentAddress = (await fcl.currentUser().snapshot()).addr

  onLinkAccountStatusChange({status: 'signing'})

  const signedParentTx = await sdk.resolve(
    fcl.build([
      fcl.transaction(
        getLinkAccountCadence(
          web3AuthNetworkToCadenceContractAddresses[
            childAccountInfo.web3authUserInfo.network
          ],
        ),
      ),
      fcl.args([
        fcl.arg(fcl.withPrefix(childAccountInfo.address), fcl.t.Address),
        fcl.arg(args.linkedAccountName, fcl.t.String),
        fcl.arg(args.linkedAccountDescription, fcl.t.String),
        fcl.arg(args.clientThumbnailURL, fcl.t.String),
        fcl.arg(args.clientExternalURL, fcl.t.String),
        fcl.arg(args.handlerPathSuffix, fcl.t.String),
      ]),
      fcl.proposer(fcl.authz),
      fcl.authorizations([fcl.authz]),
      fcl.payer(fcl.authz),
      fcl.limit(9999),
    ]),
  )

  await fcl.unauthenticate()

  await fcl.authenticate({
    service: serviceDefinition(
      web3AuthFclServices[childAccountInfo.web3authUserInfo.loginProvider],
    ),
  })

  const childTxId = await fcl.mutate({
    cadence: publishAccountCadence,
    args: (arg, t) => [
      arg(parentAddress, t.Address),
      arg(args.authAccountPathSuffix, t.String),
    ],
  })

  onLinkAccountStatusChange({status: 'submitting'})

  await fcl.tx(childTxId).onceSealed()

  const {transactionId: parentTxId} = await fcl.send(signedParentTx)

  fcl.tx(parentTxId).subscribe((transaction) => {
    if (transaction.statusString === 'PENDING') {
      onLinkAccountStatusChange({status: 'tx_pending', transaction})
    } else if (transaction.statusString === 'EXECUTED') {
      onLinkAccountStatusChange({status: 'tx_executed', transaction})
    } else if (
      transaction.statusString === 'SEALED' &&
      !transaction.errorMessage
    ) {
      onLinkAccountStatusChange({status: 'tx_success', transaction})
    } else if (transaction.errorMessage && transaction.errorMessage !== '') {
      onLinkAccountStatusChange({status: 'tx_fail', transaction})
    }
  })

  return parentTxId
}
