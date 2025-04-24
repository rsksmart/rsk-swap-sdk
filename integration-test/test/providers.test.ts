import { RskSwapSDK, type SwapProvider } from '@rsksmart/rsk-swap-sdk'
import { describe, test, beforeAll, expect } from '@jest/globals'
import { readFile } from 'fs/promises'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { EXTENDED_TIMEOUT } from './common/constants'

describe('RSK Swap SDK should', () => {
  let sdk: RskSwapSDK
  beforeAll(async () => {
    const buffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(buffer.toString())
    const conn = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password)
    sdk = new RskSwapSDK('Local', conn)
  }, EXTENDED_TIMEOUT)

  test('fetch all the available providers', async () => {
    const providers: SwapProvider[] = await sdk.getProviders()
    expect(providers).toBeDefined()
    expect(providers.length).not.toBe(0)
    for (const provider of providers) {
      expect(provider).toBeDefined()
      expect(provider.providerId).toBeDefined()
      expect(provider.description).toBeDefined()
      expect(provider.logoUrl).toBeDefined()
      expect(provider.shortName).toBeDefined()
      expect(provider.siteUrl).toBeDefined()
      expect(provider.supportedPairs).toBeDefined()
      expect(provider.supportedPairs.length).not.toBe(0)

      for (const pair of provider.supportedPairs) {
        expect(pair.fromNetwork).toBeDefined()
        expect(pair.fromToken).toBeDefined()
        expect(pair.fromTokenProviderId).toBeDefined()
        expect(pair.toNetwork).toBeDefined()
        expect(pair.toToken).toBeDefined()
        expect(pair.toTokenProviderId).toBeDefined()
      }
    }
  })

  test('fetch a specific provider', async () => {
    const provider: SwapProvider = await sdk.getProvider('CHANGELLY')

    expect(provider).toBeDefined()
    expect(provider.providerId).toBeDefined()
    expect(provider.description).toBeDefined()
    expect(provider.logoUrl).toBeDefined()
    expect(provider.shortName).toBeDefined()
    expect(provider.siteUrl).toBeDefined()
    expect(provider.supportedPairs).toBeDefined()
    expect(provider.supportedPairs.length).not.toBe(0)

    for (const pair of provider.supportedPairs) {
      expect(pair.fromNetwork).toBeDefined()
      expect(pair.fromToken).toBeDefined()
      expect(pair.fromTokenProviderId).toBeDefined()
      expect(pair.toNetwork).toBeDefined()
      expect(pair.toToken).toBeDefined()
      expect(pair.toTokenProviderId).toBeDefined()
    }
  })
})
