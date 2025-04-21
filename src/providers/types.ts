import { type CreateSwapResult, type Swap } from '../api'
import { type CreateSwapRS } from '../api/bindings/data-contracts'
import { type CreateSwapArgs } from '../sdk/createSwap'

export interface ProviderContext {
  publicContext: object
  secretContext: object
}

export interface SwapProviderClient {
  createContext: (creationArgs: CreateSwapArgs) => ProviderContext
  validateAddress: (swap: Swap) => Promise<boolean>
  generateAction: (swap: CreateSwapResult) => Promise<SwapAction>
  buildClaimTransaction?: (swap: Swap) => Promise<TxData>
  executeExternalClaim?: (swap: Swap) => Promise<string>
}

export interface SwapAction {
  /** The type of action to perform */
  type: CreateSwapRS['actionType']
  /** The data to perform the action. Format depends on the action itself */
  data: TxData | string
  requiresClaim: boolean
}

export interface SwapWithAction {
  swap: Swap
  action: SwapAction
}

export interface TxData {
  to: string
  data: string
  value: string
}
