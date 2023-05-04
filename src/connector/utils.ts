import {Equals, typeAssert} from '../typeUtils'
import {
  AccountProofData,
  ExtensionServiceInitiationMessage,
  FclObject,
  Message,
  MessageType,
  ObjectBase,
  Service,
  Signable,
} from './types'

/* Additional utilities */

export const version = '1.0.0'

typeAssert<Equals<typeof version, ObjectBase['f_vsn']>>()

const messageTypes = [
  'FCL:VIEW:READY',
  'FCL:VIEW:READY:RESPONSE',
  'FCL:VIEW:RESPONSE',
  'FCL:VIEW:CLOSE',
] as const

typeAssert<Equals<(typeof messageTypes)[number], MessageType>>()

/* eslint-disable @typescript-eslint/no-explicit-any */
export const isObject = (msg: any): msg is FclObject =>
  typeof msg === 'object' &&
  msg.f_vsn === version &&
  typeof msg.f_type === 'string'

export const isSignable = (msg: any): msg is Signable =>
  typeof msg === 'object' && msg.f_vsn === '1.0.1' && msg.f_type === 'Signable'

export const isMessage = (msg: any): msg is Message =>
  messageTypes.includes(msg?.type)

export const isExtensionServiceInitiationMessage = (
  msg: any,
): msg is ExtensionServiceInitiationMessage => {
  if (typeof msg !== 'object') return false
  const service = msg.service
  return msg.service && 'type' in service && 'endpoint' in service
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const isAccountProofAuthMsg = (
  msgBody: unknown,
): msgBody is AccountProofData => {
  return !!(
    msgBody &&
    typeof msgBody === 'object' &&
    'appIdentifier' in msgBody &&
    'nonce' in msgBody
  )
}

export const getFclServiceUid = (appId: string, serviceType: Service['type']) =>
  `${appId}#${serviceType}`
