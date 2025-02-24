import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type CreatedSwap } from '../api/index'
import { ChangellyClient } from './changelly'

describe('ChangellyClient should', () => {
  const apiUrl = 'http://localhost:8080/api'
  let client: ChangellyClient
  let httpMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    httpMock = { // eslint-disable-line @typescript-eslint/consistent-type-assertions
      get: jest.fn(),
      post: jest.fn(),
      getCaptchaToken: jest.fn()
    } as jest.Mocked<HttpClient>
    client = new ChangellyClient(apiUrl, httpMock)
  })

  test('create Changelly context', async () => {
    const context = client.createContext({
      providerId: 'CHANGELLY',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromNetwork: '1',
      toNetwork: 'BTC',
      fromAmount: BigInt(100),
      refundAddress: 'refundAddress',
      address: 'address'
    })
    expect(context).toEqual({
      publicContext: {},
      secretContext: {}
    })
  })
  test('generate action for BIP21', async () => {
    httpMock.get.mockResolvedValueOnce({ decimals: 8 })
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        providerId: 'CHANGELLY',
        fromAmount: BigInt(100000000),
        paymentAddress: 'paymentAddress',
        receiverAddress: 'receiverAddress',
        fromToken: 'BTC',
        toToken: 'ETH',
        fromNetwork: '1',
        toNetwork: 'BTC',
        status: 'CREATED',
        requiredConfirmations: 3,
        usedFees: [
          {
            amount: BigInt(10000000),
            description: 'fee 1',
            type: 'FIXED'
          }
        ],
        context: {}
      },
      actionType: 'BIP21'
    }
    const action = await client.generateAction(swap)
    expect(action).toEqual({
      requiresClaim: false,
      type: 'BIP21',
      data: 'bitcoin:paymentAddress?amount=1.0'
    })
    expect(httpMock.get).toHaveBeenCalledTimes(1)
    expect(httpMock.get).toHaveBeenCalledWith(apiUrl + '/tokens/BTC')
  })
  test('generate action for ERC20-PAYMENT', async () => {
    httpMock.get.mockResolvedValueOnce({
      decimals: 6,
      addresses: { 1: '0xdac17f958d2ee523a2206206994597c13d831ec7' }
    })
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        providerId: 'CHANGELLY',
        fromAmount: BigInt(40500000),
        paymentAddress: '0xd5f00abfbea7a0b193836cac6833c2ad9d06cea8',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'USDT',
        toToken: 'ETH',
        fromNetwork: '1',
        toNetwork: '1',
        status: 'CREATED',
        requiredConfirmations: 3,
        usedFees: [
          {
            amount: BigInt(10000000),
            description: 'fee 1',
            type: 'FIXED'
          }
        ],
        context: {}
      },
      actionType: 'ERC20-PAYMENT'
    }
    const action = await client.generateAction(swap)
    expect(action).toEqual({
      requiresClaim: false,
      type: 'ERC20-PAYMENT',
      data: {
        to: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        value: '0x0',
        data: '0xa9059cbb000000000000000000000000d5f00abfbea7a0b193836cac6833c2ad9d06cea8000000000000000000000000000000000000000000000000000000000269fb20'
      }
    })
    expect(httpMock.get).toHaveBeenCalledTimes(1)
    expect(httpMock.get).toHaveBeenCalledWith(apiUrl + '/tokens/USDT')
  })
  test('generate action for EVM-NATIVE-PAYMENT', async () => {
    httpMock.get.mockResolvedValueOnce({
      decimals: 18
    })
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        providerId: 'CHANGELLY',
        fromAmount: BigInt('1255000000000000000'),
        paymentAddress: '0xd5f00abfbea7a0b193836cac6833c2ad9d06cea8',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'ETH',
        toToken: 'RBTC',
        fromNetwork: '1',
        toNetwork: '30',
        status: 'CREATED',
        requiredConfirmations: 3,
        usedFees: [
          {
            amount: BigInt(10000000),
            description: 'fee 1',
            type: 'FIXED'
          }
        ],
        context: {}
      },
      actionType: 'EVM-NATIVE-PAYMENT'
    }
    const action = await client.generateAction(swap)
    expect(action).toEqual({
      requiresClaim: false,
      type: 'EVM-NATIVE-PAYMENT',
      data: {
        to: '0xd5f00abfbea7a0b193836cac6833c2ad9d06cea8',
        value: '0x116aa7d9c91d8000',
        data: '0x'
      }
    })
    expect(httpMock.get).toHaveBeenCalledTimes(1)
    expect(httpMock.get).toHaveBeenCalledWith(apiUrl + '/tokens/ETH')
  })
  test('fail if actionType is not supported by Changelly', async () => {
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        providerId: 'CHANGELLY',
        fromAmount: BigInt(100),
        paymentAddress: 'paymentAddress',
        receiverAddress: 'receiverAddress',
        fromToken: 'BTC',
        toToken: 'ETH',
        fromNetwork: '1',
        toNetwork: 'BTC',
        status: 'CREATED',
        requiredConfirmations: 3,
        usedFees: [
          {
            amount: BigInt(10000000),
            description: 'fee 1',
            type: 'FIXED'
          }
        ],
        context: {}
      },
      actionType: 'NONE'
    }
    expect.assertions(1)
    try {
      await client.generateAction(swap)
    } catch (e: any) {
      expect(e.message).toBe('Action type NONE not supported for Changelly')
    }
  })
})
