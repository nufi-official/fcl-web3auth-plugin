import {Web3AuthLoginProvider, Web3AuthNetworkType} from './web3auth/types'
import web3AuthProvider from './web3auth'
import {
  web3AuthFclServices,
  web3AuthNetworkToFlowportApiMapping,
  web3AuthProviderMetadata,
} from './constants'
import {FlowportApiConnection} from './flowportApi'
import {appendLoginModal} from './modal'
import {Web3AuthConnection} from './web3auth/connection'
import {Wallet} from './wallet'
import {createApi} from './connector/api'
import {listenToMessages} from './connector'
import * as fcl from '@onflow/fcl'
import {serviceDefinition} from './connector/serviceDefinition'

type InitArgs = {clientId: string; networkType: Web3AuthNetworkType}

export function init({clientId, networkType}: InitArgs) {
  web3AuthProvider.create(new Web3AuthConnection(networkType, clientId))
  const wallet = new Wallet(
    web3AuthProvider.instance(),
    new FlowportApiConnection(web3AuthNetworkToFlowportApiMapping[networkType]),
  )
  const api = createApi(wallet, web3AuthFclServices)
  listenToMessages(api)
}

async function authWithProvider(loginProvider: Web3AuthLoginProvider) {
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
  // instead of exposing fn for unauth, we just logout user every time before he tries to log in
  web3AuthProvider.instance().logout()
  if (args && 'loginProvider' in args) {
    await authWithProvider(args.loginProvider)
    return
  }
  if (args && 'loginProviderWhiteList' in args) {
    const whitelist = args.loginProviderWhiteList
    const web3AuthProviderMetadataWhitelist = whitelist
      ? web3AuthProviderMetadata.filter(({id}) => whitelist.includes(id))
      : web3AuthProviderMetadata
    appendLoginModal(web3AuthProviderMetadataWhitelist, authWithProvider)
    return
  }
  appendLoginModal(web3AuthProviderMetadata, authWithProvider)
}

export {web3AuthProviderMetadata as loginProviders} from './constants'
