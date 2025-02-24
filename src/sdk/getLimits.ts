import { Routes, type SwapLimits, type SwapLimitsQuery } from '../api'
import { validateRequiredFields, type HttpClient } from '@rsksmart/bridges-core-sdk'

/** Interface that holds the arguments query a specific pair limits. */
export interface SwapLimitsArgs {
  /** Symbol of the destination token. */
  toToken: string
  /** Symbol of the origin token. */
  fromToken: string
  /** Chain id of the destination network. If the destination network is Bitcoin use BTC instead. */
  toChainId: string
  /** Chain id of the origin network. If the origin network is Bitcoin use BTC instead. */
  fromChainId: string
}

export async function getSwapLimits (apiUrl: string, client: HttpClient, args: SwapLimitsArgs): Promise<SwapLimits> {
  const url = new URL(apiUrl + Routes.swapLimits)
  const queryParams: SwapLimitsQuery = {
    to_token: args.toToken,
    from_token: args.fromToken,
    to_network: args.toChainId,
    from_network: args.fromChainId
  }
  validateRequiredFields(queryParams, ...Object.keys(queryParams))
  Object.entries(queryParams).forEach(([key, value]) => { url.searchParams.append(key, value.toString()) })
  const limits = await client.get<SwapLimits>(url.toString())
  return limits
}
