import { ethers } from '@rsksmart/bridges-core-sdk'
import { ChainSwapOut } from './chainSwapOut'
import { validateContractCode } from '../../utils/validation'
import { VALIDATION_CONSTANTS } from '../../constants/validation'
import { type Connection } from '@rsksmart/bridges-core-sdk'
import { type ECPairAPI } from 'ecpair'
import { type Swap, type CreatedSwap } from '../../api'
import { describe, expect, test, beforeEach, jest } from '@jest/globals'

jest.mock('../../utils/validation')
jest.mock('@rsksmart/bridges-core-sdk', () => {
  const coreModule = jest.requireActual<any>('@rsksmart/bridges-core-sdk')
  return {
    ...coreModule,
    ethers: {
      utils: {
        ...coreModule.ethers.utils,
        randomBytes: jest.fn(),
        sha256: jest.fn()
      }
    }
  }
})

describe('ChainSwapOut', () => {
  const mockConnection = {} as Connection // eslint-disable-line @typescript-eslint/consistent-type-assertions
  const mockKeyFactory = {
    makeRandom: jest.fn()
  } as unknown as ECPairAPI
  const network = 'Testnet'
  const chainSwapOut = new ChainSwapOut(network, mockConnection, mockKeyFactory)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createContext', () => {
    test('should create a valid context', () => {
      const mockPreimage = new Uint8Array([1, 2, 3])
      const mockPreimageHash = 'abcdef'
      const mockKeys = {
        privateKey: new Uint8Array([4, 5, 6]),
        publicKey: new Uint8Array([7, 8, 9])
      };

      (ethers.utils.randomBytes as jest.Mock<any>).mockReturnValue(mockPreimage);
      (ethers.utils.sha256 as jest.Mock<any>).mockReturnValue(mockPreimageHash);
      (mockKeyFactory.makeRandom as jest.Mock<any>).mockReturnValue(mockKeys)

      const context = chainSwapOut.createContext()

      expect(context).toEqual({
        publicContext: {
          preimageHash: mockPreimageHash.slice(2),
          claimPublicKey: '070809'
        },
        secretContext: {
          preimage: '010203',
          claimPrivateKey: '040506'
        }
      })
      expect(ethers.utils.randomBytes).toHaveBeenCalledWith(32)
      expect(ethers.utils.sha256).toHaveBeenCalledWith(mockPreimage)
      expect(mockKeyFactory.makeRandom).toHaveBeenCalled()
    })
  })

  describe('validateAddress', () => {
    test('should validate the address correctly', async () => {
      const mockSwap = { paymentAddress: '0x123' } as Swap // eslint-disable-line @typescript-eslint/consistent-type-assertions
      const expectedHash = VALIDATION_CONSTANTS.boltz.testnet.etherSwapBytecodeHash;

      (validateContractCode as jest.Mock<any>).mockResolvedValue(true)

      const isValid = await chainSwapOut.validateAddress(mockSwap)

      expect(validateContractCode).toHaveBeenCalledWith(mockConnection, mockSwap.paymentAddress, expectedHash)
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
                lockupDetails: {
                  claimAddress: '0x456',
                  amount: 1000
                }
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
                lockupDetails: {
                  claimAddress: '0x456',
                  timeoutBlockHeight: 500
                }
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
                lockupDetails: {
                  amount: 1000,
                  timeoutBlockHeight: 500
                }
              }
            }
          }
        },
        {
          swap: {
            paymentAddress: '0x123',
            context: {
              publicContext: {
                lockupDetails: {
                  claimAddress: '0x456',
                  amount: 1000,
                  timeoutBlockHeight: 500
                }
              }
            }
          }
        },
        {
          swap: {
            context: {
              publicContext: {
                preimageHash: 'abcdef',
                lockupDetails: {
                  claimAddress: '0x456',
                  amount: 1000,
                  timeoutBlockHeight: 500
                }
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
