import { deepFreeze } from '@rsksmart/bridges-core-sdk'

export interface RskSwapEnvironment {
  api: string
}

export const RskSwapEnvironments: Record<string, RskSwapEnvironment> = deepFreeze({
  Local: {
    api: 'http://localhost:8080/api'
  },
  Testnet: {
    api: 'https://rskswap.testnet.flyover.rif.technology/api'
  },
  Development: {
    api: 'https://rskswap.dev.flyover.rif.technology/api'
  }
} as const)

/** Available environment for the RskSwapSDK */
export type RskSwapEnvironmentName = keyof typeof RskSwapEnvironments
