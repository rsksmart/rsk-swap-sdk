import { deepFreeze } from '@rsksmart/bridges-core-sdk'

export const VALIDATION_CONSTANTS = deepFreeze({
  boltz: {
    testnet: {
      etherSwapBytecodeHash: '0x000c3dfadd394049d31e38889399d6ee7ce1c506383ac5c3275b44ef0b94931f'
    },
    mainnet: {
      etherSwapBytecodeHash: '0xfb8d82d533d06bb31f373d9f1d6c28ce371605c62e1889b8c068da9a433e0a57'
    }
  }
} as const)
