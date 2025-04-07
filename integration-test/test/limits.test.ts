import { describe, test, beforeAll, expect } from '@jest/globals'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { RskSwapSDK, type SwapLimitsArgs } from '@rsksmart/rsk-swap-sdk'
import { readFile } from 'fs/promises'
import { EXTENDED_TIMEOUT } from './common/constants'

describe('RSK Swap SDK get limits should', () => {
  let sdk: RskSwapSDK

  beforeAll(async () => {
    const buffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(buffer.toString())
    const conn = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password)
    sdk = new RskSwapSDK('Local', conn)
  }, EXTENDED_TIMEOUT)

  test('fetch USDT -> RBTC limits from API', async () => {
    const args: SwapLimitsArgs = {
      fromToken: 'USDT',
      toToken: 'RBTC',
      fromChainId: '1',
      toChainId: '30'
    }
    const limits = await sdk.getSwapLimits(args)
    expect(limits.maxAmount).toBeDefined()
    expect(limits.maxAmount).toBeDefined()
    expect(typeof limits.maxAmount).toBe('number')
    expect(typeof limits.minAmount).toBe('number')
  })

  test('fetch ETH -> RBTC limits from API', async () => {
    const args: SwapLimitsArgs = {
      fromToken: 'ETH',
      toToken: 'RBTC',
      fromChainId: '1',
      toChainId: '30'
    }
    const limits = await sdk.getSwapLimits(args)
    expect(limits.maxAmount).toBeDefined()
    expect(limits.maxAmount).toBeDefined()
    expect(typeof limits.maxAmount).toBe('bigint')
    expect(typeof limits.minAmount).toBe('bigint')
  })

  test('fetch BTC -> RBTC limits from API', async () => {
    const args: SwapLimitsArgs = {
      fromToken: 'BTC',
      toToken: 'RBTC',
      fromChainId: 'BTC',
      toChainId: '30'
    }
    const limits = await sdk.getSwapLimits(args)
    expect(limits.maxAmount).toBeDefined()
    expect(limits.maxAmount).toBeDefined()
    expect(typeof limits.maxAmount).toBe('number')
    expect(typeof limits.minAmount).toBe('number')
  })

  test('fetch WBTC -> RBTC limits from API', async () => {
    const args: SwapLimitsArgs = {
      fromToken: 'WBTC',
      toToken: 'RBTC',
      fromChainId: '1',
      toChainId: '30'
    }
    const limits = await sdk.getSwapLimits(args)
    expect(limits.maxAmount).toBeDefined()
    expect(limits.maxAmount).toBeDefined()
    expect(typeof limits.maxAmount).toBe('number')
    expect(typeof limits.minAmount).toBe('number')
  })

  test('fetch BNB -> RBTC limits from API', async () => {
    const args: SwapLimitsArgs = {
      fromToken: 'BNB',
      toToken: 'RBTC',
      fromChainId: '56',
      toChainId: '30'
    }
    const limits = await sdk.getSwapLimits(args)
    expect(limits.maxAmount).toBeDefined()
    expect(limits.maxAmount).toBeDefined()
    expect(typeof limits.maxAmount).toBe('bigint')
    expect(typeof limits.minAmount).toBe('bigint')
  })
})
