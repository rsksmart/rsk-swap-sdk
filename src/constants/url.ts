import { deepFreeze } from '@rsksmart/bridges-core-sdk'

export const PROVIDER_URLS = deepFreeze({
  boltz: {
    testnet: 'https://api.testnet.boltz.exchange/v2',
    mainnet: 'https://api.boltz.exchange/v2'
  }
} as const)
