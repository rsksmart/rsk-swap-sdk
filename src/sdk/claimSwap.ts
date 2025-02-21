import { assertTruthy, type BlockchainConnection, type TxResult } from '@rsksmart/bridges-core-sdk'
import { RskSwapError } from '../error/error'
import { type ProviderClientResolver } from '../providers/resolver'
import { type SwapWithAction } from '../providers/types'

export async function claimSwap (
  clientResolver: ProviderClientResolver,
  swapWithAction: SwapWithAction,
  connection: BlockchainConnection
): Promise<TxResult> {
  const { swap, action } = swapWithAction
  if (!action.requiresClaim) {
    throw RskSwapError.withCause('This swap does not require a claim', swap)
  }
  const swapProviderClient = clientResolver.get(swap.providerId)
  const result = await swapProviderClient.buildClaimTransaction?.(swap)
  assertTruthy(result, 'Claim transaction not available')
  const txHash = await connection.executeTransaction(result)
  return txHash
}
