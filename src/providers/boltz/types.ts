import { type CreateSwapResult, type Swap } from '../../api'
import { type ProviderContext, type SwapAction } from '../types'

export interface BoltzAtomicSwap {
  createContext: () => ProviderContext
  validateAddress: (swap: Swap) => Promise<boolean>
  generateAction: (createdSwap: CreateSwapResult) => Promise<SwapAction>
}
