import { describe, test, beforeAll, expect } from '@jest/globals'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { RskSwapSDK } from '@rsksmart/rsk-swap-sdk'
import { readFile } from 'fs/promises'
import { EXTENDED_TIMEOUT } from './common/constants'

describe('RSK Swap SDK get tokens should', () => {
  let sdk: RskSwapSDK

  beforeAll(async () => {
    const buffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(buffer.toString())
    const conn = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password)
    sdk = new RskSwapSDK('Local', conn)
  }, EXTENDED_TIMEOUT)

  test('fetch token information', async () => {
    const tokens = await sdk.listTokens()
    expect(tokens.length).not.toBe(0)
    for (const token of tokens) {
      expect(token.decimals).toBeDefined()
      expect(token.symbol).toBeDefined()
      expect(token.type).toBeDefined()
      expect(token.addresses).toBeDefined()
      if (token.type === 'erc20') {
        expect(Object.entries(token.addresses).length).not.toBe(0)
      }
    }
  })
})
