import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { estimateSwap, type SwapEstimationArgs } from './estimateSwap'
import { type SwapEstimation } from '../api'
import JSONbig from 'json-bigint'

const serializer = JSONbig({ useNativeBigInt: true })

describe('estimateSwap function should', () => {
  let httpClient: HttpClient
  let mockResult: SwapEstimation

  beforeEach(() => {
    mockResult = {
      fees: [{
        amount: BigInt(1),
        type: 'FIXED',
        description: 'a description'
      }],
      total: BigInt(1),
      toToken: 'a token',
      requiredConfirmations: 1,
      fromNetwork: 'a network',
      fromToken: 'a token',
      providerId: 'PROVIDER1',
      toNetwork: 'a network'
    }
    const getCaptchaToken: jest.MockedFunction<HttpClient['getCaptchaToken']> = jest.fn<HttpClient['getCaptchaToken']>()
    const get: jest.MockedFunction<HttpClient['get']> = jest.fn<any>().mockResolvedValueOnce([mockResult])
    const post: jest.MockedFunction<HttpClient['post']> = jest.fn<any>()
    httpClient = { getCaptchaToken, get, post }
  })

  test('make the proper HTTP request', async () => {
    const url = 'http://localhost:8080'
    const params: SwapEstimationArgs = {
      fromAmount: BigInt(1),
      toToken: 'a-token1',
      fromToken: 'a-token2',
      toChainId: '30',
      fromChainId: '1'
    }
    const result = await estimateSwap(url, httpClient, params)
    expect(serializer.stringify(result)).toEqual(serializer.stringify([mockResult]))
    expect(httpClient.get).toHaveBeenCalledWith(url + '/swaps/estimate?from_amount=1&to_token=a-token1&from_token=a-token2&to_network=30&from_network=1')
    expect(httpClient.get).toHaveBeenCalledTimes(1)
  })
  test('fail on missing parameter', async () => {
    const url = 'http://localhost:8080'
    const queryMapping: Record<string, string> = {
      fromAmount: 'from_amount',
      toToken: 'to_token',
      fromToken: 'from_token',
      toChainId: 'to_network',
      fromChainId: 'from_network'
    }
    const params: SwapEstimationArgs = {
      fromAmount: BigInt(1),
      toToken: 'a-token1',
      fromToken: 'a-token2',
      toChainId: '30',
      fromChainId: '1'
    }
    for (const [sdkField, queryField] of Object.entries(queryMapping)) {
      const copy = { ...params }
      delete copy[sdkField as keyof SwapEstimationArgs] // eslint-disable-line @typescript-eslint/no-dynamic-delete
      await expect(estimateSwap(url, httpClient, copy)).rejects.toThrowError(`Validation failed for object with following missing properties: ${queryField}`)
    }
  })
})
