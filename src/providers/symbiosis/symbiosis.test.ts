import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type CreatedSwap } from '../../api/index'
import { SymbiosisClient, type SymbiosisEvmContext } from './symbiosis'

function createHttpMock (): jest.Mocked<HttpClient> {
  return {
    get: jest.fn<any>(),
    post: jest.fn<any>(),
    getCaptchaToken: jest.fn<HttpClient['getCaptchaToken']>()
  }
}

describe('SymbiosisClient should', () => {
  const apiUrl = 'http://localhost:8080/api'
  let client: SymbiosisClient
  let httpMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    httpMock = createHttpMock()
    client = new SymbiosisClient(apiUrl, httpMock)
  })

  test('create empty context', () => {
    const context = client.createContext({
      providerId: 'SYMBIOSIS',
      fromToken: 'RBTC',
      toToken: 'ETH',
      fromNetwork: '30',
      toNetwork: '1',
      fromAmount: BigInt(100),
      refundAddress: '0x1234567890123456789012345678901234567890',
      address: '0x0987654321098765432109876543210987654321'
    })
    expect(context).toEqual({
      publicContext: {},
      secretContext: {}
    })
  })

  test('validate address always returns true', async () => {
    const result = await client.validateAddress({
      providerSwapId: '123',
      providerId: 'SYMBIOSIS',
      fromAmount: BigInt(100),
      paymentAddress: '0x1234567890123456789012345678901234567890',
      receiverAddress: '0x0987654321098765432109876543210987654321',
      refundAddress: '0x1234567890123456789012345678901234567890',
      fromToken: 'RBTC',
      toToken: 'ETH',
      fromNetwork: '30',
      toNetwork: '1',
      status: 'CREATED',
      requiredConfirmations: 1,
      usedFees: [],
      context: {}
    })
    expect(result).toBe(true)
  })

  test('generate action for BIP21', async () => {
    httpMock.get.mockResolvedValueOnce({ decimals: 8 })
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'SYMBIOSIS',
        fromAmount: BigInt(100000000),
        paymentAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'BTC',
        toToken: 'RBTC',
        fromNetwork: 'BTC',
        toNetwork: '30',
        status: 'CREATED',
        requiredConfirmations: 3,
        usedFees: [],
        context: {
          depositAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
          expiresAt: '2026-02-03T00:00:00Z'
        }
      },
      actionType: 'BIP21'
    }
    const action = await client.generateAction(swap)
    expect(action).toEqual({
      requiresClaim: false,
      type: 'BIP21',
      data: 'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=1.0'
    })
    expect(httpMock.get).toHaveBeenCalledTimes(1)
    expect(httpMock.get).toHaveBeenCalledWith(apiUrl + '/tokens/BTC')
  })

  test('generate action for CONTRACT-INTERACTION', async () => {
    httpMock.get.mockResolvedValueOnce({ decimals: 18, type: 'native-evm', symbol: 'RBTC', addresses: {} })
    const context: SymbiosisEvmContext = {
      chainId: 30,
      to: '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8',
      from: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      data: '0x1234567890abcdef',
      value: '0x38d7ea4c68000'
    }
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '456',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'SYMBIOSIS',
        fromAmount: BigInt('1000000000000000'),
        paymentAddress: '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'RBTC',
        toToken: 'ETH',
        fromNetwork: '30',
        toNetwork: '1',
        status: 'CREATED',
        requiredConfirmations: 1,
        usedFees: [
          {
            amount: BigInt(5000000000000000),
            description: 'Bridge fee',
            type: 'FIXED'
          }
        ],
        context: { publicContext: context }
      },
      actionType: 'CONTRACT-INTERACTION'
    }
    const action = await client.generateAction(swap)
    expect(action).toEqual({
      requiresClaim: false,
      type: 'CONTRACT-INTERACTION',
      data: {
        to: '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8',
        data: '0x1234567890abcdef',
        value: '0x38d7ea4c68000'
      }
    })
  })

  test('generate action without approval when approveTo is not provided', async () => {
    httpMock.get.mockResolvedValueOnce({
      decimals: 6,
      type: 'erc20',
      symbol: 'USDC',
      addresses: { 30: '0xUsdcTokenAddress' }
    })
    const context: SymbiosisEvmContext = {
      chainId: 30,
      to: '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8',
      from: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      data: '0xabcdef1234567890',
      value: ''
    }
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '789',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'SYMBIOSIS',
        fromAmount: BigInt('500000000000000000'),
        paymentAddress: '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'USDC',
        toToken: 'USDT',
        fromNetwork: '30',
        toNetwork: '1',
        status: 'CREATED',
        requiredConfirmations: 1,
        usedFees: [],
        context: { publicContext: context }
      },
      actionType: 'CONTRACT-INTERACTION'
    }
    const action = await client.generateAction(swap)
    expect(action).toEqual({
      requiresClaim: false,
      type: 'CONTRACT-INTERACTION',
      data: {
        to: '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8',
        data: '0xabcdef1234567890',
        value: ''
      }
    })
    expect(action.executePreSteps).toBeUndefined()
  })

  test('fail if actionType is not supported', async () => {
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'SYMBIOSIS',
        fromAmount: BigInt(100),
        paymentAddress: '0x1234567890123456789012345678901234567890',
        receiverAddress: '0x0987654321098765432109876543210987654321',
        fromToken: 'RBTC',
        toToken: 'ETH',
        fromNetwork: '30',
        toNetwork: '1',
        status: 'CREATED',
        requiredConfirmations: 1,
        usedFees: [],
        context: {}
      },
      actionType: 'EVM-NATIVE-PAYMENT'
    }
    await expect(client.generateAction(swap)).rejects.toThrow(
      'Action type EVM-NATIVE-PAYMENT not supported for Symbiosis'
    )
  })

  test('fail if context is missing to address', async () => {
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'SYMBIOSIS',
        fromAmount: BigInt(100),
        paymentAddress: '0x1234567890123456789012345678901234567890',
        receiverAddress: '0x0987654321098765432109876543210987654321',
        fromToken: 'RBTC',
        toToken: 'ETH',
        fromNetwork: '30',
        toNetwork: '1',
        status: 'CREATED',
        requiredConfirmations: 1,
        usedFees: [],
        context: { publicContext: {} }
      },
      actionType: 'CONTRACT-INTERACTION'
    }
    await expect(client.generateAction(swap)).rejects.toThrow(
      'Missing "to" address in Symbiosis swap context'
    )
  })

  test('generate action with executePreSteps for ERC20 swaps when approveTo is provided', async () => {
    httpMock.get.mockResolvedValueOnce({
      decimals: 6,
      type: 'erc20',
      symbol: 'USDC',
      addresses: { 30: '0xUsdcTokenAddress12345678901234567890' }
    })
    const context: SymbiosisEvmContext = {
      chainId: 30,
      to: '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8',
      from: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      data: '0xabcdef1234567890',
      value: '0x0',
      approveTo: '0xRouterContractAddress1234567890123456',
      tokenAddress: '0xUsdcTokenAddress12345678901234567890',
      approveAmount: '1000000000000000000'
    }
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '999',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'SYMBIOSIS',
        fromAmount: BigInt('1000000000000000000'),
        paymentAddress: '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'USDC',
        toToken: 'USDT',
        fromNetwork: '30',
        toNetwork: '1',
        status: 'CREATED',
        requiredConfirmations: 1,
        usedFees: [],
        context: { publicContext: context }
      },
      actionType: 'CONTRACT-INTERACTION'
    }
    const action = await client.generateAction(swap)
    expect(action.type).toBe('CONTRACT-INTERACTION')
    expect(action.requiresClaim).toBe(false)
    expect(action.data).toEqual({
      to: '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8',
      data: '0xabcdef1234567890',
      value: '0x0'
    })
    expect(action.executePreSteps).toBeInstanceOf(Function)
  })

  test('generate action with executePreSteps for ERC677 tokens (like RIF)', async () => {
    httpMock.get.mockResolvedValueOnce({
      decimals: 18,
      type: 'erc677',
      symbol: 'RIF',
      addresses: { 30: '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5' }
    })
    const context: SymbiosisEvmContext = {
      chainId: 30,
      to: '0x7057ab3fb2bee9c18e0cde4240de4ff7f159e365',
      from: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      data: '0xabcdef1234567890',
      value: '0x0',
      approveTo: '0xfffdb2a69abcbbf55ecb2f6b348e0bd3d0f9f2e1',
      tokenAddress: '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5'
    }
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '1000',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'SYMBIOSIS',
        fromAmount: BigInt('111000000000000000000'),
        paymentAddress: '0x7057ab3fb2bee9c18e0cde4240de4ff7f159e365',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'RIF',
        toToken: 'USDT',
        fromNetwork: '30',
        toNetwork: '1',
        status: 'CREATED',
        requiredConfirmations: 1,
        usedFees: [],
        context: { publicContext: context }
      },
      actionType: 'CONTRACT-INTERACTION'
    }
    const action = await client.generateAction(swap)
    expect(action.type).toBe('CONTRACT-INTERACTION')
    expect(action.requiresClaim).toBe(false)
    expect(action.data).toEqual({
      to: '0x7057ab3fb2bee9c18e0cde4240de4ff7f159e365',
      data: '0xabcdef1234567890',
      value: '0x0'
    })
    expect(action.executePreSteps).toBeInstanceOf(Function)
  })
})
