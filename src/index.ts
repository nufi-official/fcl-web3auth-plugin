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
import {getLinkAccountCadence} from './cadence'
import {sleep} from './utils'
import {getAuthorization} from './authorization'

const getDefaultWalletCallbacks = (): WalletActionsCallbacks => {
  const ui = getUi()
  return {
    onCreateAccount: {
      start: () => ui.showLoading('Creating account...'),
      end: () => ui.close(),
    },
    confirmSign: ui.confirmSign,
    onLoginFail: (e) => {
      ui.close()
      throw e
    },
  }
}

type InitArgs = {
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

export function config(callbacks: Partial<WalletActionsCallbacks>) {
  wallet.instance().callbacks = {...getDefaultWalletCallbacks(), ...callbacks}
}

async function authWithProvider(loginProvider: Web3AuthLoginProvider) {
  // instead of exposing fn for unauth, we just logout user every time before he tries to log in
  await wallet.instance().logout()
  await fcl.authenticate({
    service: serviceDefinition(web3AuthFclServices[loginProvider]),
  })
}

type AuthArgs =
  | {
      loginProvider: Web3AuthLoginProvider
    }
  | {
      loginProviderWhiteList?: Web3AuthLoginProvider[]
    }

export async function auth(args?: AuthArgs) {
  const ui = getUi()

  if (args && 'loginProvider' in args) {
    await authWithProvider(args.loginProvider)
    return
  }

  if (args && 'loginProviderWhiteList' in args) {
    const whitelist = args.loginProviderWhiteList
    const web3AuthProviderMetadataWhitelist = whitelist
      ? web3AuthProviderMetadata.filter(({loginProvider}) =>
          whitelist.includes(loginProvider),
        )
      : web3AuthProviderMetadata
    ui.showLoginModal({
      onAuthWithProvider: authWithProvider,
      loginProvidersMetadata: web3AuthProviderMetadataWhitelist,
    })
    return
  }

  ui.showLoginModal({
    onAuthWithProvider: authWithProvider,
    loginProvidersMetadata: web3AuthProviderMetadata,
  })
}

export {web3AuthProviderMetadata as loginProviders} from './constants'

type LinkAccountArgs = {
  linkedAccountName: string
  linkedAccountDescription: string
  clientThumbnailURL: string
  clientExternalURL: string
  authAccountPathSuffix: string
  handlerPathSuffix: string
}

export async function linkAccount(args: LinkAccountArgs): string {
  const childAccountInfo = await wallet.instance().ensureUserLoggedIn()
  const childAccountAuthorization = getAuthorization(
    childAccountInfo.address,
    childAccountInfo.pubKeyInfo.index.toString(),
    wallet.instance().signTxMessage,
  )
  const serviceDefinitionProps =
    web3AuthFclServices[childAccountInfo.web3authUserInfo.loginProvider]

  await fcl.unauthenticate()

  await fcl.authenticate()

  const ui = getUi()
  ui.showLoading('Signing transaction...')

  const txId = await fcl.mutate({
    cadence: getLinkAccountCadence(
      web3AuthNetworkToCadenceContractAddresses[
        childAccountInfo.web3authUserInfo.network
      ],
    ),
    args: (arg, t) => [
      arg(args.linkedAccountName, t.String),
      arg(args.linkedAccountDescription, t.String),
      arg(args.clientThumbnailURL, t.String),
      arg(args.clientExternalURL, t.String),
      arg(args.authAccountPathSuffix, t.String),
      arg(args.handlerPathSuffix, t.String),
    ],
    authorizations: [fcl.currentUser.authorization, childAccountAuthorization],
  })
  console.log(txId)
  fcl.tx(txId).subscribe((tx) => {
    if (tx.statusString === 'PENDING') {
      ui.showLoading('Awaiting execution...')
    }
    if (tx.statusString === 'EXECUTED') {
      ui.showLoading('Executed, awaiting sealing...')
    }
    if (tx.statusString === 'SEALED') {
      ui.showSuccess('Linking account successful')
      sleep(1000).then(() => ui.close())
    }
    if (tx.errorMessage) {
      ui.showLoading('Linking account failed') // failure icon, setFailure text
      sleep(1000).then(() => ui.close())
    }
  })
  await fcl.unauthenticate()

  await fcl.authenticate({
    service: serviceDefinition(serviceDefinitionProps),
  })

  return txId
}
