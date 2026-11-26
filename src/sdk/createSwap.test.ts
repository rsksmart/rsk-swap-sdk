import { describe, expect, test, beforeEach, jest, afterEach } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { createSwap, type CreateSwapArgs } from './createSwap'
import { type CreatedSwap } from '../api'
import { type SwapProviderClient } from '../providers/types'
import { ProviderClientResolver } from '../providers/resolver'
import JSONbig from 'json-bigint'
import { sanitizeSwap } from '../utils/sanitization'
import { RSK_SWAP_ERROR_CODES } from '../error/codes'

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
            type: 'FIXED_CHANGELLY_FEE'
          }
        ],
        context: { publicKey: 'k1' }
      },
      actionType: 'EVM-NATIVE-PAYMENT'
    }
    const getCaptchaToken: jest.MockedFunction<HttpClient['getCaptchaToken']> = jest.fn<HttpClient['getCaptchaToken']>()
    const get: jest.MockedFunction<HttpClient['get']> = jest.fn<any>()
    const post: jest.MockedFunction<HttpClient['post']> = jest.fn<any>().mockResolvedValueOnce(mockResult)
    httpClient = { getCaptchaToken, get, post }
    providerResolver = new ProviderClientResolver()
    providerClientMock = providerResolver.get('PROVIDER1') as jest.Mocked<SwapProviderClient>
    providerClientMock.createContext.mockReturnValue({ publicContext: { publicKey: 'k1' }, secretContext: { privateKey: 'k2' } })
  })

  afterEach(() => {
    jest.clearAllMocks()
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
      }
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
            type: 'FIXED_CHANGELLY_FEE'
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
        fromNetwork: '1',
        chainId: 1
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
      { includeCaptcha: true }
    )
    expect(httpClient.post).toHaveBeenCalledTimes(1)
    expect(providerClientMock.createContext).toHaveBeenCalledTimes(1)
    expect(providerClientMock.createContext).toHaveBeenCalledWith(params)
    expect(providerResolver.get).toHaveBeenCalledTimes(2)
    expect(providerClientMock.validateAddress).toHaveBeenCalledTimes(1)
    expect(providerClientMock.validateAddress).toHaveBeenCalledWith(mockResult.swap)
    expect(providerClientMock.generateAction).toHaveBeenCalledTimes(1)
    expect(providerClientMock.generateAction).toHaveBeenCalledWith(mockResult, { type: 'native-evm', decimals: 18 })
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
      await expect(createSwap(url, httpClient, providerResolver, copy)).rejects.toThrow(`Validation failed for object with following missing properties: ${field}`)
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
        expect(e.details.swap).toEqual(sanitizeSwap(mockResult.swap))
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
      { includeCaptcha: true }
    )
    expect(httpClient.post).toHaveBeenCalledTimes(1)
    expect(providerClientMock.createContext).toHaveBeenCalledTimes(1)
    expect(providerResolver.get).toHaveBeenCalledTimes(2)
    expect(providerClientMock.validateAddress).toHaveBeenCalledTimes(1)
    expect(providerClientMock.validateAddress).toHaveBeenCalledWith(mockResult.swap)
  })

  test('fail on manipulated context', async () => {
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
      }
    })
    const manipulatedResult = structuredClone(mockResult);
    (manipulatedResult.swap.context as { publicKey: string }).publicKey = 'manipulated-key'
    httpClient.post = jest.fn<any>().mockResolvedValueOnce(manipulatedResult)
    await expect(createSwap(url, httpClient, providerResolver, params)).rejects.toThrow('The result returned with the API doesn\'t match with the request')
  })

  describe('when the API returns fromAmount', () => {
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

    test.each([
      ['a string', '500'],
      ['an array', ['500']],
      ['a decimal number', 500.5]
    ])('as %s, fail', async (_, fromAmount) => {
      const result = structuredClone(mockResult);
      (result.swap as { fromAmount: unknown }).fromAmount = fromAmount
      httpClient.post = jest.fn<any>().mockResolvedValueOnce(result)
      await expect(createSwap('http://localhost:8080', httpClient, providerResolver, params)).rejects.toThrow('The result returned with the API doesn\'t match with the request')
      expect(providerClientMock.validateAddress).not.toHaveBeenCalled()
      expect(providerClientMock.generateAction).not.toHaveBeenCalled()
    })

    test('as an unsafe integer number matching the request, fail', async () => {
      const unsafeAmount = 9007199254740992 // Number.MAX_SAFE_INTEGER + 1
      const result = structuredClone(mockResult)
      result.swap.fromAmount = unsafeAmount
      httpClient.post = jest.fn<any>().mockResolvedValueOnce(result)
      await expect(createSwap('http://localhost:8080', httpClient, providerResolver, { ...params, fromAmount: BigInt(unsafeAmount) })).rejects.toThrow('The result returned with the API doesn\'t match with the request')
      expect(providerClientMock.validateAddress).not.toHaveBeenCalled()
      expect(providerClientMock.generateAction).not.toHaveBeenCalled()
    })

    test('as a number, return it as the request bigint', async () => {
      const result = structuredClone(mockResult)
      result.swap.fromAmount = 500
      httpClient.post = jest.fn<any>().mockResolvedValueOnce(result)
      providerClientMock.validateAddress.mockResolvedValue(true)
      providerClientMock.generateAction.mockResolvedValue({ type: 'ERC20-PAYMENT', data: { to: 'a-payment-address', data: '0x', value: '0x0' } })
      const created = await createSwap('http://localhost:8080', httpClient, providerResolver, params)
      expect(created.swap.fromAmount).toBe(BigInt(500))
      expect(providerClientMock.generateAction).toHaveBeenCalledWith(expect.objectContaining({ swap: expect.objectContaining({ fromAmount: BigInt(500) }) }), { type: 'native-evm', decimals: 18 })
    })
  })

  describe('for the action type returned by the API', () => {
    const url = 'http://localhost:8080'
    const buildArgs = (providerId: string, fromNetwork: string, fromToken: string): CreateSwapArgs => ({
      providerId,
      address: 'a-receiver-address',
      fromToken,
      toToken: 'RBTC',
      fromAmount: BigInt(500),
      refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      fromNetwork,
      toNetwork: '30'
    })
    const mockApiResult = (args: CreateSwapArgs, actionType: CreatedSwap['actionType']): void => {
      const result = structuredClone(mockResult)
      result.swap = { ...result.swap, providerId: args.providerId, fromNetwork: args.fromNetwork, fromToken: args.fromToken, toNetwork: args.toNetwork, toToken: args.toToken }
      result.actionType = actionType
      httpClient.post = jest.fn<any>().mockResolvedValueOnce(result)
    }

    beforeEach(() => {
      providerClientMock.validateAddress.mockResolvedValue(true)
      providerClientMock.generateAction.mockResolvedValue({ type: 'NONE', data: '' })
    })

    test.each([
      ['CHANGELLY', 'BTC', 'BTC', 'BIP21', undefined],
      ['SYMBIOSIS', 'BTC', 'BTC', 'BIP21', undefined],
      ['CHANGELLY', '56', 'BNB', 'EVM-NATIVE-PAYMENT', 56],
      ['CHANGELLY', '1', 'USDC', 'ERC20-PAYMENT', 1],
      ['LIFI', '30', 'RBTC', 'EVM-NATIVE-PAYMENT', 30],
      ['LIFI', '30', 'RIF', 'ERC20-PAYMENT', 30],
      ['SYMBIOSIS', '30', 'USDT0', 'CONTRACT-INTERACTION', 30]
    ] as const)('accept from %s a swap paid from %s with %s as %s bound to chain %s', async (providerId, fromNetwork, fromToken, actionType, chainId) => {
      const args = buildArgs(providerId, fromNetwork, fromToken)
      mockApiResult(args, actionType)
      const result = await createSwap(url, httpClient, providerResolver, args)
      expect(result.action.fromNetwork).toBe(fromNetwork)
      expect(result.action.chainId).toBe(chainId)
      expect(providerClientMock.generateAction).toHaveBeenCalledTimes(1)
    })

    test.each([
      ['CHANGELLY', '1', 'USDC', 'EVM-NATIVE-PAYMENT'],
      ['CHANGELLY', '56', 'BNB', 'ERC20-PAYMENT'],
      ['CHANGELLY', 'BTC', 'BTC', 'ERC20-PAYMENT'],
      ['CHANGELLY', 'BTC', 'BTC', 'EVM-NATIVE-PAYMENT'],
      ['SYMBIOSIS', 'BTC', 'BTC', 'CONTRACT-INTERACTION'],
      ['SYMBIOSIS', '30', 'USDT0', 'ERC20-PAYMENT'],
      ['LIFI', '30', 'RIF', 'CONTRACT-INTERACTION']
    ] as const)('reject from %s a swap paid from %s with %s as %s', async (providerId, fromNetwork, fromToken, actionType) => {
      const args = buildArgs(providerId, fromNetwork, fromToken)
      mockApiResult(args, actionType)
      await expect(createSwap(url, httpClient, providerResolver, args))
        .rejects.toMatchObject({ code: RSK_SWAP_ERROR_CODES.MANIPULATED_API_RESPONSE.code })
      expect(providerClientMock.generateAction).not.toHaveBeenCalled()
    })

    test.each([
      ['1', 'RIF'],
      ['30', 'USDC'],
      ['31', 'tRBTC'],
      ['BTC', 'RBTC']
    ])('reject a swap paid from %s with %s before calling the API', async (fromNetwork, fromToken) => {
      await expect(createSwap(url, httpClient, providerResolver, buildArgs('CHANGELLY', fromNetwork, fromToken)))
        .rejects.toMatchObject({
          code: RSK_SWAP_ERROR_CODES.UNSUPPORTED_TOKEN.code,
          details: { cause: `Token ${fromToken} is not supported on ${fromNetwork}`, network: fromNetwork, token: fromToken }
        })
      expect(httpClient.post).not.toHaveBeenCalled()
    })
  })
})
