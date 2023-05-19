import {bip32} from './bip32'
import {assert} from '../typeUtils'
import {ec as EC} from 'elliptic'
import {SHA256 as SHA2} from 'sha2'
import {PrivKey, PubKey, RootKeyPair} from './types'

// https://www.oreilly.com/library/view/mastering-bitcoin-2nd/9781491954379/ch04.html#idm139772240917008
const sansUncompressedPrefix = (uncompressedPubKey: string): PubKey =>
  uncompressedPubKey.slice(2) as PubKey

export const secp256k1 = new EC('secp256k1')

export const seedToKeyPair = (rootSeed: string): RootKeyPair => {
  const path = "m/44'/539'/0'/0/0"
  const rootNode = bip32.fromSeed(Buffer.from(rootSeed, 'hex'))
  const child = rootNode.derivePath(path)
  assert(!!child.privateKey)

  return {
    privKey: child.privateKey.toString('hex') as PrivKey,
    pubKey: sansUncompressedPrefix(
      secp256k1.keyFromPublic(child.publicKey).getPublic().encode('hex', false),
    ),
  }
}

export const hashMsgHex = (msgHex: string): Buffer => {
  return SHA2(Buffer.from(msgHex, 'hex'))
}
