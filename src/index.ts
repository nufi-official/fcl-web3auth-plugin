import {
  Web3AuthLoginProvider,
  Web3AuthMfaLevel,
  Web3AuthMode,
  Web3AuthNetwork,
} from './web3auth/types'
import {
  web3AuthFclServices,
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
import {assert} from './typeUtils'

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
