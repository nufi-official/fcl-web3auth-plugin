import {AccountProofData} from '../connector/types'
import {assert} from '../typeUtils'
import {FlowportApiConnection} from '../flowportApi'
import {addDomainTagToUserMessage} from './utils'
import {AccountInfo, PubKey, WalletActionsCallbacks} from './types'
import * as fcl from '@onflow/fcl'
import {Web3AuthConnection} from '../web3auth/connection'
import {hashMsgHex, secp256k1, seedToKeyPair} from './signUtils'
import {Web3AuthLoginProvider, Web3authUserMetadata} from '../web3auth/types'

export class Wallet {
  public accountInfo: AccountInfo | null = null
  constructor(
    private web3AuthConnection: Web3AuthConnection,
    private flowportApiConnection: FlowportApiConnection,
    private _callbacks: WalletActionsCallbacks,
  ) {
    this.web3AuthConnection = web3AuthConnection
    this.flowportApiConnection = flowportApiConnection
    this._callbacks = _callbacks
  }

  set callbacks(o: WalletActionsCallbacks) {
    this._callbacks = o
  }

  private async signMessage(message: string): Promise<string> {
    assert(!!this.accountInfo)
    const signature = secp256k1
      .keyFromPrivate(Buffer.from(this.accountInfo.privKey, 'hex'))
      .sign(hashMsgHex(message))
    const n = 32
    const r = signature.r.toArrayLike(Buffer, 'be', n)
    const s = signature.s.toArrayLike(Buffer, 'be', n)
    return await Promise.resolve(Buffer.concat([r, s]).toString('hex'))
  }

  signTxMessage = (message: string) =>
    this._callbacks.confirmSign(() => this.signMessage(message), {type: 'tx'})

  signUserMessage = (message: string) =>
    this._callbacks.confirmSign(
      () => this.signMessage(addDomainTagToUserMessage(message)),
      {type: 'message'},
    )

  signProofOfAccountOwnership = (proofData: AccountProofData) => {
    assert(!!this.accountInfo)
    const message = fcl.WalletUtils.encodeAccountProof({
      appIdentifier: proofData.appIdentifier,
      address: this.accountInfo.address,
      nonce: proofData.nonce,
    })
    return this.signMessage(message)
  }

  ensureUserLoggedIn = async (
    loginProvider: Web3AuthLoginProvider,
  ): Promise<AccountInfo> => {
    try {
      if (
        this.accountInfo &&
        this.accountInfo.web3authUserInfo.loginProvider === loginProvider
      ) {
        return this.accountInfo
      }
      if (await this.web3AuthConnection.isLoggedIn()) {
        // re-login in web3Auth with the previously logged user to get user info
        const userInfo = await this.web3AuthConnection.reLogin()
        // login only if the login provider of the previous user match the current login provider
        if (userInfo.userMetadata.loginProvider === loginProvider) {
          return this.login(userInfo)
        }
      }
      // if not logged in, do fresh login
      const userInfo = await this.web3AuthConnection.login(loginProvider)
      return this.login(userInfo)
    } catch (e) {
      await this._callbacks.onLoginStatusChange({status: 'error', error: e})
      throw e
    }
  }

  private login = async (userInfo: {
    privateKey: Buffer
    userMetadata: Web3authUserMetadata
  }): Promise<AccountInfo> => {
    const rootKeyPair = seedToKeyPair(userInfo.privateKey.toString('hex'))
    const address = await this.ensureAccountIsCreatedOnChain(rootKeyPair.pubKey)
    const {keys, ...rest} = await fcl.account(address)
    const pubKeyInfo = keys.find((k) => k.publicKey === rootKeyPair.pubKey)
    assert(!!pubKeyInfo)
    const accountInfoOnChain = {...rest, pubKeyInfo}
    this.accountInfo = {
      ...accountInfoOnChain,
      privKey: rootKeyPair.privKey,
      web3authUserInfo: userInfo.userMetadata,
    }
    return this.accountInfo
  }

  private ensureAccountIsCreatedOnChain = async (publicKey: PubKey) => {
    const accountInfo = await this.flowportApiConnection.getAccountInfo(
      publicKey,
    )
    if (accountInfo) {
      return accountInfo.address
    }
    await this._callbacks.onLoginStatusChange({status: 'creating_account'})
    return this.flowportApiConnection
      .createAccount(publicKey)
      .then(async (res) => {
        await this._callbacks.onLoginStatusChange({status: 'logged_in'})
        return res.address
      })
  }

  logout = async () => {
    await this.web3AuthConnection.logout()
    this.accountInfo = null
    this._callbacks.onLoginStatusChange({status: 'logged_out'})
  }
}

let wallet: Wallet | undefined

export default {
  instance: (): Wallet => {
    assert(!!wallet, 'Wallet not created')
    return wallet
  },
  create: (
    web3AuthConnection: Web3AuthConnection,
    flowportApiConnection: FlowportApiConnection,
    callbacks: WalletActionsCallbacks,
  ) => {
    wallet = new Wallet(web3AuthConnection, flowportApiConnection, callbacks)
    return wallet
  },
}
