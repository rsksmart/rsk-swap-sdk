import { ethers } from '@rsksmart/bridges-core-sdk'
import { ChainSwapOut } from './chainSwapOut'
import * as validation from '../../utils/validation'
import { VALIDATION_CONSTANTS } from '../../constants/validation'
import { type Connection } from '@rsksmart/bridges-core-sdk'
import { type ECPairAPI } from 'ecpair'
import { type Swap, type CreatedSwap } from '../../api'
import { describe, expect, test, beforeEach, jest, beforeAll } from '@jest/globals'
import { type BoltzChainSwapOutContext } from './types'
import { deriveSwapKey, deriveSwapPreimage } from './rescueKey'
import * as bip39 from 'bip39'
import * as ecpair from 'ecpair'
import { initEccLib } from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
import { arrayToHexKey } from '../../utils/conversion'

describe('ChainSwapOut', () => {
  const mockConnection = {} as Connection // eslint-disable-line @typescript-eslint/consistent-type-assertions
  const network = 'Testnet'

  let realKeyFactory: ECPairAPI
  let chainSwapOut: ChainSwapOut

  beforeAll(() => {
    initEccLib(ecc)
    realKeyFactory = ecpair.ECPairFactory(ecc)
  })

  beforeEach(() => {
    jest.clearAllMocks()
    chainSwapOut = new ChainSwapOut(network, mockConnection, realKeyFactory)
  })

  describe('createContext', () => {
    test('should store a 12-word BIP39 rescue mnemonic in secretContext', () => {
      const context = chainSwapOut.createContext() as BoltzChainSwapOutContext
      expect(context.secretContext.rescueMnemonic).toBeDefined()
      expect(context.secretContext.rescueMnemonic.split(' ')).toHaveLength(12)
      expect(bip39.validateMnemonic(context.secretContext.rescueMnemonic)).toBe(true)
    })

    test('should derive claimPublicKey deterministically from the rescue mnemonic', () => {
      const context = chainSwapOut.createContext() as BoltzChainSwapOutContext
      const derivedKey = deriveSwapKey(context.secretContext.rescueMnemonic, realKeyFactory)
      expect(context.publicContext.claimPublicKey).toBe(arrayToHexKey(derivedKey.publicKey))
    })

    test('should derive claimPrivateKey deterministically from the rescue mnemonic', () => {
      const context = chainSwapOut.createContext() as BoltzChainSwapOutContext
      const derivedKey = deriveSwapKey(context.secretContext.rescueMnemonic, realKeyFactory)
      expect(context.secretContext.claimPrivateKey).toBe(arrayToHexKey(derivedKey.privateKey!))
    })

    test('should derive preimage as sha256(privateKey) from the rescue mnemonic', () => {
      const context = chainSwapOut.createContext() as BoltzChainSwapOutContext
      const derivedPreimage = deriveSwapPreimage(context.secretContext.rescueMnemonic, realKeyFactory)
      expect(context.secretContext.preimage).toBe(derivedPreimage.toString('hex'))
    })

    test('should derive preimageHash as sha256(preimage)', () => {
      const context = chainSwapOut.createContext() as BoltzChainSwapOutContext
      const preimageBytes = Buffer.from(context.secretContext.preimage, 'hex')
      const expectedHash = ethers.utils.sha256(preimageBytes).slice(2)
      expect(context.publicContext.preimageHash).toBe(expectedHash)
    })

    test('should generate a different mnemonic on each call', () => {
      const ctx1 = chainSwapOut.createContext() as BoltzChainSwapOutContext
      const ctx2 = chainSwapOut.createContext() as BoltzChainSwapOutContext
      expect(ctx1.secretContext.rescueMnemonic).not.toBe(ctx2.secretContext.rescueMnemonic)
    })
  })

  describe('validateAddress', () => {
    test('should validate the address correctly', async () => {
      const mockSwap = { paymentAddress: '0x123' } as Swap // eslint-disable-line @typescript-eslint/consistent-type-assertions
      const expectedHash = VALIDATION_CONSTANTS.boltz.etherSwapBytecodeHash
      const spy = jest.spyOn(validation, 'validateContractCode').mockResolvedValue(true)

      const isValid = await chainSwapOut.validateAddress(mockSwap)

      expect(spy).toHaveBeenCalledWith(mockConnection, mockSwap.paymentAddress, expectedHash)
      expect(isValid).toBe(true)
    })
  })

  describe('generateAction should', () => {
    test('generate a valid SwapAction', async () => {
      const mockCreatedSwap = {
        swap: {
          paymentAddress: '0x123',
          context: {
            publicContext: {
              preimageHash: 'ab00000000000000000000000000000000000000000000000000000000000000',
              lockupDetails: {
                claimAddress: '0x00000000000000000000000000000000000000D4',
                amount: 1000,
                timeoutBlockHeight: 500
              }
            }
          }
        }
      } as unknown as CreatedSwap

      const action = await chainSwapOut.generateAction(mockCreatedSwap)

      expect(action).toEqual({
        type: 'CONTRACT-INTERACTION',
        data: {
          to: '0x123',
          data: '0x0899146bab0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d400000000000000000000000000000000000000000000000000000000000001f4',
          value: '0x9184e72a000'
        },
        requiresClaim: true
      })
    })

    test('fail on incomplete swap', async () => {
      const incompleteSwaps = [
        {
          swap: {
            paymentAddress: '0x123',
            context: {
              publicContext: {
                preimageHash: 'abcdef',
                lockupDetails: { claimAddress: '0x456', amount: 1000 }
              }
            }
          }
        },
        {
          swap: {
            paymentAddress: '0x123',
            context: {
              publicContext: {
                preimageHash: 'abcdef',
                lockupDetails: { claimAddress: '0x456', timeoutBlockHeight: 500 }
              }
            }
          }
        },
        {
          swap: {
            paymentAddress: '0x123',
            context: {
              publicContext: {
                preimageHash: 'abcdef',
                lockupDetails: { amount: 1000, timeoutBlockHeight: 500 }
              }
            }
          }
        },
        {
          swap: {
            paymentAddress: '0x123',
            context: {
              publicContext: {
                lockupDetails: { claimAddress: '0x456', amount: 1000, timeoutBlockHeight: 500 }
              }
            }
          }
        },
        {
          swap: {
            context: {
              publicContext: {
                preimageHash: 'abcdef',
                lockupDetails: { claimAddress: '0x456', amount: 1000, timeoutBlockHeight: 500 }
              }
            }
          }
        }
      ]
      for (const swap of incompleteSwaps) {
        await expect(chainSwapOut.generateAction(swap as CreatedSwap)).rejects.toThrow()
      }
    })
  })

  describe('getClaimDetails', () => {
    test('should throw an error', () => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      expect(() => chainSwapOut.getClaimDetails({} as Swap)).toThrow(
        'ClaimDetails are only needed for claims in EVM. Not in Bitcoin.'
      )
    })
  })
})
