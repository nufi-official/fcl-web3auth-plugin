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

type LoginStatus =
  | {status: 'creating_account' | 'logged_in' | 'logged_out'}
  | {status: 'error'; error: unknown}

export type WalletActionsCallbacks = {
  confirmSign: (
    onSign: () => Promise<string>,
    metadata: SigningMetadata,
  ) => Promise<string>
  onLoginStatusChange: (status: LoginStatus) => unknown
}
