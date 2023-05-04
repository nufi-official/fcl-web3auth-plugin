/* Types from this PR: https://github.com/onflow/fcl-js/pull/1261 */

/** The kinds of FCL objects available. */
export type ObjectType =
  | 'PollingResponse'
  | 'Service'
  | 'Identity'
  | 'ServiceProvider'
  | 'AuthnResponse'
  | 'Signable'
  | 'CompositeSignature'
  | 'OpenID'

/** The fields common to all FCL objects. */
export interface ObjectBase<Version = '1.0.0'> {
  f_vsn: Version
  f_type: ObjectType
}

export type FclObject =
  | PollingResponse
  | Service
  | Identity
  | ServiceProvider
  | AuthnResponse
  | Signable
  | CompositeSignature
  | OpenID
  | UserMessage
  | AccountProof

/**
 * Each response back to FCL must be "wrapped" in a `PollingResponse`. The
 * `status` field determines the meaning of the response:
 * - An `APPROVED` status means that the request has been approved. The `data`
 *   field should be present.
 * - A `DECLINED` status means that the request has been declined. The `reason`
 *   field should contain a human readable reason for the refusal.
 * - A `PENDING` status means that the request is being processed. More
 *   `PENDING` responses may follow, but eventually a non-pending status
 *   should be returned. The `updates` and `local` fields may be present.
 * - The `REDIRECT` status is reserved, and should not be used by wallet
 *   services.
 *
 * In summary, zero or more `PENDING` responses should be followed by a
 * non-pending response. It is entirely acceptable for your service to
 * immediately return an `APPROVED` Polling Response, skipping a `PENDING`
 * state.
 */
export interface PollingResponse extends ObjectBase {
  f_type: 'PollingResponse'
  status: 'APPROVED' | 'DECLINED' | 'PENDING' | 'REDIRECT'
  reason: string | null
  data?: FclObject
  updates?: FclObject
  local?: FclObject
}

export type ServiceType =
  | 'authn'
  | 'authz'
  | 'user-signature'
  | 'pre-authz'
  | 'open-id'
  | 'account-proof'

export type ServiceMethod =
  | 'HTTP/POST'
  | 'IFRAME/RPC'
  | 'POP/RPC'
  | 'TAB/RPC'
  | 'EXT/RPC'
  | 'DATA'

export interface Service extends ObjectBase {
  f_type: 'Service'
  /** The type of this service. */
  type: ServiceType
  /** The service method this service uses. `DATA` means that the purpose of
   * this service is just to provide the information in this `Service` object,
   * and no active communication services are provided. */
  method: ServiceMethod
  /** A unique identifier for the service. A common scheme for deriving this is
   * to use `'wallet-name#${type}'`, where `${type}` refers to the type of
   * this service. */
  uid: string
  /** Defines where to communicate with the service.
   *
   * When `method` is `EXT/RPC`, this can be an arbitrary unique string, and
   * the extension will need to use it to identify its own services. A common
   * scheme for deriving the `endpoint` is to use `'ext:${address}'`, where
   * `${address}` refers to the wallet's address. (See `ServiceProvider` for
   * more information.)
   */
  endpoint: string
  /** The wallet's internal identifier for the user. If no other identifier is
   * used, simply the user's flow account address can be used here. */
  id: string
  /** Information about the identity of the user. */
  identity: Identity
  /** Information about the wallet. */
  provider?: ServiceProvider
  /** Additional information used with a service of type `open-id`. */
  data?: FclObject
}

/** This object is used to define the identity of the user. */
export interface Identity extends ObjectBase {
  f_type: 'Identity'
  /** The flow account address of the user. */
  address: string
  /** The id of the key associated with this account that will be used for
   * signing. */
  keyId?: number
}

/** This object is used to communicate information about a wallet. */
export interface ServiceProvider extends ObjectBase {
  f_type: 'ServiceProvider'
  /** A flow account address owned by the wallet. It is unspecified what this
   * will be used for. */
  address: string
  /** The name of the wallet. */
  name?: string
  /** A short description for the wallet. */
  description?: string
  /** An image URL for the wallet's icon. */
  icon?: string
  /** The wallet's website. */
  website?: string
  /** A URL the user can use to get support with the wallet. */
  supportUrl?: string
  /** An e-mail address the user can use to get support with the wallet. */
  supportEmail?: string
}

/** This object is used to inform FCL about the services a wallet provides. */
export interface AuthnResponse extends ObjectBase {
  f_type: 'AuthnResponse'
  addr: string
  services: Service[]
}

export interface Signable extends ObjectBase<'1.0.1'> {
  f_type: 'Signable'
  addr: string
  keyId: number
  voucher: {
    cadence: string
    refBlock: string
    computeLimit: number
    arguments: {
      type: string
      value: unknown
    }[]
    proposalKey: {
      address: string
      keyId: number
      sequenceNum: number
    }
    payer: string
    authorizers: string[]
  }
}

export interface CompositeSignature extends ObjectBase {
  f_type: 'CompositeSignature'
  addr: string
  keyId: number
  signature: string
}

type OpenID = never // TODO

type UserMessage = {message: string}

type AccountProof = {
  f_type: 'account-proof'
  f_vsn: '2.0.0'
  address: string
  nonce: string
  signatures: CompositeSignature[]
}

export type ExtensionServiceInitiationMessage = {
  service: Service
}

export type MessageType =
  | 'FCL:VIEW:READY'
  | 'FCL:VIEW:READY:RESPONSE'
  | 'FCL:VIEW:RESPONSE'
  | 'FCL:VIEW:CLOSE'

export type Message = {
  type: MessageType
  body?: FclObject
  service?: Service
}

// https://developers.flow.com/tools/fcl-js/reference/proving-authentication
export type AccountProofData = {
  // e.g. "Awesome App (v0.0)" - A human readable string to identify your application during signing
  appIdentifier: string
  // e.g. "75f8587e5bd5f9dcc9909d0dae1f0ac5814458b2ae129620502cb936fde7120a" - minimum 32-byte random nonce as hex string
  nonce: string
}
