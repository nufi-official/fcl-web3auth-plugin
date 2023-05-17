import * as fcl from '@onflow/fcl'

// https://github.com/onflow/fcl-js/blob/master/packages/fcl/src/wallet-provider-spec/authorization-function.md
export const getAuthorization =
  (
    address: string,
    keyId: string,
    signFn: (message: string) => Promise<string>,
  ): fcl.Authorization =>
  (account: fcl.Account): fcl.Account => ({
    ...account,
    tempId: `${address}-${keyId}`,
    addr: fcl.sansPrefix(address),
    keyId: Number(keyId),
    signingFunction: async (signable: {
      message: string
    }): Promise<fcl.SignFnResult> => ({
      addr: fcl.withPrefix(address),
      keyId: Number(keyId),
      signature: await signFn(signable.message),
    }),
  })
