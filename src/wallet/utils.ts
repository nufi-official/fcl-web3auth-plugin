// https://github.com/onflow/fcl-js/blob/master/packages/fcl/src/wallet-provider-spec/user-signature.md
export const addDomainTagToUserMessage = (message: string): string => {
  const rightPaddedHexBuffer = (value: string, pad: number): Buffer =>
    Buffer.from(value.padEnd(pad * 2, '0'), 'hex')

  const domainTag = rightPaddedHexBuffer(
    Buffer.from('FLOW-V0.0-user').toString('hex'),
    32,
  ).toString('hex')

  return domainTag + message
}
