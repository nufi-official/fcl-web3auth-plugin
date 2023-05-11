import type {OPENLOGIN_NETWORK_TYPE, LOGIN_PROVIDER} from '@toruslabs/openlogin'
import {NewType} from '../typeUtils'

type ValueOf<T> = T[keyof T]

export const WEB3_AUTH_NETWORKS = ['mainnet', 'testnet'] as const

export type Web3AuthNetwork = Extract<
  OPENLOGIN_NETWORK_TYPE,
  (typeof WEB3_AUTH_NETWORKS)[number]
>

export const WEB3_AUTH_LOGIN_PROVIDERS = [
  'google',
  'facebook',
  // 'twitter',
  // 'reddit',
  // 'discord',
  // 'twitch',
  // 'apple',
  // 'github',
  // 'linkedin',
  // 'line',
  // 'wechat',
] as const

export type Web3AuthLoginProvider = Extract<
  ValueOf<typeof LOGIN_PROVIDER>,
  (typeof WEB3_AUTH_LOGIN_PROVIDERS)[number]
>

export type PubKey = NewType<'PubKeyHex', string>

export type PrivKey = NewType<'PrivKey', string>

export type RootKeyPair = {
  privKey: PrivKey
  pubKey: PubKey
}
