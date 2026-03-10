import { deepFreeze } from '@rsksmart/bridges-core-sdk'

export const VALIDATION_CONSTANTS = deepFreeze({
  boltz: {
    etherSwapBytecodeHash: '0xfba7d5f8c66a248ee4f867cb46460b6d248bddafdb0546ae780f3d59480a155f'
  }
} as const)

export const PAYMENT_TAG_NAME = 'payment_hash' as const
