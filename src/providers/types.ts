import { type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { type CreateSwapResult, type Swap } from '../api'
import { type CreateSwapRS } from '../api/bindings/data-contracts'
import { type CreateSwapArgs } from '../sdk/createSwap'

/** The context a provider client keeps around a swap, split into what is safe to send to the server and what must stay on the client. */
export interface ProviderContext {
  /** Context sent to the server as part of the swap. Must not contain private information. */
  publicContext: object
  /** Context kept only on the client (e.g. private keys, preimages) and never sent to the server. */
  secretContext: object
}

/**
 * Contract that every swap provider integration must implement (see `src/providers/*`, e.g. {@link BoltzClient}, `ChangellyClient`, `SymbiosisClient`, `LiFiClient`).
 * A new provider is added by implementing this interface and registering it with {@link ProviderClientResolver}.
 */
export interface SwapProviderClient {
  /** Builds the local {@link ProviderContext} for a swap before it's created, from the arguments the SDK consumer passed in. */
  createContext: (creationArgs: CreateSwapArgs) => ProviderContext
  /** Validates that the payment address returned by the server for this swap can be trusted. */
  validateAddress: (swap: Swap) => Promise<boolean>
  /** Builds the {@link SwapAction} the SDK consumer must perform to pay for the swap, once it's been created. */
  generateAction: (swap: CreateSwapResult) => Promise<SwapAction>
  /**
   * Builds the on-chain transaction data needed to claim a swap.
   * Optional on the interface, but required for any provider whose swaps can set `requiresClaim: true` and settle on an EVM chain — currently only implemented by {@link BoltzClient}, for its chain-swap-in direction.
   */
  buildClaimTransaction?: (swap: Swap) => Promise<TxData>
  /**
   * Executes a claim that settles off-chain from the SDK's perspective (e.g. cooperatively signed and broadcast by the provider).
   * Optional on the interface, but required for any provider whose swaps can set `requiresClaim: true` and settle on a non-EVM chain — currently only implemented by {@link BoltzClient}, for its chain-swap-out direction.
   */
  executeExternalClaim?: (swap: Swap) => Promise<string>
  /** Reconciles the local {@link ProviderContext} with the server's response after a swap is created. Only implemented by providers that need to merge server-provided data (e.g. {@link BoltzClient}) into the context; providers that don't need this fall back to the local context unchanged. */
  finalizeContext?: (localContext: ProviderContext, swap: Swap) => ProviderContext
}

/** The action an SDK consumer must perform to pay for a created swap. */
export interface SwapAction {
  /** The type of action to perform */
  type: CreateSwapRS['actionType']
  /** The data to perform the action. Format depends on the action itself */
  data: TxData | string
  /** Whether this swap requires an explicit {@link RskSwapSDK.claimSwap} call after the payment to receive the destination funds. */
  requiresClaim: boolean
  /** Optional steps (e.g. an ERC20 approval) that must be executed on the connected blockchain before the action itself, such as an ERC20 `approve` call. */
  executePreSteps?: (connection: BlockchainConnection) => Promise<void>
}

/** A swap paired with the action required to pay for it. */
export interface SwapWithAction {
  swap: Swap
  action: SwapAction
}

/** The raw fields needed to submit an EVM transaction (native or contract call). */
export interface TxData {
  to: string
  data: string
  value: string
}
