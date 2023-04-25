import type * as Flow from './types'
import * as FlowUtils from /* webpackImportAllow: 'injectionPayload' */ './utils'
import {safeAssertUnreachable} from '../../../../utils/assertion'
import {dappConnectorsConfig} from '../../config'

export const serviceEndpoint = (walletAddress: string) => `ext:${walletAddress}`

const {appId, name, description, icons, website} = dappConnectorsConfig

type ServiceDefinitionArgs = {
  walletAddress: string
  userAddress: string
  keyId: number
} & (
  | {type: 'authn' | 'authz' | 'user-signature'}
  | {
      type: 'account-proof'
      signatures: Flow.CompositeSignature[]
      nonce: string
    }
)

export const serviceDefinition = (
  args: ServiceDefinitionArgs,
): Flow.Service => {
  const {type, walletAddress, userAddress, keyId} = args
  const service: Flow.Service = {
    f_type: 'Service',
    f_vsn: FlowUtils.version,
    type,
    uid: `${appId}#${type}`,
    endpoint: serviceEndpoint(walletAddress),
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
          icon: icons.fclDiscovery,
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
      return safeAssertUnreachable(args)
  }
}
