import * as fcl from '@onflow/fcl'
import {NewType} from '../typeUtils'
import {Web3authUserMetadata as Web3AuthUserMetadata} from '../web3auth/types'
import {SigningMetadata} from '../ui/types'

export type PubKey = NewType<'PubKeyHex', string>

export type PrivKey = NewType<'PrivKey', string>

export type RootKeyPair = {
  privKey: PrivKey
  pubKey: PubKey
}

type FclAccountInfo = Awaited<ReturnType<typeof fcl.account>>

type AccountInfoOnChain = Omit<FclAccountInfo, 'keys'> & {
  pubKeyInfo: FclAccountInfo['keys'][number]
}

export type AccountInfo = AccountInfoOnChain & {
  privKey: PrivKey
  web3authUserInfo: Web3AuthUserMetadata
}

export type WalletActionsCallbacks = {
  onCreateAccount: {
    start: () => unknown
    end: () => unknown
  }
  confirmSign: (
    onSign: () => Promise<string>,
    metadata: SigningMetadata,
  ) => Promise<string>
}
