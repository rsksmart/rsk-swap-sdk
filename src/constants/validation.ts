import { deepFreeze } from '@rsksmart/bridges-core-sdk'

export const VALIDATION_CONSTANTS = deepFreeze({
  boltz: {
    testnet: {
      etherSwapBytecodeHash: '0x000c3dfadd394049d31e38889399d6ee7ce1c506383ac5c3275b44ef0b94931f'
    },
    mainnet: {
      etherSwapBytecodeHash: '0xfba7d5f8c66a248ee4f867cb46460b6d248bddafdb0546ae780f3d59480a155f'
    }
  }
} as const)

export const PAYMENT_TAG_NAME = 'payment_hash' as const
