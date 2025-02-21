import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { Routes, type SwapProvider } from '../api'

export async function getProvider (apiUrl: string, client: HttpClient, id: string): Promise<SwapProvider> {
  const url = new URL(apiUrl + Routes.getProvider + id)
  const provider = await client.get<SwapProvider>(url.toString())
  return provider
}
