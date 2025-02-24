import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { getProvider } from './getProvider'
import { type SwapProvider } from '../api'

describe('getProvider function should', () => {
  let httpClient: HttpClient
  let mockResult: SwapProvider

  beforeEach(() => {
    mockResult = {
      providerId: 'PROVIDER1',
      description: 'a description',
      logoUrl: 'a url',
      shortName: 'a name',
      siteUrl: 'a url',
      supportedPairs: [{
        fromToken: 'a token',
        toToken: 'a token',
        fromNetwork: 'a network',
        toNetwork: 'a network',
        fromTokenProviderId: 'id 1',
        toTokenProviderId: 'id 2'
      }]
    }
    const getCaptchaToken: jest.MockedFunction<HttpClient['getCaptchaToken']> = jest.fn<HttpClient['getCaptchaToken']>()
    const get: jest.MockedFunction<HttpClient['get']> = jest.fn<any>().mockResolvedValueOnce(mockResult)
    const post: jest.MockedFunction<HttpClient['post']> = jest.fn<any>()
    httpClient = { getCaptchaToken, get, post }
  })

  test('make the proper HTTP request', async () => {
    const url = 'http://localhost:8080'
    const id = 'PROVIDER1'
    const result = await getProvider(url, httpClient, id)
    expect(result).toEqual(mockResult)
    expect(httpClient.get).toHaveBeenCalledWith(url + '/providers/' + id)
    expect(httpClient.get).toHaveBeenCalledTimes(1)
  })
})
