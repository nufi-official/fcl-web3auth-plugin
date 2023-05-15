import * as fcl from '@onflow/fcl'
import {NewType} from '../typeUtils'

export type PubKey = NewType<'PubKeyHex', string>

export type PrivKey = NewType<'PrivKey', string>

export type RootKeyPair = {
  privKey: PrivKey
  pubKey: PubKey
}

type FclAccountInfo = Awaited<ReturnType<typeof fcl.account>>

export type AccountInfoOnChain = Omit<FclAccountInfo, 'keys'> & {
  pubKeyInfo: FclAccountInfo['keys'][number]
}
export type AccountInfo = AccountInfoOnChain & {
  privKey: PrivKey
}
