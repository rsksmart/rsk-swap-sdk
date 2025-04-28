import { describe, test, beforeAll, expect } from '@jest/globals'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { RskSwapSDK, type SwapEstimation, type SwapLimits, type SwapWithAction } from '@rsksmart/rsk-swap-sdk'
import { EXTENDED_TIMEOUT, sleepSeconds } from '../common/constants'
import { readFile } from 'fs/promises'

describe('RskSwapSDK Boltz integration reverse swap should', () => {
  const providerId = 'BOLTZ'
  const destination = '0x79568c2989232dCa1840087D73d403602364c0D4'
  const LN_INVOICE_REGEX: RegExp = /^LN(BC|TB|SB)[0-9]{1,}[A-Z0-9]+$/
  let sdk: RskSwapSDK
  let conn: BlockchainConnection

  let limits: SwapLimits
  let amount: bigint
  let boltzOffer: SwapEstimation
  let createdSwap: SwapWithAction

  beforeAll(async () => {
    const buffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(buffer.toString())
    conn = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password)
    sdk = new RskSwapSDK('Local', conn)
  })

    test('fetch swap limits', async () => {
      limits = await sdk.getSwapLimits({
        fromChainId: 'LN',
        toChainId: '31',
        fromToken: 'tBTC',
        toToken: 'tRBTC'
      })

      expect(limits.maxAmount).toBeDefined()
      expect(limits.minAmount).toBeDefined()
    })

    test('get swap estimations', async () => {
      amount = BigInt(limits.minAmount) + BigInt(500)
      const estimations = await sdk.estimateSwap({
        fromChainId: 'LN',
        toChainId: '31',
        fromToken: 'tBTC',
        toToken: 'tRBTC',
        fromAmount: amount
      })
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      boltzOffer = estimations.find(offer => offer.providerId === providerId)!
      expect(estimations.length).toBeGreaterThan(0)
      expect(boltzOffer).toBeDefined()
    })

    test('create the swap', async () => {
      const result = await sdk.createNewSwap({
        fromNetwork: boltzOffer.fromNetwork,
        toNetwork: boltzOffer.toNetwork,
        fromToken: boltzOffer.fromToken,
        toToken: boltzOffer.toToken,
        fromAmount: amount,
        providerId,
        address: destination,
        refundAddress: destination
      })
      createdSwap = result
      expect(result).toBeDefined()
      expect(result.action).toBeDefined()
      expect(result.action.data).toBeDefined()
      expect(result.action.requiresClaim).toBe(true)
      expect(result.action.type).toBe('BOLT11')
      expect(result.swap).toBeDefined()
      expect(result.swap.providerId).toBe(providerId)
      expect(result.swap.providerSwapId).toBeDefined()
      expect(BigInt(result.swap.fromAmount)).toBe(amount)
      expect(result.swap.fromNetwork).toBe(boltzOffer.fromNetwork)
      expect(result.swap.toNetwork).toBe(boltzOffer.toNetwork)
      expect(result.swap.fromToken).toBe(boltzOffer.fromToken)
      expect(result.swap.toToken).toBe(boltzOffer.toToken)
      expect(result.swap.receiverAddress).toBe(destination)
      expect(result.swap.paymentAddress).toBeDefined()
      expect(result.swap.status).toBe('CREATED')
      expect(result.swap.requiredConfirmations).toBe(0)
      expect(result.swap.usedFees).toBeDefined()
      expect(result.swap.usedFees).toHaveLength(2)
      const context: any = result.swap.context
      expect(context.publicContext).toBeDefined()
      expect(context.publicContext.preimageHash).toBeDefined()
      expect(context.publicContext.timeoutBlockHeight).toBeDefined()
      expect(context.publicContext.onchainAmount).toBeDefined()
      expect(context.publicContext.lockupAddress).toBeDefined()
      expect(context.publicContext.refundAddress).toBeDefined()
      expect(context.secretContext).toBeDefined()
      expect(context.secretContext.preimage).toBeDefined()
    })

    test('execute and claim the swap', async () => {
      const invoice = await sdk.executeSwap(createdSwap.action)
      expect(invoice).toMatch(LN_INVOICE_REGEX)
      console.info('============================ Pay to this LN invoice ============================')
      console.info(invoice)
      console.info('================================================================================')
      await sleepSeconds(20)

      let tx = ''
      do {
        try {
          tx = await sdk.claimSwap(createdSwap)
        } catch (e) {
          console.error(JSON.stringify(e))
        }
        await sleepSeconds(40)
      } while (tx === '')
      const receipt = await conn.getTransactionReceipt(tx)
      expect(receipt?.status).toBe(1)
    }, EXTENDED_TIMEOUT)

})
