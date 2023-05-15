import {AccountProofData} from '../connector/types'
import {assert} from '../typeUtils'
import {FlowportApiConnection} from '../flowportApi'
import {addDomainTagToUserMessage} from './utils'
import {AccountInfo, AccountInfoOnChain, PubKey} from './types'
import * as fcl from '@onflow/fcl'
import {Web3AuthConnection} from '../web3auth/connection'
import {hashMsgHex, secp256k1, seedToKeyPair} from './signUtils'
import {Web3AuthLoginProvider} from '../web3auth/types'

export class Wallet {
  private _accountInfo: AccountInfo | null = null
  constructor(
    private web3AuthConnection: Web3AuthConnection,
    private flowportApiConnection: FlowportApiConnection,
  ) {
    this.web3AuthConnection = web3AuthConnection
    this.flowportApiConnection = flowportApiConnection
  }

  private async signMessage(message: string): Promise<string> {
    assert(!!this._accountInfo)
    const signature = secp256k1
      .keyFromPrivate(Buffer.from(this._accountInfo.privKey, 'hex'))
      .sign(hashMsgHex(message))
    const n = 32
    const r = signature.r.toArrayLike(Buffer, 'be', n)
    const s = signature.s.toArrayLike(Buffer, 'be', n)
    return await Promise.resolve(Buffer.concat([r, s]).toString('hex'))
  }

  signTxMessage = (message: string) => this.signMessage(message)

  signUserMessage = (message: string) => {
    return this.signMessage(addDomainTagToUserMessage(message))
  }

  signProofOfAccountOwnership = (proofData: AccountProofData) => {
    assert(!!this._accountInfo)
    const message = fcl.WalletUtils.encodeAccountProof({
      appIdentifier: proofData.appIdentifier,
      address: this._accountInfo.address,
      nonce: proofData.nonce,
    })
    return this.signMessage(message)
  }

  ensureUserLoggedIn = async (
    loginProvider: Web3AuthLoginProvider,
  ): Promise<AccountInfo> => {
    // TODO: make web3user info part of the account info and check if the passed provider is the same
    const {privateKey} = (await this.web3AuthConnection.isLoggedIn())
      ? await this.web3AuthConnection.reLogin()
      : await this.web3AuthConnection.login(loginProvider)
    return this.login(privateKey)
  }

  private login = async (privateKey: Buffer): Promise<AccountInfo> => {
    const rootKeyPair = seedToKeyPair(privateKey.toString('hex'))
    const accountInfoOnChain = await this.ensureAccountIsCreatedOnChain(
      rootKeyPair.pubKey,
    )
    this._accountInfo = {...accountInfoOnChain, privKey: rootKeyPair.privKey}
    return this._accountInfo
  }

  private ensureAccountIsCreatedOnChain = async (
    publicKey: PubKey,
  ): Promise<AccountInfoOnChain> => {
    const {address} =
      (await this.flowportApiConnection.getAccountInfo(publicKey)) ||
      (await this.flowportApiConnection.createAccount(publicKey))
    const {keys, ...rest} = await fcl.account(address)
    const pubKeyInfo = keys.find((k) => k.publicKey === publicKey)
    assert(!!pubKeyInfo)
    return {...rest, pubKeyInfo}
  }

  logout = async () => {
    await this.web3AuthConnection.logout()
    this._accountInfo = null
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
  ) => {
    wallet = new Wallet(web3AuthConnection, flowportApiConnection)
    return wallet
  },
}
