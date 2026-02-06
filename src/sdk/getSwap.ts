import { type HttpClient, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type GetSwapQuery, Routes, type Swap } from '../api'

/** Interface that holds information to identify univocally a swap */
export interface SwapId {
  /** Id of the swap in the provider's system */
  id: string
  /** Id of the provider */
  providerId: string
  /** Optional transaction hash (required for some providers like Symbiosis) */
  txHash?: string
}

export async function getSwap (apiUrl: string, client: HttpClient, swapId: SwapId): Promise<Swap> {
  const url = new URL(apiUrl + Routes.getSwap)
  const queryParams: GetSwapQuery = {
    provider_id: swapId.providerId,
    provider_swap_id: swapId.id
  }
  validateRequiredFields(queryParams, 'provider_id', 'provider_swap_id')
  if (swapId.txHash) {
    queryParams.tx_hash = swapId.txHash
  }
  Object.entries(queryParams).forEach(([key, value]) => { url.searchParams.append(key, value.toString()) })
  const swap = await client.get<Swap>(url.toString())
  return swap
}
