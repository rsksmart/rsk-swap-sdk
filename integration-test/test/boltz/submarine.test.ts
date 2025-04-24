import { describe, test, beforeAll, expect } from '@jest/globals'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { RskSwapSDK, type SwapEstimation, type SwapLimits, type SwapWithAction } from '@rsksmart/rsk-swap-sdk'
import { EXTENDED_TIMEOUT } from '../common/constants'
import { readFile } from 'fs/promises'
import * as readline from 'node:readline'

describe('RskSwapSDK Boltz integration submarine swap should', () => {
  const providerId = 'BOLTZ'
  let sdk: RskSwapSDK
  let conn: BlockchainConnection

  let limits: SwapLimits
  let amount: bigint
  let boltzOffer: SwapEstimation
  let createdSwap: SwapWithAction

  beforeAll(async () => {
    console.log('sdk ready')
    const buffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(buffer.toString())
    conn = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password)
    sdk = new RskSwapSDK('Local', conn)
  })

    test('fetch swap limits', async () => {
      limits = await sdk.getSwapLimits({
        fromChainId: '31',
        toChainId: 'LN',
        fromToken: 'tRBTC',
        toToken: 'tBTC'
      })

      expect(limits.maxAmount).toBeDefined()
      expect(limits.minAmount).toBeDefined()
    })

    test('get swap estimations', async () => {
      amount = BigInt(limits.minAmount) + BigInt(500)
      const estimations = await sdk.estimateSwap({
        fromChainId: '31',
        toChainId: 'LN',
        fromToken: 'tRBTC',
        toToken: 'tBTC',
        fromAmount: amount
      })
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boltzOffer = estimations.find(offer => offer.providerId === providerId)!
      expect(estimations.length).toBeGreaterThan(0)
      expect(boltzOffer).toBeDefined()
    })

    test('create the swap', async () => {
      const rl = readline.promises.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      const invoice = await rl.question(`Enter invoice for ${amount} sats:`).then(result => result.trim());
      console.log(`Invoice: ${invoice}`)
      const result = await sdk.createNewSwap({
        fromNetwork: boltzOffer.fromNetwork,
        toNetwork: boltzOffer.toNetwork,
        fromToken: boltzOffer.fromToken,
        toToken: boltzOffer.toToken,
        fromAmount: amount,
        providerId,
        address: invoice,
        refundAddress: invoice
      })
      createdSwap = result
      expect(result).toBeDefined()
      expect(result.action).toBeDefined()
      expect(result.action.data).toBeDefined()
      expect(result.action.requiresClaim).toBe(true)
      expect(result.action.type).toBe('CONTRACT-INTERACTION')
      expect(result.swap).toBeDefined()
      expect(result.swap.providerId).toBe(providerId)
      expect(result.swap.providerSwapId).toBeDefined()
      expect(BigInt(result.swap.fromAmount)).toBe(amount)
      expect(result.swap.fromNetwork).toBe(boltzOffer.fromNetwork)
      expect(result.swap.toNetwork).toBe(boltzOffer.toNetwork)
      expect(result.swap.fromToken).toBe(boltzOffer.fromToken)
      expect(result.swap.toToken).toBe(boltzOffer.toToken)
      expect(result.swap.receiverAddress).toBe(invoice)
      expect(result.swap.paymentAddress).toBeDefined()
      expect(result.swap.status).toBe('CREATED')
      expect(result.swap.requiredConfirmations).toBe(1)
      expect(result.swap.usedFees).toBeDefined()
      expect(result.swap.usedFees).toHaveLength(2)
      const context: any = result.swap.context
      expect(context.publicContext).toBeDefined()
      expect(context.publicContext.claimAddress).toBeDefined()
      expect(context.publicContext.expectedAmount).toBeDefined()
      expect(context.publicContext.timeoutBlockHeight).toBeDefined()
      expect(context.secretContext).toEqual({})
    }, EXTENDED_TIMEOUT)

    test('execute and claim the swap', async () => {
      const lockTxHash = await sdk.executeSwap(createdSwap.action)
      const receipt = await conn.getTransactionReceipt(lockTxHash)
      expect(receipt?.status).toBe(1)
    }, EXTENDED_TIMEOUT)
})
