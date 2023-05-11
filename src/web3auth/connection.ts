import {Web3AuthCore} from '@web3auth/core'
import {OpenloginAdapter} from '@web3auth/openlogin-adapter'
import {CHAIN_NAMESPACES, WALLET_ADAPTERS} from '@web3auth/base'
import type {Web3AuthLoginProvider, Web3AuthNetwork} from './types'

export class Web3AuthConnection {
  constructor(private network: Web3AuthNetwork, private clientId: string) {
    this.network = network
    this.clientId = clientId
  }

  login = async (loginProvider: Web3AuthLoginProvider) => {
    const web3auth = new Web3AuthCore({
      clientId: this.clientId,
      web3AuthNetwork: this.network,
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.OTHER,
      },
    })
    const openloginAdapter = new OpenloginAdapter({
      adapterSettings: {
        clientId: this.clientId,
        network: this.network,
        uxMode: 'popup',
      },
    })
    web3auth.configureAdapter(openloginAdapter)

    await web3auth.init()
    if (web3auth.provider) {
      await web3auth.logout()
    }

    const provider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      mfaLevel: 'none', // Pass on the mfa level of your choice: default, optional, mandatory, none
      loginProvider,
    })

    if (provider == null) {
      throw new Error('Assertion failed')
    }

    const privateKey = Buffer.from(
      (await provider.request({
        method: 'private_key',
      })) as string,
      'hex',
    )
    const userInfo = await web3auth.getUserInfo()

    return {
      privateKey,
      userInfo,
    }
  }
}
