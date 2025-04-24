import { describe, test, beforeAll, expect } from '@jest/globals'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { RskSwapSDK, type SwapEstimationArgs } from '@rsksmart/rsk-swap-sdk'
import { readFile } from 'fs/promises'
import { EXTENDED_TIMEOUT } from './common/constants'

describe('RSK Swap SDK estimate should', () => {
  let sdk: RskSwapSDK

  beforeAll(async () => {
    const buffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(buffer.toString())
    const conn = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password)
    sdk = new RskSwapSDK('Local', conn)
  }, EXTENDED_TIMEOUT)

  test('get BTC to RBTC estimation', async () => {
    const args: SwapEstimationArgs = {
      fromAmount: BigInt('100000'),
      fromToken: 'BTC',
      toToken: 'RBTC',
      fromChainId: 'BTC',
      toChainId: '30'
    }
    const estimations = await sdk.estimateSwap(args)
    expect(estimations).toBeDefined()
    expect(estimations.length).not.toBe(0)
    const estimation = estimations.at(0)
    expect(estimation?.fees).toBeDefined()
    expect(estimation?.fees.length).not.toBe(0)
    expect(estimation?.fromNetwork).toBeDefined()
    expect(estimation?.fromToken).toBeDefined()
    expect(estimation?.providerId).toBeDefined()
    expect(estimation?.toNetwork).toBeDefined()
    expect(estimation?.toToken).toBeDefined()
    expect(estimation?.requiredConfirmations).toBeDefined()
    expect(estimation?.total).toBeDefined()
  }, EXTENDED_TIMEOUT)

  test('get USDT to RBTC estimation', async () => {
    const args: SwapEstimationArgs = {
      fromAmount: BigInt('60000000'),
      fromToken: 'USDT',
      toToken: 'RBTC',
      fromChainId: '1',
      toChainId: '30'
    }
    const estimations = await sdk.estimateSwap(args)
    expect(estimations).toBeDefined()
    expect(estimations.length).not.toBe(0)
    const estimation = estimations.at(0)
    expect(estimation?.fees).toBeDefined()
    expect(estimation?.fees.length).not.toBe(0)
    expect(estimation?.fromNetwork).toBeDefined()
    expect(estimation?.fromToken).toBeDefined()
    expect(estimation?.providerId).toBeDefined()
    expect(estimation?.toNetwork).toBeDefined()
    expect(estimation?.toToken).toBeDefined()
    expect(estimation?.requiredConfirmations).toBeDefined()
    expect(estimation?.total).toBeDefined()
  }, EXTENDED_TIMEOUT)

  test('get ETH to RBTC estimation', async () => {
    const args: SwapEstimationArgs = {
      fromAmount: BigInt('250000000000000000'),
      fromToken: 'ETH',
      toToken: 'RBTC',
      fromChainId: '1',
      toChainId: '30'
    }
    const estimations = await sdk.estimateSwap(args)
    expect(estimations).toBeDefined()
    expect(estimations.length).not.toBe(0)
    const estimation = estimations.at(0)
    expect(estimation?.fees).toBeDefined()
    expect(estimation?.fees.length).not.toBe(0)
    expect(estimation?.fromNetwork).toBeDefined()
    expect(estimation?.fromToken).toBeDefined()
    expect(estimation?.providerId).toBeDefined()
    expect(estimation?.toNetwork).toBeDefined()
    expect(estimation?.toToken).toBeDefined()
    expect(estimation?.requiredConfirmations).toBeDefined()
    expect(estimation?.total).toBeDefined()
  }, EXTENDED_TIMEOUT)

  test('get WBTC to RBTC estimation', async () => {
    const args: SwapEstimationArgs = {
      fromAmount: BigInt('500000'),
      fromToken: 'WBTC',
      toToken: 'RBTC',
      fromChainId: '1',
      toChainId: '30'
    }
    const estimations = await sdk.estimateSwap(args)
    expect(estimations).toBeDefined()
    expect(estimations.length).not.toBe(0)
    const estimation = estimations.at(0)
    expect(estimation?.fees).toBeDefined()
    expect(estimation?.fees.length).not.toBe(0)
    expect(estimation?.fromNetwork).toBeDefined()
    expect(estimation?.fromToken).toBeDefined()
    expect(estimation?.providerId).toBeDefined()
    expect(estimation?.toNetwork).toBeDefined()
    expect(estimation?.toToken).toBeDefined()
    expect(estimation?.requiredConfirmations).toBeDefined()
    expect(estimation?.total).toBeDefined()
  }, EXTENDED_TIMEOUT)

  test('get BNB to RBTC estimation', async () => {
    const args: SwapEstimationArgs = {
      fromAmount: BigInt('1200000000000000000'),
      fromToken: 'BNB',
      toToken: 'RBTC',
      fromChainId: '56',
      toChainId: '30'
    }
    const estimations = await sdk.estimateSwap(args)
    expect(estimations).toBeDefined()
    expect(estimations.length).not.toBe(0)
    const estimation = estimations.at(0)
    expect(estimation?.fees).toBeDefined()
    expect(estimation?.fees.length).not.toBe(0)
    expect(estimation?.fromNetwork).toBeDefined()
    expect(estimation?.fromToken).toBeDefined()
    expect(estimation?.providerId).toBeDefined()
    expect(estimation?.toNetwork).toBeDefined()
    expect(estimation?.toToken).toBeDefined()
    expect(estimation?.requiredConfirmations).toBeDefined()
    expect(estimation?.total).toBeDefined()
  }, EXTENDED_TIMEOUT)
})
