import {
  type HttpClient,
  validateRequiredFields
} from '@rsksmart/bridges-core-sdk'
import { Routes, type CoinPrice, type GetPricesQuery } from '../api'

/** Interface for the arguments required to fetch prices */
export interface GetPricesArgs {
  /** Comma-separated token IDs */
  currencies: string
}

/**
 * Fetches the price(s) of the given currency/currencies in USD.
 *
 * @param apiUrl The base URL of the API
 * @param client The HTTP client
 * @param args The arguments containing the currencies
 * @returns An array of coin names and their prices
 */
export async function getPrices (
  apiUrl: string,
  client: HttpClient,
  args: GetPricesArgs
): Promise<CoinPrice[]> {
  validateRequiredFields(args, 'currencies')
  const url = new URL(apiUrl + Routes.getPrices)
  const queryParams: GetPricesQuery = {
    currencies: args.currencies
  }
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString())
  })
  const prices = await client.get<CoinPrice[]>(url.toString())
  return prices
}
