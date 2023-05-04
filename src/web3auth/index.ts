import {OpenloginUserInfo} from '@toruslabs/openlogin'
import {assert} from '../typeUtils'
import {Web3AuthConnection} from './connection'
import {Web3AuthLoginProvider, RootKeyPair} from './types'
import {hashMsgHex, secp256k1, seedToKeyPair} from './signUtils'

export class Web3AuthProvider {
  private _user: {
    rootKeyPair: RootKeyPair
    info: Partial<OpenloginUserInfo>
    loginProvider: Web3AuthLoginProvider
  } | null = null

  constructor(private web3AuthConnection: Web3AuthConnection) {
    this.web3AuthConnection = web3AuthConnection
  }

  private get privateKey() {
    assert(!!this._user)
    return this._user.rootKeyPair.privKey
  }

  get publicKey() {
    assert(!!this._user)
    return this._user.rootKeyPair.pubKey
  }

  get userInfo() {
    assert(!!this._user)
    return this._user.info
  }

  get loginProvider() {
    assert(!!this._user)
    return this._user.loginProvider
  }

  get isLoggedIn() {
    return !!this._user
  }

  get network() {
    return this.web3AuthConnection.network
  }

  public logout() {
    this._user = null
  }

  public async login(loginProvider: Web3AuthLoginProvider) {
    // if already logged in, just return
    if (this._user?.loginProvider === loginProvider) {
      return
    }
    const {privateKey, userInfo} = await this.web3AuthConnection.login(
      loginProvider,
    )
    const rootKeyPair = seedToKeyPair(privateKey.toString('hex'))
    this._user = {
      loginProvider,
      info: userInfo,
      rootKeyPair,
    }
  }

  public async signMessage(message: string): Promise<string> {
    const signature = secp256k1
      .keyFromPrivate(Buffer.from(this.privateKey, 'hex'))
      .sign(hashMsgHex(message))
    const n = 32
    const r = signature.r.toArrayLike(Buffer, 'be', n)
    const s = signature.s.toArrayLike(Buffer, 'be', n)
    return await Promise.resolve(Buffer.concat([r, s]).toString('hex'))
  }
}

let web3AuthProvider: Web3AuthProvider | undefined

export default {
  instance: (): Web3AuthProvider => {
    assert(!!web3AuthProvider, 'Web3AuthProvider not created')
    return web3AuthProvider
  },
  create: (web3AuthConnection: Web3AuthConnection) => {
    web3AuthProvider = new Web3AuthProvider(web3AuthConnection)
    return web3AuthProvider
  },
}
