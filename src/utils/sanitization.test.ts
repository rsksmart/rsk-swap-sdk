import { sanitizeSwap } from './sanitization'
import { describe, expect, test } from '@jest/globals'
import { type Swap } from '../api'
import { type SwapWithAction } from '../providers/types'

describe('sanitizeSwap function should', () => {
  test('remove secretContext from swap with publicContext and secretContext', () => {
    const swap: Swap = {
      providerSwapId: 'test123',
      providerId: 'TEST',
      fromAmount: BigInt(100),
      paymentAddress: '0x123',
      receiverAddress: '0x456',
      refundAddress: '0x789',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromNetwork: '1',
      toNetwork: '31',
      status: 'CREATED',
      requiredConfirmations: 1,
      usedFees: [],
      context: {
        publicContext: { test: 'value' },
        secretContext: {
          preimage: 'secret123',
          privateKey: 'key456'
        }
      }
    }

    const sanitized = sanitizeSwap(swap)

    expect(sanitized.context).toEqual({
      publicContext: { test: 'value' }
    })
    expect((sanitized.context as any).secretContext).toBeUndefined()
  })

  test('preserve swap with only publicContext', () => {
    const swap: Swap = {
      providerSwapId: 'test123',
      providerId: 'TEST',
      fromAmount: BigInt(100),
      paymentAddress: '0x123',
      receiverAddress: '0x456',
      refundAddress: '0x789',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromNetwork: '1',
      toNetwork: '31',
      status: 'CREATED',
      requiredConfirmations: 1,
      usedFees: [],
      context: {
        publicContext: { test: 'value' }
      }
    }

    const sanitized = sanitizeSwap(swap)

    expect(sanitized).toEqual(swap)
  })

  test('handle swap with empty context object', () => {
    const swap: Swap = {
      providerSwapId: 'test123',
      providerId: 'TEST',
      fromAmount: BigInt(100),
      paymentAddress: '0x123',
      receiverAddress: '0x456',
      refundAddress: '0x789',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromNetwork: '1',
      toNetwork: '31',
      status: 'CREATED',
      requiredConfirmations: 1,
      usedFees: [],
      context: {}
    }

    const sanitized = sanitizeSwap(swap)

    expect(sanitized.context).toEqual({})
  })

  test('handle swap without secretContext property', () => {
    const swap: Swap = {
      providerSwapId: 'test123',
      providerId: 'TEST',
      fromAmount: BigInt(100),
      paymentAddress: '0x123',
      receiverAddress: '0x456',
      refundAddress: '0x789',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromNetwork: '1',
      toNetwork: '31',
      status: 'CREATED',
      requiredConfirmations: 1,
      usedFees: [],
      context: {
        someData: 'value'
      }
    }

    const sanitized = sanitizeSwap(swap)

    expect(sanitized).toEqual(swap)
  })

  test('handle SwapWithAction type correctly', () => {
    const swap: Swap = {
      providerSwapId: 'test123',
      providerId: 'TEST',
      fromAmount: BigInt(100),
      paymentAddress: '0x123',
      receiverAddress: '0x456',
      refundAddress: '0x789',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromNetwork: '1',
      toNetwork: '31',
      status: 'CREATED',
      requiredConfirmations: 1,
      usedFees: [],
      context: {
        publicContext: { test: 'value' },
        secretContext: {
          preimage: 'secret123'
        }
      }
    }

    const swapWithAction: SwapWithAction = {
      swap,
      action: {
        type: 'ERC20-PAYMENT',
        data: { to: '0xabc', value: '0', data: '0x' },
        requiresClaim: false
      }
    }

    const sanitized = sanitizeSwap(swapWithAction)

    expect((sanitized.swap.context as any).secretContext).toBeUndefined()
    expect((sanitized.swap.context as any).publicContext).toEqual({ test: 'value' })
    expect(sanitized.action).toEqual(swapWithAction.action)
  })

  test('not mutate the original swap object', () => {
    const swap: Swap = {
      providerSwapId: 'test123',
      providerId: 'TEST',
      fromAmount: BigInt(100),
      paymentAddress: '0x123',
      receiverAddress: '0x456',
      refundAddress: '0x789',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromNetwork: '1',
      toNetwork: '31',
      status: 'CREATED',
      requiredConfirmations: 1,
      usedFees: [],
      context: {
        publicContext: { test: 'value' },
        secretContext: {
          preimage: 'secret123'
        }
      }
    }

    const originalContext = JSON.stringify(swap.context)
    const sanitized = sanitizeSwap(swap)

    expect(JSON.stringify(swap.context)).toBe(originalContext)
    expect(swap).not.toBe(sanitized)
    expect((swap.context as any).secretContext).toBeDefined()
  })
})
