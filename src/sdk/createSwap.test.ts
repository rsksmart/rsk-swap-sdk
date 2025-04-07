import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { createSwap, type CreateSwapArgs } from './createSwap'
import { type CreatedSwap } from '../api'
import { type SwapProviderClient } from '../providers/types'
import { ProviderClientResolver } from '../providers/resolver'
import JSONbig from 'json-bigint'

const serializer = JSONbig({ useNativeBigInt: true })

jest.mock('../providers/resolver', function () {
  return {
    ProviderClientResolver: jest.fn().mockImplementation(() => {
      return {
        register: jest.fn(),
        get: jest.fn().mockReturnValue({
          createContext: jest.fn(),
          validateAddress: jest.fn(),
          generateAction: jest.fn()
        })
      }
    })
  }
})

describe('createSwap function should', () => {
  let httpClient: HttpClient
  let mockResult: CreatedSwap
  let providerClientMock: jest.Mocked<SwapProviderClient>
  let providerResolver: ProviderClientResolver

  beforeEach(() => {
    mockResult = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'PROVIDER1',
        fromAmount: BigInt(500),
        paymentAddress: 'a-payment-address',
        receiverAddress: 'a-receiver-address',
        fromToken: 'ETH',
        toToken: 'BTC',
        fromNetwork: '1',
        toNetwork: 'BTC',
        status: 'CREATED',
        requiredConfirmations: 3,
        usedFees: [
          {
            amount: BigInt(200),
            description: 'fee 1',
            type: 'FIXED'
          }
        ],
        context: { publicKey: 'k1' }
      },
      actionType: 'ERC20-PAYMENT'
    }
    const getCaptchaToken: jest.MockedFunction<HttpClient['getCaptchaToken']> = jest.fn<HttpClient['getCaptchaToken']>()
    const get: jest.MockedFunction<HttpClient['get']> = jest.fn<any>()
    const post: jest.MockedFunction<HttpClient['post']> = jest.fn<any>().mockResolvedValueOnce(mockResult)
    httpClient = { getCaptchaToken, get, post }
    providerResolver = new ProviderClientResolver()
    providerClientMock = providerResolver.get('PROVIDER1') as jest.Mocked<SwapProviderClient>
    providerClientMock.createContext.mockReturnValue({ publicContext: { publicKey: 'k1' }, secretContext: { privateKey: 'k2' } })
  })

  test('make the proper calls to the API and swap client', async () => {
    const url = 'http://localhost:8080'
    const params: CreateSwapArgs = {
      providerId: 'PROVIDER1',
      address: 'a-receiver-address',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromAmount: BigInt(500),
      refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      fromNetwork: '1',
      toNetwork: 'BTC'
    }
    providerClientMock.validateAddress.mockResolvedValue(true)
    providerClientMock.generateAction.mockResolvedValue({
      type: 'ERC20-PAYMENT',
      data: {
        to: 'a-payment-address',
        data: 'some-data',
        value: '0x02BC'
      },
      requiresClaim: false
    })
    const result = await createSwap(url, httpClient, providerResolver, params)
    expect(serializer.stringify(result)).toEqual(serializer.stringify({
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'PROVIDER1',
        fromAmount: BigInt(500),
        paymentAddress: 'a-payment-address',
        receiverAddress: 'a-receiver-address',
        fromToken: 'ETH',
        toToken: 'BTC',
        fromNetwork: '1',
        toNetwork: 'BTC',
        status: 'CREATED',
        requiredConfirmations: 3,
        usedFees: [
          {
            amount: BigInt(200),
            description: 'fee 1',
            type: 'FIXED'
          }
        ],
        context: {
          publicContext: { publicKey: 'k1' },
          secretContext: { privateKey: 'k2' }
        }
      },
      action: {
        type: 'ERC20-PAYMENT',
        data: {
          to: 'a-payment-address',
          data: 'some-data',
          value: '0x02BC'
        },
        requiresClaim: false
      }
    })
    )
    expect(httpClient.post).toHaveBeenCalledWith(
      url + '/swaps',
      {
        providerId: 'PROVIDER1',
        address: 'a-receiver-address',
        fromToken: 'ETH',
        toToken: 'BTC',
        fromAmount: BigInt(500),
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        fromNetwork: '1',
        toNetwork: 'BTC',
        context: { publicKey: 'k1' }
      },
      { includeCaptcha: false }
    )
    expect(httpClient.post).toHaveBeenCalledTimes(1)
    expect(providerClientMock.createContext).toHaveBeenCalledTimes(1)
    expect(providerClientMock.createContext).toHaveBeenCalledWith(params)
    expect(providerResolver.get).toHaveBeenCalledTimes(2)
    expect(providerClientMock.validateAddress).toHaveBeenCalledTimes(1)
    expect(providerClientMock.validateAddress).toHaveBeenCalledWith(mockResult.swap)
    expect(providerClientMock.generateAction).toHaveBeenCalledTimes(1)
    expect(providerClientMock.generateAction).toHaveBeenCalledWith(mockResult)
  })
  test('fail on missing parameter', async () => {
    const url = 'http://localhost:8080'
    const params: CreateSwapArgs = {
      providerId: 'PROVIDER1',
      address: '0x123456789',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromAmount: BigInt(1),
      refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      fromNetwork: '1',
      toNetwork: 'BTC'
    }
    let totalFields = 0
    for (const field in params) {
      const copy = structuredClone(params)
      delete copy[field as keyof CreateSwapArgs] // eslint-disable-line @typescript-eslint/no-dynamic-delete
      await expect(createSwap(url, httpClient, providerResolver, copy)).rejects.toThrowError(`Validation failed for object with following missing properties: ${field}`)
      totalFields++
    }
    expect(providerClientMock.createContext).toHaveBeenCalledTimes(totalFields)
    expect(providerResolver.get).toHaveBeenCalledTimes(totalFields + 1)
  })

  test('fail on invalid address', async () => {
    const url = 'http://localhost:8080'
    const params: CreateSwapArgs = {
      providerId: 'PROVIDER1',
      address: 'a-receiver-address',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromAmount: BigInt(500),
      refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      fromNetwork: '1',
      toNetwork: 'BTC'
    }
    providerClientMock.validateAddress.mockResolvedValue(false)
    await createSwap(url, httpClient, providerResolver, params)
      .catch(e => {
        expect(e.message).toBe('Untrusted destination address')
        expect(e.details.cause).toEqual('Address returned by the server (a-payment-address) does not meet the requirements for the client to consider it as valid')
        expect(e.details.swap).toEqual(mockResult.swap)
      })
    expect(httpClient.post).toHaveBeenCalledWith(
      url + '/swaps',
      {
        providerId: 'PROVIDER1',
        address: 'a-receiver-address',
        fromToken: 'ETH',
        toToken: 'BTC',
        fromAmount: BigInt(500),
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        fromNetwork: '1',
        toNetwork: 'BTC',
        context: { publicKey: 'k1' }
      },
      { includeCaptcha: false }
    )
    expect(httpClient.post).toHaveBeenCalledTimes(1)
    expect(providerClientMock.createContext).toHaveBeenCalledTimes(1)
    expect(providerResolver.get).toHaveBeenCalledTimes(2)
    expect(providerClientMock.validateAddress).toHaveBeenCalledTimes(1)
    expect(providerClientMock.validateAddress).toHaveBeenCalledWith(mockResult.swap)
  })
})
