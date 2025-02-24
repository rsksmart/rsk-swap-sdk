import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { getProviders } from './getProviders'
import { type SwapProvider } from '../api'

describe('getProviders function should', () => {
  let httpClient: HttpClient
  let mockResult: SwapProvider[]

  beforeEach(() => {
    mockResult = [
      {
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
      },
      {
        providerId: 'PROVIDER2',
        description: 'other description',
        logoUrl: 'other url',
        shortName: 'other name',
        siteUrl: 'other url',
        supportedPairs: [{
          fromToken: 'other token',
          toToken: 'other token',
          fromNetwork: 'other network',
          toNetwork: 'other network',
          fromTokenProviderId: 'id 3',
          toTokenProviderId: 'id 4'
        }]
      }
    ]
    const getCaptchaToken: jest.MockedFunction<HttpClient['getCaptchaToken']> = jest.fn<HttpClient['getCaptchaToken']>()
    const get: jest.MockedFunction<HttpClient['get']> = jest.fn<any>().mockResolvedValueOnce(mockResult)
    const post: jest.MockedFunction<HttpClient['post']> = jest.fn<any>()
    httpClient = { getCaptchaToken, get, post }
  })

  test('make the proper HTTP request', async () => {
    const url = 'http://localhost:8080'
    const result = await getProviders(url, httpClient)
    expect(result).toEqual(mockResult)
    expect(httpClient.get).toHaveBeenCalledWith(url + '/providers')
    expect(httpClient.get).toHaveBeenCalledTimes(1)
  })
})
