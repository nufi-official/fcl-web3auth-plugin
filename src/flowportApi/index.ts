import * as fcl from '@onflow/fcl'
import {HttpRequestError, request} from './request'
import {PubKey} from '../web3auth/types'

type FlowportAccountInfoSuccessResponse = {
  address: string
  creationTxId: string
  lockedAddress: string
  publicKeys: {
    publicKey: string
    signatureAlgorithm: string
    hashAlgorithm: string
  }[]
}

type FlowportAccountInfoResponse =
  | {error: string}
  | FlowportAccountInfoSuccessResponse

const parseFlowportAccountInfoSuccessResponse = (
  accountInfoResponse: FlowportAccountInfoSuccessResponse,
) => ({
  address: fcl.withPrefix(accountInfoResponse.address),
})

const parseFlowportAccountInfoResponse = (
  accountInfoResponse: FlowportAccountInfoResponse,
) => {
  if ('error' in accountInfoResponse) {
    // https://github.com/onflow/flow-account-api/blob/9762c8f7a38dd64e2603319a57c84e48156ca145/wallet/service.go#L196
    if (accountInfoResponse.error.endsWith('does not exist')) {
      return null
    }
    throw accountInfoResponse.error
  }
  return parseFlowportAccountInfoSuccessResponse(accountInfoResponse)
}

export class FlowportApiConnection {
  constructor(private url: string) {
    this.url = url
  }

  getAccountInfo = async (publicKey: PubKey) => {
    const accountInfoResponse = request<FlowportAccountInfoResponse>({
      url: `${this.url}/accounts?publicKey=${publicKey}`,
    }).catch((e) => {
      if (e instanceof HttpRequestError && e?.httpStatus === 404) {
        return JSON.parse(e.responseText)
      }
      throw e
    })
    return parseFlowportAccountInfoResponse(await accountInfoResponse)
  }

  createAccount = async (publicKey: PubKey) => {
    const accountInfoResponse =
      await request<FlowportAccountInfoSuccessResponse>({
        url: `${this.url}/accounts`,
        method: 'POST',
        body: JSON.stringify({
          publicKey,
          signatureAlgorithm: 'ECDSA_secp256k1',
          hashAlgorithm: 'SHA2_256',
        }),
        headers: {'Content-Type': 'application/json'},
      })
    return parseFlowportAccountInfoSuccessResponse(accountInfoResponse)
  }
}

let flowportApiConnection: FlowportApiConnection | undefined

export default {
  instance: (): FlowportApiConnection => {
    if (!flowportApiConnection) {
      throw new Error('Web3Auth connection not created')
    }
    return flowportApiConnection
  },
  create: (url: string) => {
    flowportApiConnection = new FlowportApiConnection(url)
  },
}
