import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type BlockchainConnection, ethers } from '@rsksmart/bridges-core-sdk'
import { type Swap } from '../api'
import { BoltzClient, type BoltzProviderContext } from './boltz'
import { readFileSync } from 'fs'
import { join } from 'path'

const reverseSwap: Swap =
    {
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

describe('BoltzClient should', () => {
  let client: BoltzClient
  let conn: jest.Mocked<BlockchainConnection>

  beforeEach(() => {
    const bytecode = readFileSync(join(__dirname, '/ether-swap-test-bytecode.txt'), 'utf-8')
    const connectionMock: unknown = jest.mocked({
      signer: {
        provider: {
          getCode: jest.fn<() => Promise<string>>().mockResolvedValue(bytecode.trim())
        }
      }
    })
    conn = connectionMock as jest.Mocked<BlockchainConnection>
    client = new BoltzClient('Testnet', conn)
  })

  test('generate the correct context for a reverse swap', () => {
    const context = client.createContext({
      providerId: 'BOLTZ',
      fromToken: 'tBTC',
      toToken: 'tRBTC',
      fromNetwork: 'BTC',
      toNetwork: '31',
      fromAmount: BigInt(100000000),
      refundAddress: 'refundAddress',
      address: 'address'
    }) as BoltzProviderContext
    expect(context.publicContext.preimageHash).toMatch(/^[a-fA-F0-9]{64}$/)
    expect(context.secretContext.preimage).toMatch(/^[a-fA-F0-9]{64}$/)
    expect('0x' + context.publicContext.preimageHash).toEqual(ethers.utils.sha256('0x' + context.secretContext.preimage))
  })
  describe('validate the LN invoice in a reverse swap', () => {
    test('throw an error on an invalid invoice', () => {
      const incompleteInvoice = 'lntb105u1pn67hgdsp5hj33g4pq0cvxkadnzu3u46m4vk8cj8lzfz9v8n94trx4kcx84xqqdpq2djkuepqw3hjq5jz23pjqctyv3ex2umnxqyp2xqcqz959qyysgqmgjtxqcmhpjy3kgw90k2fh6lyv3ts5nsgxhwuk4e7tfeejjx42kkkm2922ruge7dyzma2m42ry2hp0528hw0ufu3a8p4ks26ww4kjscpfklv67'
      const swap = structuredClone(reverseSwap)
      swap.paymentAddress = incompleteInvoice
      expect(() => client.validateAddress(swap)).toThrow('Invalid checksum for ' + incompleteInvoice)
    })
    test('return false on invalid invoice', () => {
      const swap = structuredClone(reverseSwap);
      (swap.context as BoltzProviderContext).publicContext.preimageHash = 'c2f7f40f5b6a90142ff07afd84660239ebb7fb2f71902842f2c5b0c2426c1e2c'
      expect(client.validateAddress(swap)).toBe(false)
    })
    test('return true on valid invoice', () => {
      expect(client.validateAddress(reverseSwap)).toBe(true)
    })
    test('fail on incomplete context', () => {
      const swap: Swap = structuredClone(reverseSwap);
      (swap.context as BoltzProviderContext).publicContext.preimageHash = ''
      expect(() => client.validateAddress(swap)).toThrow('Missing preimage hash in swap context')
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
  describe('build a correct claim transaction', () => {
    test('fail on incomplete context', async () => {
      const swap: Swap = structuredClone(reverseSwap)
      swap.context = {}
      await expect(async () => client.buildClaimTransaction(swap)).rejects.toThrow('Validation failed for object with following missing properties: publicContext, secretContext')
    })
    test('fail on contract code mismatch', async () => {
      client = new BoltzClient('Mainnet', conn)
      await expect(client.buildClaimTransaction(reverseSwap)).rejects.toThrow('Unexpected contract content')
    })
    test('build claim correctly', async () => {
      const result = await client.buildClaimTransaction(reverseSwap)
      expect(conn.signer.provider?.getCode).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        to: '0x42f92ecf2d3fa43239de7fab235679a5c74f8dcd',
        data: '0xcd413efa937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae224400000000000000000000000000000000000000000000000000005f062549400000000000000000000000000079568c2989232dca1840087d73d403602364c0d40000000000000000000000004217bd283e9dc9a2ce3d5d20fae34aa0902c28db00000000000000000000000000000000000000000000000000000000005cb190',
        value: '0x0'
      })
    })
  })
})
