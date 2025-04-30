import { type CreateSwapResult, type Swap } from '../../api'
import { type ProviderContext, type SwapAction } from '../types'

export const PREIMAGE_LENGTH = 32 as const

export interface ClaimDetails {
  lockupAddress: string
  refundAddress: string
  onchainAmount: bigint
  timeoutBlockHeight: number
  preimage: string
}

export interface BoltzAtomicSwap {
  createContext: () => ProviderContext
  validateAddress: (swap: Swap) => Promise<boolean>
  generateAction: (createdSwap: CreateSwapResult) => Promise<SwapAction>
  getClaimDetails: (swap: Swap) => ClaimDetails
}

export interface BoltzReverseSwapContext {
  publicContext: {
    preimageHash: string
    timeoutBlockHeight: number
    onchainAmount: bigint
    lockupAddress: string
    refundAddress: string
  }
  secretContext: {
    preimage: string
  }
}

export interface BoltzSubmarineSwapContext {
  publicContext: {
    timeoutBlockHeight: number
    claimAddress: string
    expectedAmount: bigint | number
  }
  secretContext: unknown
}

export interface BoltzChainSwapInContext {
  publicContext: {
    preimageHash: string
    refundPublicKey: string
    lockupDetails: {
      serverPublicKey: string
      amount: bigint
      lockupAddress: string
      timeoutBlockHeight: number
      swapTree: {
        claimLeaf: {
          version: number
          output: string
        }
        refundLeaf: {
          version: number
          output: string
        }
      }
    }
    claimDetails: {
      refundAddress: string
      amount: bigint
      lockupAddress: string
      timeoutBlockHeight: number
    }
  }
  secretContext: {
    preimage: string
    refundPrivateKey: string
  }
}

export interface BoltzChainSwapOutContext {
  publicContext: {
    preimageHash: string
    claimPublicKey: string
    lockupDetails: {
      claimAddress: string
      amount: bigint
      lockupAddress: string
      timeoutBlockHeight: number
    }
    claimDetails: {
      serverPublicKey: string
      amount: bigint
      lockupAddress: string
      timeoutBlockHeight: number
      swapTree: {
        claimLeaf: {
          version: number
          output: string
        }
        refundLeaf: {
          version: number
          output: string
        }
      }
    }
  }
  secretContext: {
    preimage: string
    claimPrivateKey: string
  }
}
