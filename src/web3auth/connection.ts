import {Web3AuthCore} from '@web3auth/core'
import {OpenloginAdapter} from '@web3auth/openlogin-adapter'
import {ADAPTER_STATUS, CHAIN_NAMESPACES, WALLET_ADAPTERS} from '@web3auth/base'
import type {
  Web3AuthLoginProvider,
  Web3AuthMfaLevel,
  Web3AuthMode,
  Web3AuthNetwork,
  Web3authUserMetadata,
} from './types'
import {assert} from '../typeUtils'

export class Web3AuthConnection {
  private web3auth: Web3AuthCore
  private mfaLevel: Web3AuthMfaLevel

  constructor(
    private network: Web3AuthNetwork,
    clientId: string,
    mfaLevel: Web3AuthMfaLevel,
    uxMode: Web3AuthMode,
  ) {
    this.network = network
    this.mfaLevel = mfaLevel
    this.web3auth = new Web3AuthCore({
      clientId,
      web3AuthNetwork: this.network,
      chainConfig: {
        chainNamespace: CHAIN_NAMESPACES.OTHER,
      },
    })

    const openloginAdapter = new OpenloginAdapter({
      adapterSettings: {
        clientId,
        network: this.network,
        uxMode,
      },
    })
    this.web3auth.configureAdapter(openloginAdapter)
  }

  private async init() {
    if (this.web3auth.status === ADAPTER_STATUS.NOT_READY) {
      await this.web3auth.init()
    }
  }

  private async getUserInfo() {
    assert(!!this.web3auth.provider)
    const privateKey = Buffer.from(
      (await this.web3auth.provider.request({
        method: 'private_key',
      })) as string,
      'hex',
    )
    const userInfo = await this.web3auth.getUserInfo()
    const userMetadata: Web3authUserMetadata = {
      email: userInfo.email,
      name: userInfo.name,
      profileImage: userInfo.profileImage,
      loginProvider: userInfo.typeOfLogin as Web3AuthLoginProvider,
      network: this.network,
    }

    return {
      privateKey,
      userMetadata,
    }
  }

  isLoggedIn = async () => {
    await this.init()
    return this.web3auth.status === ADAPTER_STATUS.CONNECTED
  }

  reLogin = async () => {
    await this.init()
    return this.getUserInfo()
  }

  login = async (loginProvider: Web3AuthLoginProvider) => {
    await this.init()
    await this.logout()

    await this.web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      mfaLevel: this.mfaLevel,
      loginProvider,
    })

    return this.getUserInfo()
  }

  logout = async () => {
    if (await this.isLoggedIn()) await this.web3auth.logout()
  }
}
