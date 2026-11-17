import { describe, expect, test, jest } from '@jest/globals'
import { type CreatedSwap } from '../../api/index'
import { RSK_SWAP_ERROR_CODES } from '../../error/codes'
import { type SwapAction } from '../types'
import { TOKEN_REGISTRY, type PinnedToken } from '../../constants/tokens'
import { SymbiosisClient, type SymbiosisEvmContext } from './symbiosis'
import { createApprovalHandler } from './approval'
import { networks } from 'bitcoinjs-lib'

jest.mock('./approval', () => {
  const actual = jest.requireActual<typeof import('./approval')>('./approval')
  return { createApprovalHandler: jest.fn(actual.createApprovalHandler) }
})

describe('SymbiosisClient should', () => {
  const usdt0Address = '0x779Ded0c9e1022225f8E0630b35a9b54bE713736'
  const client = new SymbiosisClient(networks.bitcoin)
  const generateAction = async (createdSwap: CreatedSwap): Promise<SwapAction> =>
    client.generateAction(createdSwap, TOKEN_REGISTRY[createdSwap.swap.fromNetwork]?.[createdSwap.swap.fromToken] as PinnedToken)

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

  function bip21Swap (address: string): CreatedSwap {
    return {
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
          publicContext: {
            depositAddress: address,
            expiresAt: '2026-02-03T00:00:00Z'
          }
        }
      },
      actionType: 'BIP21'
    }
  }

  test('generate action for BIP21', async () => {
    const action = await generateAction(bip21Swap('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'))
    expect(action).toEqual({
      requiresClaim: false,
      type: 'BIP21',
      data: 'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=1.0'
    })
  })

  test.each([
    ['an address with a query string', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.019&x='],
    ['a testnet address', 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx']
  ])('fail to generate BIP21 action for %s', async (_, address) => {
    const swap = bip21Swap(address)
    await expect(generateAction(swap)).rejects.toThrow(`Invalid Bitcoin address: ${address}`)
  })
  test('generate action for CONTRACT-INTERACTION', async () => {
    const context: SymbiosisEvmContext = {
      chainId: 30,
      to: '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421',
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
        paymentAddress: '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421',
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
            type: 'FIXED_NETWORK_FEE'
          }
        ],
        context: { publicContext: context }
      },
      actionType: 'CONTRACT-INTERACTION'
    }
    const action = await generateAction(swap)
    expect(action).toEqual({
      requiresClaim: false,
      chainId: 30,
      type: 'CONTRACT-INTERACTION',
      data: {
        to: '0x7f6fb9f3ce785f3d85772c038fda58ec9432d421',
        data: '0x1234567890abcdef',
        value: '0x38d7ea4c68000'
      }
    })
  })

  test('generate action without approval when approveTo is not provided', async () => {
    const context: SymbiosisEvmContext = {
      chainId: 30,
      to: '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421',
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
        paymentAddress: '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'USDT0',
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
    const action = await generateAction(swap)
    expect(action).toEqual({
      requiresClaim: false,
      chainId: 30,
      type: 'CONTRACT-INTERACTION',
      data: {
        to: '0x7f6fb9f3ce785f3d85772c038fda58ec9432d421',
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
    await expect(generateAction(swap)).rejects.toThrow(
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
    await expect(generateAction(swap)).rejects.toThrow(
      'Missing "to" address in Symbiosis swap context'
    )
  })

  test('generate action with executePreSteps for ERC20 swaps when approveTo is provided', async () => {
    const context: SymbiosisEvmContext = {
      chainId: 30,
      to: '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421',
      from: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      data: '0xabcdef1234567890',
      value: '0x0',
      approveTo: '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421',
      tokenAddress: usdt0Address,
      approveAmount: '1000000000000000000'
    }
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '999',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'SYMBIOSIS',
        fromAmount: BigInt('1000000000000000000'),
        paymentAddress: '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'USDT0',
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
    const action = await generateAction(swap)
    expect(action.type).toBe('CONTRACT-INTERACTION')
    expect(action.requiresClaim).toBe(false)
    expect(action.data).toEqual({
      to: '0x7f6fb9f3ce785f3d85772c038fda58ec9432d421',
      data: '0xabcdef1234567890',
      value: '0x0'
    })
    expect(action.executePreSteps).toBeInstanceOf(Function)
  })

  test('generate action with executePreSteps for ERC677 tokens (like RIF)', async () => {
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
    const action = await generateAction(swap)
    expect(action.type).toBe('CONTRACT-INTERACTION')
    expect(action.requiresClaim).toBe(false)
    expect(action.data).toEqual({
      to: '0x7057ab3fb2bee9c18e0cde4240de4ff7f159e365',
      data: '0xabcdef1234567890',
      value: '0x0'
    })
    expect(action.executePreSteps).toBeInstanceOf(Function)
  })

  describe('for an ERC20 CONTRACT-INTERACTION', () => {
    const router = '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421'
    const buildSwap = (context: Partial<SymbiosisEvmContext>): CreatedSwap => ({
      swap: {
        providerSwapId: '1001',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'SYMBIOSIS',
        fromAmount: BigInt('1000000'),
        paymentAddress: router,
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'USDT0',
        toToken: 'USDC',
        fromNetwork: '30',
        toNetwork: '1',
        status: 'CREATED',
        requiredConfirmations: 1,
        usedFees: [],
        context: {
          publicContext: {
            chainId: 30,
            to: router,
            from: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
            data: '0xabcdef',
            value: '0',
            approveTo: router,
            tokenAddress: usdt0Address,
            approveAmount: '1000000',
            ...context
          }
        }
      },
      actionType: 'CONTRACT-INTERACTION'
    })

    test('grant the approval to the pinned spender for at most fromAmount', async () => {
      const action = await generateAction(buildSwap({ approveAmount: '400000' }))
      expect(action.chainId).toBe(30)
      expect(createApprovalHandler).toHaveBeenCalledWith({ tokenAddress: usdt0Address, spender: router, amount: '400000' })
    })

    test('grant the approval to the gateway of the metarouter that uses one', async () => {
      const metaRouter = '0x7057ab3fb2bee9c18e0cde4240de4ff7f159e365'
      const gateway = '0xfffdb2a69abcbbf55ecb2f6b348e0bd3d0f9f2e1'
      await generateAction(buildSwap({ to: metaRouter, approveTo: gateway }))
      expect(createApprovalHandler).toHaveBeenCalledWith({ tokenAddress: usdt0Address, spender: gateway, amount: '1000000' })
    })

    test('grant the approval to the gateway of the Ethereum metarouter', async () => {
      const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
      const metaRouter = '0xf621Fb08BBE51aF70e7E0F4EA63496894166Ff7F'
      const gateway = '0xfCEF2Fe72413b65d3F393d278A714caD87512bcd'
      const created = buildSwap({ chainId: 1, to: metaRouter, approveTo: gateway, tokenAddress: usdcAddress })
      created.swap = { ...created.swap, fromNetwork: '1', toNetwork: '30', fromToken: 'USDC', toToken: 'RIF', paymentAddress: metaRouter }
      const action = await generateAction(created)
      expect(action.chainId).toBe(1)
      expect(action.data).toMatchObject({ to: metaRouter.toLowerCase() })
      expect(createApprovalHandler).toHaveBeenCalledWith({ tokenAddress: usdcAddress, spender: gateway, amount: '1000000' })
    })

    test('accept router and spender addresses with an RSK checksum', async () => {
      const action = await generateAction(buildSwap({ to: '0x7f6Fb9F3cE785f3D85772C038fda58EC9432d421', approveTo: '0x7f6Fb9F3cE785f3D85772C038fda58EC9432d421' }))
      expect(action.data).toMatchObject({ to: '0x7f6fb9f3ce785f3d85772c038fda58ec9432d421' })
      expect(createApprovalHandler).toHaveBeenCalledWith({ tokenAddress: usdt0Address, spender: router, amount: '1000000' })
      await generateAction(buildSwap({ to: '0x7057ab3fb2bee9c18e0cde4240de4ff7f159e365', approveTo: '0xFFfDb2A69AbCbBF55ecB2F6B348E0bd3d0f9f2E1' }))
      expect(createApprovalHandler).toHaveBeenLastCalledWith({ tokenAddress: usdt0Address, spender: '0xfffdb2a69abcbbf55ecb2f6b348e0bd3d0f9f2e1', amount: '1000000' })
    })

    test('reject an approval to a spender other than the pinned one', async () => {
      await expect(generateAction(buildSwap({ approveTo: '0x79568c2989232dCa1840087D73d403602364c0D4' })))
        .rejects.toMatchObject({ code: RSK_SWAP_ERROR_CODES.UNTRUSTED_ADDRESS.code })
      expect(createApprovalHandler).not.toHaveBeenCalled()
    })

    test('reject an approval above fromAmount', async () => {
      await expect(generateAction(buildSwap({ approveAmount: '1000001' })))
        .rejects.toMatchObject({ code: RSK_SWAP_ERROR_CODES.MANIPULATED_API_RESPONSE.code })
      expect(createApprovalHandler).not.toHaveBeenCalled()
    })

    test('reject a transaction to a contract other than the pinned router', async () => {
      await expect(generateAction(buildSwap({ to: usdt0Address })))
        .rejects.toMatchObject({ code: RSK_SWAP_ERROR_CODES.UNTRUSTED_ADDRESS.code })
    })

    test('reject a transaction carrying native value above the fee allowance', async () => {
      await expect(generateAction(buildSwap({ value: '1000000000000001' })))
        .rejects.toMatchObject({ code: RSK_SWAP_ERROR_CODES.MANIPULATED_API_RESPONSE.code })
    })
  })
})
