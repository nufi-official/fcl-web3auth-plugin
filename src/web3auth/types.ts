import type {OPENLOGIN_NETWORK_TYPE, LOGIN_PROVIDER} from '@toruslabs/openlogin'

type ValueOf<T> = T[keyof T]

export const WEB3_AUTH_NETWORKS = ['mainnet', 'testnet'] as const

export type Web3AuthNetwork = Extract<
  OPENLOGIN_NETWORK_TYPE,
  (typeof WEB3_AUTH_NETWORKS)[number]
>

export type Web3AuthLoginProvider = ValueOf<typeof LOGIN_PROVIDER>

export type Web3AuthMfaLevel = 'default' | 'optional' | 'mandatory' | 'none'

export type Web3AuthMode = 'redirect' | 'popup'

export type Web3authUserMetadata = {
  email?: string
  name?: string
  profileImage?: string
  loginProvider: Web3AuthLoginProvider
  network: Web3AuthNetwork
}
