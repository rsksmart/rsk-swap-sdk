import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type Token } from '../api'
import { listTokens } from './listTokens'

describe('getProviders function should', () => {
  let httpClient: HttpClient
  let mockResult: Token[]

  beforeEach(() => {
    mockResult = [
      {
        symbol: 'RBTC',
        description: 'Rootstock Smart Bitcoin',
        type: 'native-evm',
        decimals: 18,
        addresses: {
          1: '0xdac17f958',
          2: '0x123456',
          3: '0xabcdef'
        }
      },
      {
        symbol: 'BTC',
        description: 'Bitcoin',
        type: 'native-btc',
        decimals: 8,
        addresses: {
          4: '0xdac17f958',
          5: '0x123456',
          6: '0xabcdef'
        }
      }
    ]
    const getCaptchaToken: jest.MockedFunction<HttpClient['getCaptchaToken']> = jest.fn<HttpClient['getCaptchaToken']>()
    const get: jest.MockedFunction<HttpClient['get']> = jest.fn<any>().mockResolvedValueOnce(mockResult)
    const post: jest.MockedFunction<HttpClient['post']> = jest.fn<any>()
    httpClient = { getCaptchaToken, get, post }
  })

  test('make the proper HTTP request', async () => {
    const url = 'http://localhost:8080'
    const result = await listTokens(url, httpClient)
    expect(result).toEqual(mockResult)
    expect(httpClient.get).toHaveBeenCalledWith(url + '/tokens')
    expect(httpClient.get).toHaveBeenCalledTimes(1)
  })
})
