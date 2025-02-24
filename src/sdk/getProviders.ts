import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { Routes, type SwapProvider } from '../api'

export async function getProviders (apiUrl: string, client: HttpClient): Promise<SwapProvider[]> {
  const url = new URL(apiUrl + Routes.getProviders)
  const providers = await client.get<SwapProvider[]>(url.toString())
  return providers
}
