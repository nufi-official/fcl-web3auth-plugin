import {WalletUtils} from '@onflow/fcl'
import type * as Flow from './types'
import * as FlowUtils from './utils'
import {ServiceDefinitionProps, serviceDefinition} from './serviceDefinition'
import * as TypeUtils from '../typeUtils'
import {Wallet} from '../wallet'
import {Web3AuthLoginProvider} from '../web3auth/types'
import {AccountInfo} from '../wallet/types'

export type Api = {
  extensionServiceInitiationMessage(
    msg: Flow.ExtensionServiceInitiationMessage,
  ): null | Flow.Message
  message(msg: Flow.Message): Promise<null | Flow.Message>
}

export const createApi = (
  wallet: Wallet,
  services: Record<Web3AuthLoginProvider, ServiceDefinitionProps>,
): Api => {
  type State =
    | {
        currentServiceType: 'authn' | 'authz' | 'user-signature'
        currentLoginProvider: keyof typeof services
      }
    | {
        currentServiceType: null
        currentLoginProvider: null
      }
  let state: State = {
    currentServiceType: null,
    currentLoginProvider: null,
  }
  const updateState = (update: State) => {
    state = {...state, ...update}
  }

  return {
    extensionServiceInitiationMessage(
      msg: Flow.ExtensionServiceInitiationMessage,
    ) {
      if (
        // if message is not for any of the services but for some other wallet provider (e.g. nufi, lilico)
        !Object.values(services).some(
          ({appId}) =>
            msg.service.uid ===
            FlowUtils.getFclServiceUid(appId, msg.service.type),
        )
      ) {
        // we reset the state and do not respond
        updateState({
          currentServiceType: null,
          currentLoginProvider: null,
        })
        return null
      }
      switch (msg.service.type) {
        case 'authn':
        case 'authz':
        case 'user-signature':
          updateState({
            currentServiceType: msg.service.type,
            currentLoginProvider: msg.service.endpoint as keyof typeof services,
          })
          return {type: 'FCL:VIEW:READY'}
        default:
          break
      }

      updateState({currentServiceType: null, currentLoginProvider: null})
      return null
    },
    async message(msg: Flow.Message) {
      // Argument validation
      TypeUtils.assert(msg.type === 'FCL:VIEW:READY:RESPONSE')

      // If we aren't currently in an active exchange this message isn't meant
      // for us.
      if (state.currentServiceType == null) return null

      // The FCL library for some reason sends multiple
      // `FCL:VIEW:READY:RESPONSE` messages for different services, we will
      // just silently ignore them.
      if (msg.service?.type !== state.currentServiceType) return null

      let user: AccountInfo | undefined

      try {
        user = await wallet.ensureUserLoggedIn(state.currentLoginProvider)
      } catch (e) {
        return null
      }

      const {address: userAddress, pubKeyInfo} = user

      const serviceProps = services[state.currentLoginProvider]
      switch (state.currentServiceType) {
        case 'authn': {
          const keyId = pubKeyInfo.index
          const services = [
            serviceDefinition({
              ...serviceProps,
              type: 'authn',
              userAddress,
              keyId,
            }),
            serviceDefinition({
              ...serviceProps,
              type: 'authz',
              userAddress,
              keyId,
            }),
            serviceDefinition({
              ...serviceProps,
              type: 'user-signature',
              userAddress,
              keyId,
            }),
          ]
          // https://developers.flow.com/tools/fcl-js/reference/proving-authentication
          if (FlowUtils.isAccountProofAuthMsg(msg.body)) {
            const accountProofData = msg.body
            const signature = await wallet.signProofOfAccountOwnership(
              accountProofData,
            )
            services.push(
              serviceDefinition({
                ...serviceProps,
                type: 'account-proof',
                userAddress,
                keyId,
                signatures: [
                  {
                    f_type: 'CompositeSignature',
                    f_vsn: FlowUtils.version,
                    addr: userAddress,
                    keyId,
                    signature,
                  },
                ],
                nonce: accountProofData.nonce,
              }),
            )
          }

          return TypeUtils.id<Flow.Message & Flow.PollingResponse>({
            type: 'FCL:VIEW:RESPONSE',
            f_type: 'PollingResponse',
            f_vsn: FlowUtils.version,
            status: 'APPROVED',
            reason: null,
            data: {
              f_type: 'AuthnResponse',
              f_vsn: FlowUtils.version,
              addr: userAddress,
              services,
            },
          })
        }
        case 'authz': {
          // For some reason FCL can send multiple `FCL:VIEW:READY:RESPONSE`
          // messages to the authz service. We only care about the one
          // containing the signable.
          if (!FlowUtils.isSignable(msg.body)) return null

          const keyId = pubKeyInfo.index

          const message = WalletUtils.encodeMessageFromSignable(
            msg.body,
            userAddress,
          )

          try {
            const signature = await wallet.signTxMessage(message)
            return TypeUtils.id<Flow.Message & Flow.PollingResponse>({
              type: 'FCL:VIEW:RESPONSE',
              f_type: 'PollingResponse',
              f_vsn: FlowUtils.version,
              status: 'APPROVED',
              reason: null,
              data: {
                f_type: 'CompositeSignature',
                f_vsn: FlowUtils.version,
                addr: userAddress,
                keyId,
                signature,
              },
            })
          } catch {
            return TypeUtils.id<Flow.Message & Flow.PollingResponse>({
              type: 'FCL:VIEW:RESPONSE',
              f_type: 'PollingResponse',
              f_vsn: FlowUtils.version,
              status: 'DECLINED',
              reason: 'Declined.',
            })
          }
        }
        case 'user-signature': {
          TypeUtils.assert(
            !!(msg.body && 'message' in msg?.body),
            `User message is undefined ${msg}}`,
          )

          // fcl validates that the message is indeed hex string
          const message = msg.body.message

          const keyId = pubKeyInfo.index

          try {
            const signature = await wallet.signUserMessage(message)
            return TypeUtils.id<Flow.Message & Flow.PollingResponse>({
              type: 'FCL:VIEW:RESPONSE',
              f_type: 'PollingResponse',
              f_vsn: FlowUtils.version,
              status: 'APPROVED',
              reason: null,
              data: {
                f_type: 'CompositeSignature',
                f_vsn: FlowUtils.version,
                addr: userAddress,
                keyId,
                signature,
              },
            })
          } catch {
            return TypeUtils.id<Flow.Message & Flow.PollingResponse>({
              type: 'FCL:VIEW:RESPONSE',
              f_type: 'PollingResponse',
              f_vsn: FlowUtils.version,
              status: 'DECLINED',
              reason: 'Declined.',
            })
          }
        }
        default:
          return TypeUtils.safeAssertUnreachable(state)
      }
    },
  }
}
