import { describe, expect, test, beforeEach } from '@jest/globals'
import { ChainSwapIn } from './chainSwapIn'
import { ethers } from '@rsksmart/bridges-core-sdk'
import { type CreatedSwap, type Swap } from '../../api'
import { type RskSwapEnvironmentName } from '../../constants/environment'
import * as ecpair from 'ecpair'
import { initEccLib } from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
import { type BoltzChainSwapInContext } from './types'
import { deriveSwapKey, deriveSwapPreimage } from './rescueKey'
import * as bip39 from 'bip39'
import { arrayToHexKey } from '../../utils/conversion'

describe('ChainSwapIn', () => {
  let chainSwapIn: ChainSwapIn
  let keyFactory: ecpair.ECPairAPI
  beforeEach(() => {
    initEccLib(ecc)
    keyFactory = ecpair.ECPairFactory(ecc)
    const network: RskSwapEnvironmentName = 'Testnet'
    chainSwapIn = new ChainSwapIn(network, keyFactory)
  })

  describe('createContext', () => {
    test('should store a 12-word BIP39 rescue mnemonic in secretContext', () => {
      const context = chainSwapIn.createContext() as BoltzChainSwapInContext
      expect(context.secretContext.rescueMnemonic).toBeDefined()
      expect(context.secretContext.rescueMnemonic.split(' ')).toHaveLength(12)
      expect(bip39.validateMnemonic(context.secretContext.rescueMnemonic)).toBe(true)
    })

    test('should derive refundPublicKey deterministically from the rescue mnemonic', () => {
      const context = chainSwapIn.createContext() as BoltzChainSwapInContext
      const derivedKey = deriveSwapKey(context.secretContext.rescueMnemonic, keyFactory)
      expect(context.publicContext.refundPublicKey).toBe(arrayToHexKey(derivedKey.publicKey))
    })

    test('should derive preimage as sha256(privateKey) from the rescue mnemonic', () => {
      const context = chainSwapIn.createContext() as BoltzChainSwapInContext
      const derivedPreimage = deriveSwapPreimage(context.secretContext.rescueMnemonic, keyFactory)
      expect(context.secretContext.preimage).toBe(derivedPreimage.toString('hex'))
    })

    test('should derive preimageHash as sha256(preimage)', () => {
      const context = chainSwapIn.createContext() as BoltzChainSwapInContext
      const preimageBytes = Buffer.from(context.secretContext.preimage, 'hex')
      const expectedHash = ethers.utils.sha256(preimageBytes).slice(2)
      expect(context.publicContext.preimageHash).toBe(expectedHash)
    })

    test('should set correct placeholder values for fields filled by finalizeContext', () => {
      const context = chainSwapIn.createContext() as BoltzChainSwapInContext
      expect(context.secretContext.swapTree).toBe('')
      expect(context.secretContext.timeoutBlockHeight).toBe(0)
      expect(context.secretContext.claimPublicKey).toBe('')
      expect(context.secretContext.version).toBe(0)
    })

    test('should generate a different mnemonic on each call', () => {
      const ctx1 = chainSwapIn.createContext() as BoltzChainSwapInContext
      const ctx2 = chainSwapIn.createContext() as BoltzChainSwapInContext
      expect(ctx1.secretContext.rescueMnemonic).not.toBe(ctx2.secretContext.rescueMnemonic)
    })
  })

  describe('validateAddress', () => {
    test('should validate a testnet address correctly', async () => {
      const mockSwap: Swap = {
        context: {
          publicContext: {
            refundPublicKey: '03abff2703d2fdbf286166b3233f1b1470fae9973ac7120da27952c22334955277',
            lockupDetails: {
              serverPublicKey: '031092a9a97cdc67b01f1cca6b2b73bff72cc9eb698286b9f886b48c7a8865f393',
              swapTree: {
                claimLeaf: {
                  version: 192,
                  output: '82012088a9140eff41aa31ca8086f73bc7a356f28cce66fac74988201092a9a97cdc67b01f1cca6b2b73bff72cc9eb698286b9f886b48c7a8865f393ac'
                },
                refundLeaf: {
                  version: 192,
                  output: '20abff2703d2fdbf286166b3233f1b1470fae9973ac7120da27952c22334955277ad03e58b41b1'
                }
              }
            }
          }
        },
        paymentAddress: 'tb1pk2hpzkd8ygh0a4tkvxe3trhsxx4q7ed6a5pf6gtpuaxhx0ascxsqsyl6gr'
      } as unknown as Swap

      const isValid = await chainSwapIn.validateAddress(mockSwap)
      expect(isValid).toBe(true)
    })
    test('should fail to validate a testnet address', async () => {
      const mockSwap: Swap = {
        context: {
          publicContext: {
            refundPublicKey: '03abff2703d2fdbf286166b3233f1b1470fae9973ac7120da27952c22334955277',
            lockupDetails: {
              serverPublicKey: '031092a9a97cdc67b01f1cca6b2b73bff72cc9eb698286b9f886b48c7a8865f393',
              swapTree: {
                claimLeaf: {
                  version: 192,
                  output: '82012088a9140eff41aa31ca8086f73bc7a356f28cce66fac74988201092a9a97cdc67b01f1cca6b2b73bff72cc9eb698286b9f886b48c7a8865f393ac'
                },
                refundLeaf: {
                  version: 192,
                  output: '20abff2703d2fdbf286166b3233f1b1470fae9973ac7120da27952c22334955277ad03e58b41b1'
                }
              }
            }
          }
        },
        paymentAddress: 'tb1psvtgqflnq5t4skyewf89pfzvw5crp3r9aeg8w6e8vcsshpzsddgs6u32gm'
      } as unknown as Swap

      const isValid = await chainSwapIn.validateAddress(mockSwap)
      expect(isValid).toBe(false)
    })
    test('should validate a mainnet address correctly', async () => {
      chainSwapIn = new ChainSwapIn('Mainnet', keyFactory)
      const mockSwap: Swap = {
        context: {
          publicContext: {
            refundPublicKey: '02f844577781199142eb44513459647255dc934046f98ed2d7a00847a7eac7f404',
            lockupDetails: {
              serverPublicKey: '03075fbbe65c80fe95563e9f8e5830a40608712542e3aa6516d67c9291742a542a',
              swapTree: {
                claimLeaf: {
                  version: 192,
                  output: '82012088a9141f071df25fa73b2ec75764e99cb4d83e690545458820075fbbe65c80fe95563e9f8e5830a40608712542e3aa6516d67c9291742a542aac'
                },
                refundLeaf: {
                  version: 192,
                  output: '20f844577781199142eb44513459647255dc934046f98ed2d7a00847a7eac7f404ad0396a20db1'
                }
              }
            }
          }
        },
        paymentAddress: 'bc1pa9jsyzlruuuq0kv28z9gjle9sayqu0ysnpd4t0ae8z4nhkak53uqca0l7j'
      } as unknown as Swap

      const isValid = await chainSwapIn.validateAddress(mockSwap)
      expect(isValid).toBe(true)
    })
    test('should fail to validate a mainnet address', async () => {
      chainSwapIn = new ChainSwapIn('Mainnet', keyFactory)
      const mockSwap: Swap = {
        context: {
          publicContext: {
            refundPublicKey: '02f844577781199142eb44513459647255dc934046f98ed2d7a00847a7eac7f404',
            lockupDetails: {
              serverPublicKey: '03075fbbe65c80fe95563e9f8e5830a40608712542e3aa6516d67c9291742a542a',
              swapTree: {
                claimLeaf: {
                  version: 192,
                  output: '82012088a9141f071df25fa73b2ec75764e99cb4d83e690545458820075fbbe65c80fe95563e9f8e5830a40608712542e3aa6516d67c9291742a542aac'
                },
                refundLeaf: {
                  version: 192,
                  output: '20f844577781199142eb44513459647255dc934046f98ed2d7a00847a7eac7f404ad0396a20db1'
                }
              }
            }
          }
        },
        paymentAddress: 'bc1pzjks8csexyddv6txuulf7wnz92z4p2zage72zcrjwyyuqg6ypgusng786m'
      } as unknown as Swap

      const isValid = await chainSwapIn.validateAddress(mockSwap)
      expect(isValid).toBe(false)
    })
  })

  describe('generateAction', () => {
    test('should generate a valid BIP21 action', async () => {
      const mockCreatedSwap = {
        swap: {
          paymentAddress: 'paymentAddress',
          fromAmount: ethers.BigNumber.from('199999999') // sats
        }
      }
      const action = await chainSwapIn.generateAction(mockCreatedSwap as unknown as CreatedSwap)
      expect(action).toEqual({
        type: 'BIP21',
        data: 'bitcoin:paymentAddress?amount=1.99999999',
        requiresClaim: true
      })
    })
  })
  describe('getClaimDetails', () => {
    const mockSwap: Swap = {
      context: {
        publicContext: {
          claimDetails: {
            lockupAddress: 'lockupAddress',
            amount: '100000000', // 1 BTC in satoshis
            refundAddress: 'refundAddress',
            timeoutBlockHeight: 1000
          }
        },
        secretContext: {
          preimage: 'preimage',
          privateKey: 'privateKey',
          swapTree: '{}',
          timeoutBlockHeight: 1000,
          claimPublicKey: 'claimPublicKey',
          version: 3
        }
      }
    } as unknown as Swap

    test('should return valid claim details', () => {
      const claimDetails = chainSwapIn.getClaimDetails(mockSwap)
      expect(claimDetails).toEqual({
        lockupAddress: 'lockupAddress',
        refundAddress: 'refundAddress',
        destinationAmount: '100000000',
        timeoutBlockHeight: 1000,
        preimage: 'preimage'
      })
    })
    test('should throw an error if claim details are missing', () => {
      const validSecretContext = { preimage: 'preimage', privateKey: 'privateKey', swapTree: '{}', timeoutBlockHeight: 1000, claimPublicKey: 'claimPublicKey', version: 3 }
      const partialContexts = [
        {
          publicContext: {
            claimDetails: {
              amount: '100000000',
              refundAddress: 'refundAddress',
              timeoutBlockHeight: 1000
            }
          },
          secretContext: validSecretContext
        },
        {
          publicContext: {
            claimDetails: {
              lockupAddress: 'lockupAddress',
              refundAddress: 'refundAddress',
              timeoutBlockHeight: 1000
            }
          },
          secretContext: validSecretContext
        },
        {
          publicContext: {
            claimDetails: {
              lockupAddress: 'lockupAddress',
              amount: '100000000',
              timeoutBlockHeight: 1000
            }
          },
          secretContext: validSecretContext
        },
        {
          publicContext: {
            claimDetails: {
              lockupAddress: 'lockupAddress',
              amount: '100000000',
              refundAddress: 'refundAddress'
            }
          },
          secretContext: validSecretContext
        },
        {
          publicContext: {
            claimDetails: {
              lockupAddress: 'lockupAddress',
              amount: '100000000', // 1 BTC in satoshis
              refundAddress: 'refundAddress',
              timeoutBlockHeight: 1000
            }
          },
          secretContext: {}
        },
        {
          publicContext: {
            claimDetails: {
              lockupAddress: 'lockupAddress',
              amount: '100000000',
              refundAddress: 'refundAddress',
              timeoutBlockHeight: 1000
            }
          },
          secretContext: { preimage: 'preimage' }
        }
      ]
      for (const context of partialContexts) {
        expect(() => chainSwapIn.getClaimDetails({ ...mockSwap, context } as unknown as Swap)).toThrow(/(Validation failed for object with following missing properties)+/)
      }
    })
  })
})
