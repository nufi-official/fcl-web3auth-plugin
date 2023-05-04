import {Web3AuthLoginProvider, Web3AuthNetworkType} from './web3auth/types'
import web3AuthProvider from './web3auth'
import {
  web3AuthNetworkToFlowportApiMapping,
  web3AuthProviderMetadata,
} from './constants'
import flowportApi from './flowportApi'
import {appendLoginModal} from './modal'
import {authWithProvider} from './actions'
import {Web3AuthConnection} from './web3auth/connection'

type ConfigArgs = {clientId: string; networkType: Web3AuthNetworkType}

export function config({clientId, networkType}: ConfigArgs) {
  web3AuthProvider.create(new Web3AuthConnection(networkType, clientId))
  flowportApi.create(web3AuthNetworkToFlowportApiMapping[networkType])
}

type AuthArgs =
  | {
      loginProvider: Web3AuthLoginProvider
    }
  | {
      loginProviderWhiteList?: Web3AuthLoginProvider[]
    }

export function auth(args?: AuthArgs) {
  if (args && 'loginProvider' in args) {
    authWithProvider(args.loginProvider)
    return
  }
  if (args && 'loginProviderWhiteList' in args) {
    const whitelist = args.loginProviderWhiteList
    const web3AuthProviderMetadataWhitelist = whitelist
      ? web3AuthProviderMetadata.filter(({id}) => whitelist.includes(id))
      : web3AuthProviderMetadata
    appendLoginModal(web3AuthProviderMetadataWhitelist)
    return
  }
  appendLoginModal(web3AuthProviderMetadata)
}

export {linkAccount} from './actions'

export {web3AuthProviderMetadata as loginProviders} from './constants'
