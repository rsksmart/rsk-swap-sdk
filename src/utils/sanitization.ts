import { type Swap } from '../api'
import { type SwapWithAction } from '../providers/types'

/**
 * Creates a sanitized copy of a swap object with secretContext removed.
 * This prevents sensitive data (private keys, preimages) from being exposed in error messages or logs.
 *
 * @param swap - The swap object that may contain secretContext
 * @returns A new swap object with secretContext removed if present
 */
export function sanitizeSwap<T extends Swap | SwapWithAction> (swap: T): T {
  if ('action' in swap) {
    const sanitizedSwapWithAction = {
      ...swap,
      swap: sanitizeSwap(swap.swap)
    }
    return sanitizedSwapWithAction as T
  }

  // If swap has context with secretContext, remove it
  if (swap.context && typeof swap.context === 'object' && 'secretContext' in swap.context) {
    const sanitizedContext: Record<string, unknown> = {}
    if ('publicContext' in swap.context && swap.context.publicContext) {
      sanitizedContext.publicContext = swap.context.publicContext
    }
    const sanitizedSwap = {
      ...swap,
      context: sanitizedContext
    }
    return sanitizedSwap as T
  }
  return swap
}
