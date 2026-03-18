import { type CreateSwapResult, type Swap } from '../../api'
import { type ProviderContext, type SwapAction } from '../types'

export const PREIMAGE_LENGTH = 32 as const

export interface ClaimDetails {
  lockupAddress: string
  refundAddress: string
  destinationAmount: bigint
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
    destinationAmount: bigint
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
    destinationAmount: bigint | number
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
    privateKey: string
    swapTree: string
    timeoutBlockHeight: number
    claimPublicKey: string
    version: number
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
