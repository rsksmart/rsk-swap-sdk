import { describe, expect, test } from '@jest/globals'
import { type CreatedSwap } from '../../api/index'
import { ChangellyClient } from './changelly'

describe('ChangellyClient should', () => {
  const client = new ChangellyClient()

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
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'CHANGELLY',
        fromAmount: BigInt(100000000),
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
      actionType: 'BIP21'
    }
    const action = await client.generateAction(swap)
    expect(action).toEqual({
      requiresClaim: false,
      type: 'BIP21',
      data: 'bitcoin:paymentAddress?amount=1.0'
    })
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
    const action = await client.generateAction(swap)
    expect(action).toEqual({
      requiresClaim: false,
      type: 'ERC20-PAYMENT',
      data: {
        to: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        value: '0x0',
        data: '0xa9059cbb000000000000000000000000d5f00abfbea7a0b193836cac6833c2ad9d06cea8000000000000000000000000000000000000000000000000000000000269fb20'
      }
    })
  })
  test('generate action for EVM-NATIVE-PAYMENT', async () => {
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
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
            type: 'FIXED_CHANGELLY_FEE'
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
      await client.generateAction(swap)
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
    const action = await client.generateAction(swap)
    expect((action.data as { to: string }).to).toBe('0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d')
  })

  test('fail for a token that is not supported on the origin network', async () => {
    const swap: CreatedSwap = {
      swap: {
        providerSwapId: '123',
        refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        providerId: 'CHANGELLY',
        fromAmount: BigInt(100),
        paymentAddress: '0xd5f00abfbea7a0b193836cac6833c2ad9d06cea8',
        receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        fromToken: 'BTCB',
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
    await expect(client.generateAction(swap)).rejects.toThrow('Token BTCB is not supported on 56')
  })
})
