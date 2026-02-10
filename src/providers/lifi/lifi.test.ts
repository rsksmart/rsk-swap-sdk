import { describe, expect, test } from '@jest/globals'
import { type CreateSwapResult } from '../../api/index'
import { type TxData } from '../types'
import { LiFiClient } from './lifi'

describe('LiFiClient should', () => {
  const client = new LiFiClient()

  const baseSwap: any = {
    providerSwapId: 'lifi-123',
    refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
    providerId: 'LIFI',
    fromAmount: BigInt('1000000'),
    paymentAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
    receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
    fromToken: 'USDC',
    toToken: 'RBTC',
    fromNetwork: '1',
    toNetwork: '30',
    status: 'CREATED',
    requiredConfirmations: 1,
    usedFees: [],
    context: {}
  }

  test('pass through ERC20-PAYMENT tx data from swap context', async () => {
    const expectedTxData: TxData = {
      to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
      data: '0x4630a0d8000000000000000000000000',
      value: '0x0'
    }
    const createdSwap: CreateSwapResult = {
      swap: {
        ...baseSwap,
        context: { publicContext: expectedTxData }
      },
      actionType: 'ERC20-PAYMENT'
    }

    const action = await client.generateAction(createdSwap)

    expect(action.type).toBe('ERC20-PAYMENT')
    expect(action.requiresClaim).toBe(false)
    expect(action.data).toEqual(expectedTxData)
  })

  test('pass through EVM-NATIVE-PAYMENT tx data from swap context', async () => {
    const expectedTxData: TxData = {
      to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
      data: '0x4630a0d8000000000000000000000000',
      value: '0x2386f26fc10000'
    }
    const createdSwap: CreateSwapResult = {
      swap: {
        ...baseSwap,
        context: { publicContext: expectedTxData }
      },
      actionType: 'EVM-NATIVE-PAYMENT'
    }

    const action = await client.generateAction(createdSwap)

    expect(action.type).toBe('EVM-NATIVE-PAYMENT')
    expect(action.requiresClaim).toBe(false)
    expect(action.data).toEqual(expectedTxData)
  })

  test('reject unsupported BIP21 action type', async () => {
    const createdSwap: CreateSwapResult = {
      swap: baseSwap,
      actionType: 'BIP21'
    }

    await expect(client.generateAction(createdSwap)).rejects.toThrow(
      'Action type BIP21 not supported for LI.FI'
    )
  })

  test('reject unsupported BOLT11 action type', async () => {
    const createdSwap: CreateSwapResult = {
      swap: baseSwap,
      actionType: 'BOLT11'
    }

    await expect(client.generateAction(createdSwap)).rejects.toThrow(
      'Action type BOLT11 not supported for LI.FI'
    )
  })

  test('reject unsupported NONE action type', async () => {
    const createdSwap: CreateSwapResult = {
      swap: baseSwap,
      actionType: 'NONE'
    }

    await expect(client.generateAction(createdSwap)).rejects.toThrow(
      'Action type NONE not supported for LI.FI'
    )
  })

  test('reject unsupported CONTRACT-INTERACTION action type', async () => {
    const createdSwap: CreateSwapResult = {
      swap: baseSwap,
      actionType: 'CONTRACT-INTERACTION'
    }

    await expect(client.generateAction(createdSwap)).rejects.toThrow(
      'Action type CONTRACT-INTERACTION not supported for LI.FI'
    )
  })

  test('create empty context', () => {
    const context = client.createContext({
      fromAmount: BigInt(0),
      fromToken: 'ETH',
      toToken: 'RBTC',
      fromNetwork: '1',
      toNetwork: '30',
      address: '0x',
      refundAddress: '0x',
      providerId: 'LIFI'
    })

    expect(context).toEqual({
      publicContext: {},
      secretContext: {}
    })
  })

  test('validate address should always return true', async () => {
    const isValid = await client.validateAddress(baseSwap)
    expect(isValid).toBe(true)
  })

  test('throw error when payment address mismatches publicContext.to', async () => {
    const expectedTxData: TxData = {
      to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
      data: '0x4630a0d8000000000000000000000000',
      value: '0x0'
    }
    const createdSwap: CreateSwapResult = {
      swap: {
        ...baseSwap,
        paymentAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
        context: { publicContext: expectedTxData }
      },
      actionType: 'ERC20-PAYMENT'
    }

    await expect(client.generateAction(createdSwap)).rejects.toThrow(
      'LI.FI payment address mismatch: 0x79568c2989232dCa1840087D73d403602364c0D4 !== 0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE'
    )
  })

  test('throw error when publicContext is missing', async () => {
    const createdSwap: CreateSwapResult = {
      swap: {
        ...baseSwap,
        context: {}
      },
      actionType: 'ERC20-PAYMENT'
    }

    await expect(client.generateAction(createdSwap)).rejects.toThrow(
      'LI.FI swap context missing required publicContext fields (to, data, value)'
    )
  })

  test('throw error when publicContext is missing required fields', async () => {
    const createdSwap: CreateSwapResult = {
      swap: {
        ...baseSwap,
        context: {
          publicContext: {
            to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
            data: '0x4630a0d8000000000000000000000000'
            // value is missing
          }
        }
      },
      actionType: 'ERC20-PAYMENT'
    }

    await expect(client.generateAction(createdSwap)).rejects.toThrow(
      'LI.FI swap context missing required publicContext fields (to, data, value)'
    )
  })
})
