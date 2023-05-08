import {Web3AuthLoginProvider, Web3AuthNetworkType} from './web3auth/types'
import web3AuthProvider from './web3auth'
import {
  web3AuthProviderMetadata,
} from './constants'
import {Web3AuthConnection} from './web3auth/connection'

type ConfigArgs = {clientId: string; networkType: Web3AuthNetworkType}

export function config({clientId, networkType}: ConfigArgs) {
  web3AuthProvider.create(new Web3AuthConnection(networkType, clientId))
}
