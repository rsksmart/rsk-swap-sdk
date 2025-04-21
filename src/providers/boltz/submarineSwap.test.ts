import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { type CreatedSwap, type Swap } from '../../api'
import { SubmarineSwap } from './submarineSwap'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('SubmarineSwap class', () => {
  let swap: Swap
  let connection: BlockchainConnection
  let createdSwap: CreatedSwap

  beforeEach(() => {
    const bytecode = readFileSync(join(__dirname, '/ether-swap-test-bytecode.txt'), 'utf-8')
    const connectionMock: unknown = jest.mocked({
      provider: {
        getCode: jest.fn<() => Promise<string>>().mockResolvedValue(bytecode.trim())
      }
    })
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    connection = {
      getAbstraction: () => connectionMock
    } as jest.Mocked<BlockchainConnection>
    swap = {
      refundAddress: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
      providerSwapId: '4xQDM7PrnuKn',
      context: {
        publicContext: {
          claimAddress: '0x42F92ecF2d3Fa43239dE7FAB235679A5C74F8dCD',
          timeoutBlockHeight: 6074768,
          expectedAmount: 10448
        },
        secretContext: {}
      },
      fromAmount: BigInt(10500),
      fromNetwork: '31',
      fromToken: 'tRBTC',
      paymentAddress: '0x42F92ecF2d3Fa43239dE7FAB235679A5C74F8dCD',
      providerId: 'BOLTZ',
      receiverAddress: 'LNTB105180N1PN7UCYZPP59WQSX9FS88EUGEKH0DMH8CNGCR52N57P5P2S2U25E8375DT4S4PQSP5NNRT5G2XEGFCVSVT4KVA2RNCR5TDF09FM7UVKGP7U7NCLVFTDCMSDQQCQZYNXQYZ5VQ9QLZQQQQQQQQQQQQQQQQQQQQQQQQQQ9QSQFPPQFNDRC2A88ZTT42AJF6ARAMF2YMXRXT7NRZJQ2GYP9ZA7VC7VD8M59FVU63PU00U4PAK35N4UPUV4MHYW5L586DVHFYEDAJHSD883VQQQQQPQQQQQZSQQCTAUQMGUP66CA6E0VWPPWTFHRXU58ENKETMSNDK87C59ZPES8YGTQ9DX2AGTHAYMD2MLWGLXVLLGPHUW777GZ4RZWDUQ5Z9P00DVG9CGQ46S7ND',
      requiredConfirmations: 0,
      status: 'CREATED',
      toNetwork: 'LN',
      toToken: 'tBTC',
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
    createdSwap = {
      swap,
      actionType: 'CONTRACT-INTERACTION'
    }
  })

  describe('generateAction method should', () => {
    test('generate a valid action', async () => {
      const submarineSwap = new SubmarineSwap('Testnet', connection)
      const result = await submarineSwap.generateAction(createdSwap)
      expect(result).toEqual({
        type: 'CONTRACT-INTERACTION',
        data: {
          to: swap.paymentAddress,
          data: '0x0899146b2b8103153039f3c466d77b7773e268c0e8a9d3c1a055057154c9e3ea3575854200000000000000000000000042f92ecf2d3fa43239de7fab235679a5c74f8dcd00000000000000000000000000000000000000000000000000000000005cb190',
          value: '0x5f0625494000'
        },
        requiresClaim: false
      })
    })
  })
  describe('validateAddress method should', () => {
    test('return true on valid contract', async () => {
      const submarineSwap = new SubmarineSwap('Testnet', connection)
      const result = await submarineSwap.validateAddress(swap)
      expect(result).toBe(true)
    })
    test('return false on invalid contract', async () => {
      const connectionMock = {
        getAbstraction: () => ({
          provider: {
            getCode: jest.fn<() => Promise<string>>().mockResolvedValue('0x1234')
          }
        })
      } as unknown as BlockchainConnection
      const submarineSwap = new SubmarineSwap('Testnet', connectionMock)
      const result = await submarineSwap.validateAddress(swap)
      expect(result).toBe(false)
    })
  })
  describe('createContext method should', () => {
    test('create an empty context', () => {
      const submarineSwap = new SubmarineSwap('Mainnet', connection)
      const context = submarineSwap.createContext()
      expect(context).toEqual({
        publicContext: {},
        secretContext: {}
      })
    })
  })
})
