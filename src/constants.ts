import {Web3AuthLoginProvider, Web3AuthNetworkType} from './web3auth/types'

export const web3AuthNetworkToFlowportApiMapping: Record<
  Web3AuthNetworkType,
  string
> = {
  mainnet: 'https://hardware-wallet-api-mainnet.onflow.org',
  testnet: 'https://hardware-wallet-api-testnet.staging.onflow.org',
}
