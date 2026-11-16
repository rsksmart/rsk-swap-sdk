import { describe, expect, test } from '@jest/globals'
import { RSK_SWAP_ERROR_CODES } from '../error/codes'
import { TOKEN_REGISTRY, type PinnedToken } from '../constants/tokens'
import { validateEvmSwapTransaction as validateWithToken } from './evmTransaction'

describe('validateEvmSwapTransaction should', () => {
  const lifiRouter = '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE'
  const symbiosisRskRouter = '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421'
  const unknownAddress = '0x79568c2989232dCa1840087D73d403602364c0D4'

  const baseSwap: any = {
    providerSwapId: 'swap-1',
    providerId: 'LIFI',
    refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
    receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
    paymentAddress: lifiRouter,
    fromAmount: BigInt('1000000000000000000'),
    fromToken: 'RBTC',
    toToken: 'ETH',
    fromNetwork: '30',
    toNetwork: '1',
    status: 'CREATED',
    requiredConfirmations: 1,
    usedFees: [],
    context: {}
  }

  const validateEvmSwapTransaction = (providerId: string, swap: any, tx: Parameters<typeof validateWithToken>[3]): string =>
    validateWithToken(providerId, swap, TOKEN_REGISTRY[swap.fromNetwork]?.[swap.fromToken] as PinnedToken, tx)

  const expectCode = (fn: () => unknown, code: string): void => {
    expect(fn).toThrow(expect.objectContaining({ code }) as unknown as Error)
  }

  test('return the spender of a known router', () => {
    expect(validateEvmSwapTransaction('LIFI', baseSwap, { to: lifiRouter.toLowerCase(), value: '0xde0b6b3a7640000', chainId: 30 })).toBe(lifiRouter)
  })

  test('return the gateway as spender for the Symbiosis metarouter that uses one', () => {
    const swap = { ...baseSwap, providerId: 'SYMBIOSIS', fromToken: 'RIF' }
    expect(validateEvmSwapTransaction('SYMBIOSIS', swap, { to: '0x7057ab3fb2bee9c18e0cde4240de4ff7f159e365', value: '0x0', chainId: 30 }))
      .toBe('0xfffdb2a69abcbbf55ecb2f6b348e0bd3d0f9f2e1')
    expect(validateEvmSwapTransaction('SYMBIOSIS', swap, { to: symbiosisRskRouter, value: '0x0', chainId: 30 })).toBe(symbiosisRskRouter)
    const ethSwap = { ...swap, fromNetwork: '1', fromToken: 'USDC', toNetwork: '30' }
    expect(validateEvmSwapTransaction('SYMBIOSIS', ethSwap, { to: '0xf621fb08bbe51af70e7e0f4ea63496894166ff7f', value: '0x0', chainId: 1 }))
      .toBe('0xfCEF2Fe72413b65d3F393d278A714caD87512bcd')
    expect(validateEvmSwapTransaction('SYMBIOSIS', ethSwap, { to: '0xB4769e9c5bE31199a25ecD1B0C6609183fa72521', value: '0x0', chainId: 1 }))
      .toBe('0xB4769e9c5bE31199a25ecD1B0C6609183fa72521')
  })

  test('reject a target that is not a router of the provider on the origin chain', () => {
    expectCode(() => validateEvmSwapTransaction('LIFI', baseSwap, { to: unknownAddress, value: '0x0', chainId: 30 }), RSK_SWAP_ERROR_CODES.UNTRUSTED_ADDRESS.code)
    expectCode(() => validateEvmSwapTransaction('SYMBIOSIS', baseSwap, { to: lifiRouter, value: '0x0', chainId: 30 }), RSK_SWAP_ERROR_CODES.UNTRUSTED_ADDRESS.code)
    expectCode(() => validateEvmSwapTransaction('SYMBIOSIS', { ...baseSwap, fromNetwork: '56' }, { to: symbiosisRskRouter, value: '0x0', chainId: 56 }), RSK_SWAP_ERROR_CODES.UNTRUSTED_ADDRESS.code)
    expectCode(() => validateEvmSwapTransaction('LIFI', { ...baseSwap, fromNetwork: '31' }, { to: lifiRouter, value: '0x0', chainId: 31 }), RSK_SWAP_ERROR_CODES.UNTRUSTED_ADDRESS.code)
  })

  test('reject a transaction for a chain other than the origin network', () => {
    expectCode(() => validateEvmSwapTransaction('LIFI', baseSwap, { to: lifiRouter, value: '0x0', chainId: 1 }), RSK_SWAP_ERROR_CODES.MANIPULATED_API_RESPONSE.code)
    expectCode(() => validateEvmSwapTransaction('LIFI', baseSwap, { to: lifiRouter, value: '0x0' }), RSK_SWAP_ERROR_CODES.MANIPULATED_API_RESPONSE.code)
  })

  test('accept a native payment of fromAmount plus the fee allowance', () => {
    expect(validateEvmSwapTransaction('LIFI', baseSwap, { to: lifiRouter, value: '1001000000000000000', chainId: '30' })).toBe(lifiRouter)
  })

  test('reject a native payment above fromAmount plus the fee allowance', () => {
    expectCode(() => validateEvmSwapTransaction('LIFI', baseSwap, { to: lifiRouter, value: '1001000000000000001', chainId: 30 }), RSK_SWAP_ERROR_CODES.MANIPULATED_API_RESPONSE.code)
  })

  test('cap the value of a token payment at the fee allowance alone', () => {
    const tokenSwap = { ...baseSwap, fromToken: 'RIF' }
    expect(validateEvmSwapTransaction('LIFI', tokenSwap, { to: lifiRouter, value: '1000000000000000', chainId: 30 })).toBe(lifiRouter)
    expect(validateEvmSwapTransaction('LIFI', tokenSwap, { to: lifiRouter, value: '', chainId: 30 })).toBe(lifiRouter)
    expectCode(() => validateEvmSwapTransaction('LIFI', tokenSwap, { to: lifiRouter, value: '1000000000000001', chainId: 30 }), RSK_SWAP_ERROR_CODES.MANIPULATED_API_RESPONSE.code)
  })

  test('use the fee allowance of the origin chain', () => {
    const ethSwap = { ...baseSwap, fromNetwork: '1', fromToken: 'USDC', fromAmount: BigInt(100000000) }
    expect(validateEvmSwapTransaction('LIFI', ethSwap, { to: lifiRouter, value: '20000000000000000', chainId: 1 })).toBe(lifiRouter)
    expectCode(() => validateEvmSwapTransaction('LIFI', ethSwap, { to: lifiRouter, value: '20000000000000001', chainId: 1 }), RSK_SWAP_ERROR_CODES.MANIPULATED_API_RESPONSE.code)
  })
})
