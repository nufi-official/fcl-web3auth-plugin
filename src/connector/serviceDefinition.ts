import * as TypeUtils from '../typeUtils'
import {Web3AuthLoginProvider} from '../web3auth/types'
import type * as Flow from './types'
import * as FlowUtils from './utils'

export type ServiceDefinitionProps = {
  walletAddress: string
  endpoint: Web3AuthLoginProvider
  userAddress: string
  keyId: number
  appId: string
  name: string
  description: string
  icon: string
  website: string
} & (
  | {type: 'authn' | 'authz' | 'user-signature'}
  | {
      type: 'account-proof'
      signatures: Flow.CompositeSignature[]
      nonce: string
    }
)

export const serviceDefinition = (
  args: ServiceDefinitionProps,
): Flow.Service => {
  const {
    type,
    walletAddress,
    endpoint,
    userAddress,
    keyId,
    icon,
    description,
    name,
    website,
    appId,
  } = args
  const service: Flow.Service = {
    f_type: 'Service',
    f_vsn: FlowUtils.version,
    type,
    uid: FlowUtils.getFclServiceUid(appId, type),
    endpoint,
    method: 'EXT/RPC',
    id: userAddress,
    identity: {
      f_type: 'Identity',
      f_vsn: FlowUtils.version,
      address: userAddress,
      keyId,
    },
  }
  switch (args.type) {
    case 'authn':
      return {
        ...service,
        provider: {
          f_type: 'ServiceProvider',
          f_vsn: FlowUtils.version,
          address: walletAddress,
          name,
          icon,
          description,
          website,
        },
      }
    case 'authz':
    case 'user-signature':
      return service
    case 'account-proof': {
      return {
        ...service,
        method: 'DATA',
        data: {
          f_type: 'account-proof',
          f_vsn: '2.0.0',
          address: userAddress,
          nonce: args.nonce,
          signatures: args.signatures,
        },
      }
    }
    default:
      return TypeUtils.safeAssertUnreachable(args)
  }
}
