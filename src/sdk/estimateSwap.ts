import { Routes, type SwapEstimation, type SwapEstimationQuery } from '../api'
import { validateRequiredFields, type HttpClient } from '@rsksmart/bridges-core-sdk'

/** Interface that holds the arguments required for a swap estimation. */
export interface SwapEstimationArgs {
  /** Amount of the origin network to swap, needs to be in the smallest unit for the origin network. */
  fromAmount: bigint
  /** Symbol of the destination token. */
  toToken: string
  /** Symbol of the origin token. */
  fromToken: string
  /** Chain id of the destination network. If the destination network is Bitcoin use BTC instead. */
  toChainId: string
  /** Chain id of the origin network. If the origin network is Bitcoin use BTC instead. */
  fromChainId: string
  /** Optional sender address on the origin network. Improves fee estimation accuracy for providers like LiFi. */
  address?: string
  /** Optional receiver address on the destination network. Improves fee estimation accuracy for providers like LiFi. */
  toAddress?: string
}

export async function estimateSwap (apiUrl: string, client: HttpClient, args: SwapEstimationArgs): Promise<SwapEstimation[]> {
  const url = new URL(apiUrl + Routes.estimateSwap)
  const queryParams: SwapEstimationQuery = {
    from_amount: args.fromAmount,
    to_token: args.toToken,
    from_token: args.fromToken,
    to_network: args.toChainId,
    from_network: args.fromChainId
  }
  validateRequiredFields(queryParams, ...Object.keys(queryParams))
  Object.entries(queryParams).forEach(([key, value]) => { url.searchParams.append(key, value.toString()) })
  if (args.address) url.searchParams.append('address', args.address)
  if (args.toAddress) url.searchParams.append('to_address', args.toAddress)
  const estimation = await client.get<SwapEstimation[]>(url.toString())
  return estimation
}
