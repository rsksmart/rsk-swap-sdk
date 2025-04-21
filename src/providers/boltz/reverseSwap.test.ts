import { describe, expect, test, beforeEach } from '@jest/globals'
import { ethers } from '@rsksmart/bridges-core-sdk'
import { type Swap } from '../../api'
import { type BoltzReverseSwapContext } from './types'
import { ReverseSwap } from './reverseSwap'

const reverseSwap: Swap =
    {
      refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      providerSwapId: '4xQDM7PrnuKn',
      context: {
        publicContext: {
          preimageHash: 'f60b8d6dc72cf7215205349b8333a4a0c779514dae997d09206f24effb6763bc',
          timeoutBlockHeight: 6074768,
          onchainAmount: 10448,
          lockupAddress: '0x42F92ecF2d3Fa43239dE7FAB235679A5C74F8dCD',
          refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db'
        },
        secretContext: {
          preimage: '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244'
        }
      },
      fromAmount: BigInt(10500),
      fromNetwork: 'LN',
      fromToken: 'tBTC',
      paymentAddress: 'lntb105u1pn67hgdsp5hj33g4pq0cvxkadnzu3u46m4vk8cj8lzfz9v8n94trx4kcx84xqqpp57c9c6mw89nmjz5s9xjdcxvay5rrhj52d46vh6zfqdujwl7m8vw7qdpq2djkuepqw3hjq5jz23pjqctyv3ex2umnxqyp2xqcqz959qyysgqmgjtxqcmhpjy3kgw90k2fh6lyv3ts5nsgxhwuk4e7tfeejjx42kkkm2922ruge7dyzma2m42ry2hp0528hw0ufu3a8p4ks26ww4kjscpfklv67',
      providerId: 'BOLTZ',
      receiverAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
      requiredConfirmations: 0,
      status: 'CREATED',
      toNetwork: '31',
      toToken: 'tRBTC',
      usedFees: [
        {
          type: 'PERCENTAGE',
          description: 'Boltz fee',
          amount: 0.25
        },
        {
          type: 'FIXED',
          description: 'Miner fee',
          amount: 38
        }
      ]
    }

describe('ReverseSwap class should', () => {
  let client: ReverseSwap

  beforeEach(() => {
    client = new ReverseSwap()
  })

  test('generate the correct context for a reverse swap', () => {
    const context = client.createContext() as BoltzReverseSwapContext
    expect(context.publicContext.preimageHash).toMatch(/^[a-fA-F0-9]{64}$/)
    expect(context.secretContext.preimage).toMatch(/^[a-fA-F0-9]{64}$/)
    expect('0x' + context.publicContext.preimageHash).toEqual(ethers.utils.sha256('0x' + context.secretContext.preimage))
  })
  describe('validate the LN invoice in a reverse swap', () => {
    test('throw an error on an invalid invoice', async () => {
      const incompleteInvoice = 'lntb105u1pn67hgdsp5hj33g4pq0cvxkadnzu3u46m4vk8cj8lzfz9v8n94trx4kcx84xqqdpq2djkuepqw3hjq5jz23pjqctyv3ex2umnxqyp2xqcqz959qyysgqmgjtxqcmhpjy3kgw90k2fh6lyv3ts5nsgxhwuk4e7tfeejjx42kkkm2922ruge7dyzma2m42ry2hp0528hw0ufu3a8p4ks26ww4kjscpfklv67'
      const swap = structuredClone(reverseSwap)
      swap.paymentAddress = incompleteInvoice
      await expect(async () => client.validateAddress(swap)).rejects.toThrow('Invalid checksum for ' + incompleteInvoice)
    })
    test('return false on invalid invoice', async () => {
      const swap = structuredClone(reverseSwap);
      (swap.context as BoltzReverseSwapContext).publicContext.preimageHash = 'c2f7f40f5b6a90142ff07afd84660239ebb7fb2f71902842f2c5b0c2426c1e2c'
      await expect(client.validateAddress(swap)).resolves.toBe(false)
    })
    test('return true on valid invoice', async () => {
      await expect(client.validateAddress(reverseSwap)).resolves.toBe(true)
    })
    test('fail on incomplete context', async () => {
      const swap: Swap = structuredClone(reverseSwap);
      (swap.context as BoltzReverseSwapContext).publicContext.preimageHash = ''
      await expect(async () => client.validateAddress(swap)).rejects.toThrow('Missing preimage hash in swap context')
    })
  })
  test('generate BOLT11 action for a reverse swap', async () => {
    await expect(client.generateAction({
      swap: reverseSwap,
      actionType: 'BOLT11'
    })).resolves.toEqual({
      type: 'BOLT11',
      data: 'LNTB105U1PN67HGDSP5HJ33G4PQ0CVXKADNZU3U46M4VK8CJ8LZFZ9V8N94TRX4KCX84XQQPP57C9C6MW89NMJZ5S9XJDCXVAY5RRHJ52D46VH6ZFQDUJWL7M8VW7QDPQ2DJKUEPQW3HJQ5JZ23PJQCTYV3EX2UMNXQYP2XQCQZ959QYYSGQMGJTXQCMHPJY3KGW90K2FH6LYV3TS5NSGXHWUK4E7TFEEJJX42KKKM2922RUGE7DYZMA2M42RY2HP0528HW0UFU3A8P4KS26WW4KJSCPFKLV67',
      requiresClaim: true
    })
  })
  test('build claim details properly', () => {
    const claimDetails = client.getClaimDetails(reverseSwap)
    expect(claimDetails.lockupAddress).toEqual('0x42F92ecF2d3Fa43239dE7FAB235679A5C74F8dCD')
    expect(claimDetails.refundAddress).toEqual('0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db')
    expect(claimDetails.onchainAmount).toEqual(10448)
    expect(claimDetails.timeoutBlockHeight).toEqual(6074768)
    expect(claimDetails.preimage).toEqual('937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244')
  })
})
