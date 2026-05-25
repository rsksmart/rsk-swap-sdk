import { type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
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
  finalizeContext?: (localContext: ProviderContext, swap: Swap) => ProviderContext
}

export interface SwapAction {
  /** The type of action to perform */
  type: CreateSwapRS['actionType']
  /** The data to perform the action. Format depends on the action itself */
  data: TxData | string
  requiresClaim: boolean
  executePreSteps?: (connection: BlockchainConnection) => Promise<void>
}

export interface SwapWithAction {
  swap: Swap
  action: SwapAction
  /** BIP39 rescue mnemonic for this swap. Present only for Boltz chain swaps (BTC ↔ RSK).
   *  The consumer must present this to the user for download before they proceed.
   *  If the swap fails, the user brings this mnemonic to the Boltz rescue UI to recover funds. */
  rescueMnemonic?: string
}

export interface TxData {
  to: string
  data: string
  value: string
}
