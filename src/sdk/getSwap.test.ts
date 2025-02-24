import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { getSwap, type SwapId } from './getSwap'
import JSONbig from 'json-bigint'
import { type Swap } from '../api'

const serializer = JSONbig({ useNativeBigInt: true })

describe('getSwap function should', () => {
  let httpClient: HttpClient
  let mockResult: Swap

  beforeEach(() => {
    mockResult = {
      providerSwapId: '123',
      providerId: 'PROVIDER1',
      fromAmount: BigInt(500),
      paymentAddress: 'an address',
      receiverAddress: 'an address',
      fromToken: 'a token',
      toToken: 'a token',
      fromNetwork: 'a network',
      toNetwork: 'a network',
      status: 'CREATED',
      requiredConfirmations: 3,
      usedFees: [],
      context: {}
    }
    const getCaptchaToken: jest.MockedFunction<HttpClient['getCaptchaToken']> = jest.fn<HttpClient['getCaptchaToken']>()
    const get: jest.MockedFunction<HttpClient['get']> = jest.fn<any>().mockResolvedValueOnce(mockResult)
    const post: jest.MockedFunction<HttpClient['post']> = jest.fn<any>()
    httpClient = { getCaptchaToken, get, post }
  })

  test('make the proper HTTP request', async () => {
    const url = 'http://localhost:8080'
    const params: SwapId = {
      providerId: 'PROVIDER1',
      id: '123'
    }
    const result = await getSwap(url, httpClient, params)
    expect(serializer.stringify(result)).toEqual(serializer.stringify(mockResult))
    expect(httpClient.get).toHaveBeenCalledWith(url + '/swaps?provider_id=PROVIDER1&provider_swap_id=123')
    expect(httpClient.get).toHaveBeenCalledTimes(1)
  })
  test('fail on missing parameter', async () => {
    const url = 'http://localhost:8080'
    const params: SwapId = {
      providerId: 'PROVIDER1',
      id: '123'
    }
    const queryMapping: Record<string, string> = {
      providerId: 'provider_id',
      id: 'provider_swap_id'
    }
    for (const field in params) {
      const copy = { ...params }
      delete copy[field as keyof SwapId] // eslint-disable-line @typescript-eslint/no-dynamic-delete
      await expect(getSwap(url, httpClient, copy)).rejects.toThrowError(`Validation failed for object with following missing properties: ${queryMapping[field]}`)
    }
  })
})
