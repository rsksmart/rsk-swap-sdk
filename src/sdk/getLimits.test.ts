import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import JSONbig from 'json-bigint'
import { getSwapLimits, type SwapLimitsArgs } from './getLimits'
import { type SwapLimits } from '../api'

const serializer = JSONbig({ useNativeBigInt: true })

describe('getLimits function should', () => {
  let httpClient: HttpClient
  let mockResult: SwapLimits

  beforeEach(() => {
    mockResult = {
      maxAmount: BigInt(20),
      minAmount: BigInt(1)
    }
    const getCaptchaToken: jest.MockedFunction<HttpClient['getCaptchaToken']> = jest.fn<HttpClient['getCaptchaToken']>()
    const get: jest.MockedFunction<HttpClient['get']> = jest.fn<any>().mockResolvedValueOnce(mockResult)
    const post: jest.MockedFunction<HttpClient['post']> = jest.fn<any>()
    httpClient = { getCaptchaToken, get, post }
  })

  test('make the proper HTTP request', async () => {
    const url = 'http://localhost:8080'
    const params: SwapLimitsArgs = {
      toToken: 'a-token1',
      fromToken: 'a-token2',
      toChainId: '30',
      fromChainId: '1'
    }
    const result = await getSwapLimits(url, httpClient, params)
    expect(serializer.stringify(result)).toEqual(serializer.stringify(mockResult))
    expect(httpClient.get).toHaveBeenCalledWith(url + '/swaps/limits?to_token=a-token1&from_token=a-token2&to_network=30&from_network=1')
    expect(httpClient.get).toHaveBeenCalledTimes(1)
  })
  test('fail on missing parameter', async () => {
    const url = 'http://localhost:8080'
    const queryMapping: Record<string, string> = {
      toToken: 'to_token',
      fromToken: 'from_token',
      toChainId: 'to_network',
      fromChainId: 'from_network'
    }
    const params: SwapLimitsArgs = {
      toToken: 'a-token1',
      fromToken: 'a-token2',
      toChainId: '30',
      fromChainId: '1'
    }
    for (const [sdkField, queryField] of Object.entries(queryMapping)) {
      const copy = { ...params }
      delete copy[sdkField as keyof SwapLimitsArgs] // eslint-disable-line @typescript-eslint/no-dynamic-delete
      await expect(getSwapLimits(url, httpClient, copy)).rejects.toThrowError(`Validation failed for object with following missing properties: ${queryField}`)
    }
  })
})
