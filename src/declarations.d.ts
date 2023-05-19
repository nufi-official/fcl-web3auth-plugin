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
  type Event = {
    blockId: string
    blockHeight: number
    blockTimestamp: string
    type: string
    transactionId: string
    transactionIndex: number
    eventIndex: number
    data: unknown
  }
  type TransactionMetadata = {
    blockId: string
    events: Event[]
    statusString: 'PENDING' | 'EXECUTED' | 'SEALED'
    errorMessage: string
    status: number
    statusCode: number
  }
  export type Transaction = TransactionMetadata & {
    onceExecuted: () => Promise<TransactionResult>
    onceSealed: () => Promise<TransactionResult>
    onceFinalized: () => Promise<TransactionResult>
  }
  export function tx(txId: string): {
    subscribe(cb: (tx: TransactionMetadata) => void): void
  } & Transaction
  export const authz: Authorization
  export function arg(argValue: unknown, argType: unknown): Arg
  export async function build(
    args: unknown[] = [],
    opts = {},
  ): Promise<BuiltTransaction>
  export async function send(
    args: unknown[] | unknown = [],
    opts = {},
  ): Promise<{transactionId: string}>
  export function transaction(code: string): unknown
  export function args(args: Arg[]): unknown
  export function proposer(auth: Authorization): unknown
  export function payer(auth: Authorization): unknown
  export function authorizations(authorizations: Authorization[]): unknown
  export function limit(l: number): unknown

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

  const UFix64: unknown
  const Address: unknown
  const String: unknown
  const UInt32: unknown
  const UInt64: unknown
  const Int: unknown

  export const t = {
    UFix64,
    Address,
    String,
    Optional,
    UInt32,
    UInt64,
    Int,
  }
}

declare module 'sha2' {
  export function SHA256(input: Buffer): Buffer
}

declare module '@onflow/sdk' {
  export async function resolve<T>(args: unknown, opts = {}): Promise<T>
}
