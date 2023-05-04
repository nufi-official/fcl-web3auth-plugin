import {listenToMessages} from './connector'
import {createApi} from './connector/api'
import {serviceDefinition} from './connector/serviceDefinition'
import {Wallet} from './wallet'
import flowportApi from './flowportApi'
import web3AuthProvider from './web3auth'
import {Web3AuthLoginProvider} from './web3auth/types'
import * as fcl from '@onflow/fcl'
import {web3AuthFclServices} from './constants'

export async function authWithProvider(loginProvider: Web3AuthLoginProvider) {
  const wallet = new Wallet(web3AuthProvider.instance(), flowportApi.instance())
  const api = createApi(wallet, web3AuthFclServices)
  listenToMessages(api)
  await fcl.authenticate({
    service: serviceDefinition(web3AuthFclServices[loginProvider]),
  })
}
