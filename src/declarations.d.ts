declare module '@onflow/fcl' {
  export function config(settings: Record<string, unknown>): void
  export async function authenticate(args?: {
    service?: unknown
  }): Promise<unknown>
  export function withPrefix(address: string): string
  export async function account(address: string): Promise<{
    address: string
    balance: number
    code: string
    contracts: unknown
    keys: {
      index: number
      publicKey: string
      signAlgo: number
      hashAlgo: number
      weight: number
      sequenceNumber: number
      revoked: boolean
    }[]
  }>
  type CurrentUser = (() => {
    snapshot: () => Promise<{addr: string}>
  }) & {authorization: Authorization}
  export const currentUser: CurrentUser
  export function unauthenticate()
  export function mutate(args: {
    cadence: string
    args: (arg, t) => Array
    authorizations?: Authorization[]
  }): Promise<string>
  export function tx(txId: string): {
    subscribe(
      cb: (tx: {
        statusString: 'PENDING' | 'EXECUTED' | 'SEALED'
        errorMessage: string
      }) => void,
    ): void
  }
  export const authz: Authorization

  export const WalletUtils: {
    injectExtService(service: unknown): void
    encodeMessageFromSignable(signable: unknown, signerAddress: unknown): string
    ({address, nonce, appIdentifier}, includeDomainTag = true)
    encodeAccountProof(
      {
        address,
        nonce,
        appIdentifier,
      }: {address: string; nonce: string; appIdentifier: string},
      includeDomainTag = true,
    )
  }

  export type Account = {
    kind: 'ACCOUNT'
    tempId: string
    addr: string
    keyId: number
    sequenceNum: number
    signature: unknown
    resolve: unknown
    role: {
      proposer: boolean
      authorizer: boolean
      payer: boolean
      param: boolean
    }
    signingFunction: (signable: {message: string}) => Promise<fcl.SignFnResult>
  }

  export type SignFnResult = {
    addr: string
    keyId: number
    signature: string
  }

  export type Authorization = (account: Account) => Account
  export function sansPrefix(address: string): string
}

declare module 'sha2' {
  export function SHA256(input: Buffer): Buffer
}
