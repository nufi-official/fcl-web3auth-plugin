import {AccountProofData} from '../connector/types'
import {assert} from '../typeUtils'
import {FlowportApiConnection} from '../flowportApi'
import {Web3AuthProvider} from '../web3auth'
import {addDomainTagToUserMessage} from './utils'
import {AccountInfo} from './types'
import * as fcl from '@onflow/fcl'
import {Web3AuthLoginProvider} from '../web3auth/types'

export class Wallet {
  private _accountInfo: AccountInfo | undefined
  constructor(
    private web3AuthProvider: Web3AuthProvider,
    private flowportApiConnection: FlowportApiConnection,
  ) {
    this.web3AuthProvider = web3AuthProvider
    this.flowportApiConnection = flowportApiConnection
  }

  get accountInfo() {
    assert(!!this._accountInfo)
    return this._accountInfo
  }

  login = (loginProvider: Web3AuthLoginProvider) =>
    this.web3AuthProvider.login(loginProvider)

  signTxMessage = (message: string) =>
    this.web3AuthProvider.signMessage(message)

  signUserMessage = (message: string) => {
    return this.web3AuthProvider.signMessage(addDomainTagToUserMessage(message))
  }

  signProofOfAccountOwnership = (proofData: AccountProofData) => {
    const message = fcl.WalletUtils.encodeAccountProof({
      appIdentifier: proofData.appIdentifier,
      address: this.accountInfo.address,
      nonce: proofData.nonce,
    })
    return this.web3AuthProvider.signMessage(message)
  }

  ensureAccountIsCreatedOnChain = async (): Promise<AccountInfo> => {
    const publicKey = this.web3AuthProvider.publicKey
    const {address} =
      (await this.flowportApiConnection.getAccountInfo(publicKey)) ||
      (await this.flowportApiConnection.createAccount(publicKey))
    const {keys, ...rest} = await fcl.account(address)
    const pubKeyInfo = keys.find((k) => k.publicKey === publicKey)
    assert(!!pubKeyInfo)
    const accountInfo = {...rest, pubKeyInfo}
    this._accountInfo = accountInfo
    return {...rest, pubKeyInfo}
  }
}
