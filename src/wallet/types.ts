import * as fcl from '@onflow/fcl'

type FclAccountInfo = Awaited<ReturnType<typeof fcl.account>>

export type AccountInfo = Omit<FclAccountInfo, 'keys'> & {
  pubKeyInfo: FclAccountInfo['keys'][number]
}
