import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { Routes, type Token } from '../api'

export async function listTokens (apiUrl: string, client: HttpClient): Promise<Token[]> {
  const url = new URL(apiUrl + Routes.getTokens)
  const tokens = await client.get<Token[]>(url.toString())
  return tokens
}
