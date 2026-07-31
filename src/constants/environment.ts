import { deepFreeze } from '@rsksmart/bridges-core-sdk'

/** Configuration for a network environment the SDK can target. */
export interface RskSwapEnvironment {
  /** Base URL of the RSK Swap API for this environment. */
  api: string
}

export const RskSwapEnvironments = deepFreeze({
  Local: {
    api: 'http://localhost:8080/api'
  },
  Development: {
    api: 'https://rskswap.dev.flyover.rif.technology/api'
  },
  Testnet: {
    api: 'https://rskswap.testnet.flyover.rif.technology/api'
  },
  Mainnet: {
    api: 'https://rskswap.mainnet.flyover.rif.technology/api'
  }
} as const satisfies Record<string, RskSwapEnvironment>)

/** Available environment for the RskSwapSDK */
export type RskSwapEnvironmentName = keyof typeof RskSwapEnvironments
