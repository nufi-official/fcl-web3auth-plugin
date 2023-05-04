declare module '@onflow/fcl' {
  export function config(settings?: Record<string, unknown>): void
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
  export function currentUser(): {snapshot: () => Promise<{addr: string}>}
  export function unauthenticate()
  export function mutate(args: {
    cadence: string
    args: (arg, t) => Array
  }): Promise<string>

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
}

declare module 'sha2' {
  export function SHA256(input: Buffer): Buffer
}
