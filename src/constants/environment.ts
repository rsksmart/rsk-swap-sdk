import { deepFreeze } from '@rsksmart/bridges-core-sdk'

/** Configuration for a network environment the SDK can target. */
export interface RskSwapEnvironment {
  /** Base URL of the RSK Swap API for this environment. */
  api: string
  /** Bitcoin network that BIP21 payment addresses are validated against. */
  bitcoinNetwork: 'mainnet' | 'testnet' | 'regtest'
}

export const RskSwapEnvironments = deepFreeze({
  Local: {
    api: 'http://localhost:8080/api',
    bitcoinNetwork: 'mainnet'
  },
  Development: {
    api: 'https://rskswap.dev.flyover.rif.technology/api',
    bitcoinNetwork: 'mainnet'
  },
  Testnet: {
    api: 'https://rskswap.testnet.flyover.rif.technology/api',
    bitcoinNetwork: 'testnet'
  },
  Mainnet: {
    api: 'https://rskswap.mainnet.flyover.rif.technology/api',
    bitcoinNetwork: 'mainnet'
  }
} as const satisfies Record<string, RskSwapEnvironment>)

/** Available environment for the RskSwapSDK */
export type RskSwapEnvironmentName = keyof typeof RskSwapEnvironments
