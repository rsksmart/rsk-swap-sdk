import { assertTruthy, type BlockchainConnection, type TxResult } from '@rsksmart/bridges-core-sdk'
import { RskSwapError } from '../error/error'
import { type ProviderClientResolver } from '../providers/resolver'
import { type SwapWithAction } from '../providers/types'
import { isEvmChain } from '../utils/chain'
import { RSK_SWAP_ERROR_CODES } from '../error/codes'

export async function claimSwap (
  clientResolver: ProviderClientResolver,
  swapWithAction: SwapWithAction,
  connection: BlockchainConnection
): Promise<TxResult> {
  const { swap, action } = swapWithAction
  if (!action.requiresClaim) {
    throw RskSwapError.withCause(RSK_SWAP_ERROR_CODES.NOT_CLAIMABLE, swap)
  }
  const swapProviderClient = clientResolver.get(swap.providerId)
  if (isEvmChain(swap.toNetwork)) {
    const result = await swapProviderClient.buildClaimTransaction?.(swap)
    assertTruthy(result, 'Build claim transaction is not defined')
    const txHash = await connection.executeTransaction(result)
    return txHash
  } else if (swapProviderClient.executeExternalClaim !== undefined) {
    const id = await swapProviderClient.executeExternalClaim(swap)
    return { txHash: id, successful: true }
  } else {
    throw RskSwapError.withCause(RSK_SWAP_ERROR_CODES.NOT_CLAIMABLE, swap)
  }
}
