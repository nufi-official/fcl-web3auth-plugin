import {ErrorResponse, RequestContext} from '../../messaging/types'
import {WalletUtils} from '@onflow/fcl'
import type * as Flow from './types'
import * as FlowUtils from './utils'
import {middleware} from '../../middlewares'
import {assert, safeAssertUnreachable} from '../../../../utils/assertion'
import {confirmInit, confirmSign} from '../../connectorWindow/utils'
import {useDappConnectorStore} from '../../../../store/dappConnector'
import {flow} from '../../../../wallet/flow/flowWallet'
import {id} from 'common'
import type {Connector} from '../../types'
import {serviceDefinition} from './serviceDefinition'
import {HexString} from '../../../../types'
import {dappConnectorsConfig} from '../../config'
import {
  lilicoServiceDefinition,
  overrideServiceIdentifiersWithLilico,
} from './emulation'

const blockchain = 'flow'

type Api = {
  extensionServiceInitiationMessage(
    context: RequestContext,
    msg: Flow.ExtensionServiceInitiationMessage,
  ): Promise<null | Flow.Message>
  message(
    context: RequestContext,
    msg: Flow.Message,
  ): Promise<null | Flow.Message>
}

export const createHandler = () => {
  const {walletAddress} = dappConnectorsConfig.connectors[blockchain]

  type State = {
    userApproved: boolean
    currentServiceType: null | 'authn' | 'authz' | 'user-signature'
    serviceEndpoint: null | string
  }
  let state: State = {
    userApproved: false,
    currentServiceType: null,
    serviceEndpoint: null,
  }
  const updateState = (update: Partial<State>) => {
    state = {...state, ...update}
  }

  const api: Api = {
    async extensionServiceInitiationMessage(context, msg) {
      // Argument validation
      assert(FlowUtils.isExtensionServiceInitiationMessage(msg))
      switch (msg.service.type) {
        case 'authn':
        case 'authz':
        case 'user-signature':
          updateState({
            currentServiceType: msg.service.type,
            // saving the serviceEndpoint helps to determine, how was the connection initialized, whether it was through nufi,
            // or some other wallet we emulate. We need this o determine what kind of responses we should return
            serviceEndpoint: msg.service.endpoint,
          })
          return {type: 'FCL:VIEW:READY'}
        default:
          break
      }

      updateState({currentServiceType: null})
      return null
    },
    async message(context, msg) {
      // Argument validation
      assert(FlowUtils.isMessage(msg))
      assert(msg.type === 'FCL:VIEW:READY:RESPONSE')

      // If we aren't currently in an active exchange this message isn't meant
      // for us.
      if (state.currentServiceType == null) return null

      // The FCL library for some reason sends multiple
      // `FCL:VIEW:READY:RESPONSE` messages for different services, we will
      // just silently ignore them.
      if (msg.service?.type !== state.currentServiceType) return null

      // Try acquiring user approval if we don't have it.
      if (!state.userApproved) {
        const userApproved = await confirmInit(
          {
            origin: context.trusted.origin,
            favIconUrl: context.trusted.favIconUrl,
          },
          blockchain,
        )
        updateState({userApproved})
      }

      // Ensure that there is user approval beyond this point. Send back
      // appropriate message if we don't have it.
      if (!state.userApproved) {
        if (state.currentServiceType === 'authn') {
          return id<Flow.Message & Flow.PollingResponse>({
            type: 'FCL:VIEW:RESPONSE',
            f_type: 'PollingResponse',
            f_vsn: FlowUtils.version,
            status: 'DECLINED',
            reason: 'Declined by user.',
          })
        }
        return null
      }

      const {selectedAccount} = useDappConnectorStore.getState()
      assert(selectedAccount != null)
      const accountId = selectedAccount.id
      const data = flow.accountsStore.getAccount(accountId)
      const accountInfo = await flow.accountManager.getAccountInfo(data)
      const userAddress = accountInfo.address
      const keyId = accountInfo.publicKeyInfo.index

      switch (state.currentServiceType) {
        case 'authn': {
          const services = [
            serviceDefinition({
              type: 'authn',
              walletAddress,
              userAddress,
              keyId,
            }),
            serviceDefinition({
              type: 'authz',
              walletAddress,
              userAddress,
              keyId,
            }),
            serviceDefinition({
              type: 'user-signature',
              walletAddress,
              userAddress,
              keyId,
            }),
          ]
          // https://developers.flow.com/tools/fcl-js/reference/proving-authentication
          if (
            FlowUtils.isAccountProofAuthMsg(msg.body) &&
            // remove once ledger supports account-proof,
            accountInfo.cryptoProviderType === 'mnemonic'
          ) {
            const accountProofData = msg?.body
            const signature =
              await flow.accountManager.signProofOfAccountOwnership(
                accountProofData,
                accountInfo,
              )
            services.push(
              serviceDefinition({
                type: 'account-proof',
                walletAddress,
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

          return id<Flow.Message & Flow.PollingResponse>({
            type: 'FCL:VIEW:RESPONSE',
            f_type: 'PollingResponse',
            f_vsn: FlowUtils.version,
            status: 'APPROVED',
            reason: null,
            data: {
              f_type: 'AuthnResponse',
              f_vsn: FlowUtils.version,
              addr: userAddress,
              // we override attributes which might identify the connector to the dapp because
              // there are existing dapps (https://id.ecdao.org) which use these identifiers after the communication is initialized
              // here we rely on the serviceEndpoint state set up when initializing the connection
              services:
                state.serviceEndpoint === lilicoServiceDefinition.endpoint
                  ? services.map((service) =>
                      overrideServiceIdentifiersWithLilico(service),
                    )
                  : services,
            },
          })
        }
        case 'authz': {
          // For some reason FCL can send multiple `FCL:VIEW:READY:RESPONSE`
          // messages to the authz service. We only care about the one
          // containing the signable.
          if (!FlowUtils.isSignable(msg.body)) return null

          const message = WalletUtils.encodeMessageFromSignable(
            msg.body,
            userAddress,
          ) as HexString
          const onSign = () =>
            flow.accountManager.signTxMessage(message, accountInfo)

          try {
            const signature = await confirmSign(
              'sign-tx',
              {
                type: blockchain,
                data: {signable: msg.body},
              },
              onSign,
              () => undefined as unknown as ErrorResponse,
            )
            return id<Flow.Message & Flow.PollingResponse>({
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
            return id<Flow.Message & Flow.PollingResponse>({
              type: 'FCL:VIEW:RESPONSE',
              f_type: 'PollingResponse',
              f_vsn: FlowUtils.version,
              status: 'DECLINED',
              reason: 'Declined.',
            })
          }
        }
        case 'user-signature': {
          assert(
            !!(msg.body && 'message' in msg?.body),
            `User message is undefined ${msg}}`,
          )

          // fcl validates that the message is indeed hex string
          const messageHex = msg.body.message as HexString

          const onSign = () =>
            flow.accountManager.signUserMessage(messageHex, accountInfo)

          try {
            const signature = await confirmSign(
              'sign-message',
              {
                type: blockchain,
                data: {messageHex},
              },
              onSign,
              () => undefined as unknown as ErrorResponse,
            )
            return id<Flow.Message & Flow.PollingResponse>({
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
            return id<Flow.Message & Flow.PollingResponse>({
              type: 'FCL:VIEW:RESPONSE',
              f_type: 'PollingResponse',
              f_vsn: FlowUtils.version,
              status: 'DECLINED',
              reason: 'Declined.',
            })
          }
        }
        default:
          return safeAssertUnreachable(state.currentServiceType)
      }
    },
  }

  return middleware.resolveMethod(api, {
    notEnabledError: 'wrong method' as unknown as ErrorResponse,
    passContext: true,
  })
}

const connector: Connector = {createHandler}

export default connector
