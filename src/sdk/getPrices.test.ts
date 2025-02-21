import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { getPrices, type GetPricesArgs } from './getPrices'
import { type CoinPrice } from '../api'

describe('getPrices function', () => {
  let httpClient: HttpClient
  let mockResult: CoinPrice[]

  beforeEach(() => {
    mockResult = [
      { name: 'bitcoin', price: 50000 },
      { name: 'ethereum', price: 4000 }
    ]
    const getCaptchaToken = jest.fn<HttpClient['getCaptchaToken']>()
    const get = jest.fn<any>().mockResolvedValueOnce(mockResult)
    const post = jest.fn<any>()
    httpClient = { getCaptchaToken, get, post }
  })

  test('makes the proper HTTP request', async () => {
    const url = 'http://localhost:8080'
    const args: GetPricesArgs = {
      currencies: 'bitcoin,ethereum'
    }
    const result = await getPrices(url, httpClient, args)
    expect(result).toEqual(mockResult)
    expect(httpClient.get).toHaveBeenCalledWith(
      url + '/price-feeder?currencies=bitcoin%2Cethereum'
    )
    expect(httpClient.get).toHaveBeenCalledTimes(1)
  })

  test('fails on missing currencies parameter', async () => {
    const url = 'http://localhost:8080'
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const args = {} as GetPricesArgs
    await expect(getPrices(url, httpClient, args)).rejects.toThrowError(
      'Validation failed for object with following missing properties: currencies'
    )
  })
})
