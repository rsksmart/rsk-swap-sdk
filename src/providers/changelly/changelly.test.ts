import { describe, expect, test } from '@jest/globals'
import { type CreatedSwap } from '../../api/index'
import { type SwapAction } from '../types'
import { TOKEN_REGISTRY, type PinnedToken } from '../../constants/tokens'
import { ChangellyClient } from './changelly'
import { networks } from 'bitcoinjs-lib'

describe('ChangellyClient should', () => {
  const client = new ChangellyClient(networks.bitcoin)
  const generateAction = async (createdSwap: CreatedSwap): Promise<SwapAction> =>
    client.generateAction(createdSwap, TOKEN_REGISTRY[createdSwap.swap.fromNetwork]?.[createdSwap.swap.fromToken] as PinnedToken)

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

  function bip21Swap (address: string): CreatedSwap {
    return {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'CHANGELLY',
        fromAmount: BigInt(100000000),
        paymentAddress: address,
        receiverAddress: 'receiverAddress',
        fromToken: 'BTC',
        toToken: 'ETH',
        fromNetwork: 'BTC',
        toNetwork: '1',
        status: 'CREATED',
        requiredConfirmations: 3,
        usedFees: [
          {
            amount: BigInt(10000000),
            type: 'FIXED_CHANGELLY_FEE'
          }
        ],
        context: {}
      },
      actionType: 'BIP21'
    }
  }

  test('generate action for BIP21', async () => {
    const action = await generateAction(bip21Swap('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'))
    expect(action).toEqual({
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
  test('generate action for ERC20-PAYMENT', async () => {
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
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
            type: 'FIXED_CHANGELLY_FEE'
          }
        ],
        context: {}
      },
      actionType: 'ERC20-PAYMENT'
    }
    const action = await generateAction(swap)
    expect(action).toEqual({
      type: 'ERC20-PAYMENT',
      data: {
        to: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        value: '0x0',
        data: '0xa9059cbb000000000000000000000000d5f00abfbea7a0b193836cac6833c2ad9d06cea8000000000000000000000000000000000000000000000000000000000269fb20'
      }
    })
  })
  test.each([
    ['a bigint', BigInt('1255000000000000000')],
    ['a decimal string', '1255000000000000000']
  ])('generate action for EVM-NATIVE-PAYMENT with fromAmount as %s', async (_, fromAmount) => {
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'CHANGELLY',
        fromAmount: fromAmount as bigint,
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
            type: 'FIXED_CHANGELLY_FEE'
          }
        ],
        context: {}
      },
      actionType: 'EVM-NATIVE-PAYMENT'
    }
    const action = await generateAction(swap)
    expect(action).toEqual({
      type: 'EVM-NATIVE-PAYMENT',
      data: {
        to: '0xd5f00abfbea7a0b193836cac6833c2ad9d06cea8',
        value: '0x116aa7d9c91d8000',
        data: '0x'
      }
    })
  })
  test('fail if actionType is not supported by Changelly', async () => {
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'CHANGELLY',
        fromAmount: BigInt(100),
        paymentAddress: 'paymentAddress',
        receiverAddress: 'receiverAddress',
        fromToken: 'BTC',
        toToken: 'ETH',
        fromNetwork: 'BTC',
        toNetwork: '1',
        status: 'CREATED',
        requiredConfirmations: 3,
        usedFees: [
          {
            amount: BigInt(10000000),
            type: 'FIXED_CHANGELLY_FEE'
          }
        ],
        context: {}
      },
      actionType: 'NONE'
    }
    expect.assertions(1)
    try {
      await generateAction(swap)
    } catch (e: any) {
      expect(e.message).toBe('Action type NONE not supported for Changelly')
    }
  })

  test('pay an ERC20 swap to the pinned token contract of the origin network', async () => {
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'CHANGELLY',
        fromAmount: BigInt('100000000000000000000'),
        paymentAddress: '0xd5f00abfbea7a0b193836cac6833c2ad9d06cea8',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'USDC',
        toToken: 'RBTC',
        fromNetwork: '56',
        toNetwork: '30',
        status: 'CREATED',
        requiredConfirmations: 3,
        usedFees: [],
        context: {}
      },
      actionType: 'ERC20-PAYMENT'
    }
    const action = await generateAction(swap)
    expect((action.data as { to: string }).to).toBe('0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d')
  })
})
