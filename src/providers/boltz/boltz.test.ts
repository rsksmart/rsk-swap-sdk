import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type HttpClient, type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { type Swap } from '../../api'
import { BoltzClient } from './boltz'
import { readFileSync } from 'fs'
import { join } from 'path'
import { type ReverseSwap } from './reverseSwap'
import { type SubmarineSwap } from './submarineSwap'
import { type ChainSwapIn } from './chainSwapIn'
import { type ChainSwapOut } from './chainSwapOut'
import { DefaultBoltzAtomicSwapFactory } from './factory'
import { PROVIDER_URLS } from '../../constants/url'

jest.mock('boltz-core', () => {
  const originalModule: any = jest.requireActual('boltz-core')
  originalModule.Musig.prototype.addPartial = jest.fn()
  return {
    ...originalModule,
    Musig: class extends originalModule.Musig {
      addPartial = jest.fn()
      aggregatePartials = jest.fn().mockReturnValue(Buffer.from('010203', 'hex'))
      initializeSession = jest.fn()
      signPartial = jest.fn()
    }
  }
})

const reverseSwapMock: Swap =
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

describe('BoltzClient class should', () => {
  let boltzClient: BoltzClient
  let conn: jest.Mocked<BlockchainConnection>
  let http: jest.Mocked<HttpClient>
  let chainSwapInClient: ChainSwapIn
  let chainSwapOutClient: ChainSwapOut
  let submarineSwapClient: SubmarineSwap
  let reverseSwapClient: ReverseSwap

  beforeEach(() => {
    const bytecode = readFileSync(join(__dirname, '/ether-swap-test-bytecode.txt'), 'utf-8')
    const provider: unknown = {
      getCode: jest.fn<() => Promise<string>>().mockResolvedValue(bytecode.trim())
    }
    const connectionMock: unknown = jest.mocked({ provider })
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    conn = {
      getAbstraction: () => connectionMock,
      getUnderlyingProvider: () => provider
    } as jest.Mocked<BlockchainConnection>
    http = {
      getCaptchaToken: jest.fn<HttpClient['getCaptchaToken']>(),
      get: jest.fn<any>(),
      post: jest.fn<any>()
    }

    chainSwapInClient = {
      createContext: jest.fn(),
      validateAddress: jest.fn(),
      generateAction: jest.fn(),
      getClaimDetails: jest.fn()
    } as unknown as ChainSwapIn

    chainSwapOutClient = {
      createContext: jest.fn(),
      validateAddress: jest.fn(),
      generateAction: jest.fn(),
      getClaimDetails: jest.fn()
    } as unknown as ChainSwapOut

    submarineSwapClient = {
      createContext: jest.fn(),
      validateAddress: jest.fn(),
      generateAction: jest.fn(),
      getClaimDetails: jest.fn()
    } as unknown as SubmarineSwap

    reverseSwapClient = {
      createContext: jest.fn(),
      validateAddress: jest.fn(),
      generateAction: jest.fn(),
      getClaimDetails: jest.fn()
    } as unknown as ReverseSwap

    boltzClient = new BoltzClient('Testnet', conn, http, {
      createChainSwapIn: () => chainSwapInClient,
      createChainSwapOut: () => chainSwapOutClient,
      createSubmarineSwap: () => submarineSwapClient,
      createReverseSwap: () => reverseSwapClient
    })
  })
  describe('build a correct claim transaction', () => {
    test('fail on incomplete context', async () => {
      boltzClient = new BoltzClient('Mainnet', conn, http, new DefaultBoltzAtomicSwapFactory())
      const swap: Swap = structuredClone(reverseSwapMock)
      swap.context = {}
      await expect(async () => boltzClient.buildClaimTransaction(swap)).rejects.toThrow('Validation failed for object with following missing properties: publicContext, secretContext')
    })
    test('fail on contract code mismatch', async () => {
      boltzClient = new BoltzClient('Mainnet', conn, http, new DefaultBoltzAtomicSwapFactory())
      await expect(boltzClient.buildClaimTransaction(reverseSwapMock)).rejects.toThrow('Unexpected contract content')
    })
    test('build claim correctly', async () => {
      boltzClient = new BoltzClient('Testnet', conn, http, new DefaultBoltzAtomicSwapFactory())
      const result = await boltzClient.buildClaimTransaction(reverseSwapMock)
      expect(conn.getUnderlyingProvider()?.getCode).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        to: '0x42f92ecf2d3fa43239de7fab235679a5c74f8dcd',
        data: '0xcd413efa937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae224400000000000000000000000000000000000000000000000000005f062549400000000000000000000000000079568c2989232dca1840087d73d403602364c0d40000000000000000000000004217bd283e9dc9a2ce3d5d20fae34aa0902c28db00000000000000000000000000000000000000000000000000000000005cb190',
        value: '0x0'
      })
    })

    describe('routeAtomicSwap method', () => {
      test('should return ReverseSwap for Lightning to RSK', () => {
        const result = (boltzClient as any).routeAtomicSwap({ fromNetwork: 'LN', toNetwork: '31' })
        expect(result).toBe(reverseSwapClient)
      })

      test('should return SubmarineSwap for RSK to Lightning', () => {
        const result = (boltzClient as any).routeAtomicSwap({ fromNetwork: '30', toNetwork: 'LN' })
        expect(result).toBe(submarineSwapClient)
      })

      test('should return ChainSwapIn for BTC to RSK', () => {
        const result = (boltzClient as any).routeAtomicSwap({ fromNetwork: 'BTC', toNetwork: '33' })
        expect(result).toBe(chainSwapInClient)
      })

      test('should return ChainSwapOut for RSK to BTC', () => {
        const result = (boltzClient as any).routeAtomicSwap({ fromNetwork: '30', toNetwork: 'BTC' })
        expect(result).toBe(chainSwapOutClient)
      })

      test('should throw error for unsupported swap', () => {
        expect(() => (boltzClient as any).routeAtomicSwap({ fromNetwork: 'ETH', toNetwork: 'RSK' }))
          .toThrow('Unsupported swap from ETH to RSK')
      })
    })
  })
  describe('createContext method', () => {
    test('should create context using the correct swap type', () => {
      const args = { fromNetwork: 'LN', toNetwork: '31', fromToken: 'tBTC', toToken: 'tRBTC', fromAmount: BigInt(1000), providerId: 'BOLTZ', address: '0x123', refundAddress: '0x456' }
      expect(() => boltzClient.createContext(args)).not.toThrow()
      expect(reverseSwapClient.createContext).toHaveBeenCalled()
    })
  })

  describe('validateAddress method', () => {
    test('should validate address using the correct swap type', async () => {
      expect(async () => boltzClient.validateAddress(reverseSwapMock)).not.toThrow()
      expect(reverseSwapClient.validateAddress).toHaveBeenCalledTimes(1)
      expect(reverseSwapClient.validateAddress).toHaveBeenCalledWith(reverseSwapMock)
    })
  })

  describe('generateAction method', () => {
    test('should generate action using the correct swap type', async () => {
      expect(async () => boltzClient.generateAction({ swap: reverseSwapMock, actionType: 'CONTRACT-INTERACTION' })).not.toThrow()
      expect(reverseSwapClient.generateAction).toHaveBeenCalledTimes(1)
      expect(reverseSwapClient.generateAction).toHaveBeenCalledWith({ swap: reverseSwapMock, actionType: 'CONTRACT-INTERACTION' })
    })
  })

  test('should build claim transaction correctly', async () => {
    (reverseSwapClient.getClaimDetails as jest.Mock<any>).mockReturnValue({
      lockupAddress: '0x0000000000000000000000000000000000000001',
      preimage: 'd7b6468a714e46602e9cd5188486e56d8ec01b6a8607e19342a914db86975437',
      onchainAmount: 1000,
      refundAddress: '0x0000000000000000000000000000000000000002',
      timeoutBlockHeight: 12345
    })
    const result = await boltzClient.buildClaimTransaction(reverseSwapMock)
    expect(conn.getUnderlyingProvider()?.getCode).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      to: '0x0000000000000000000000000000000000000001',
      data: '0xcd413efad7b6468a714e46602e9cd5188486e56d8ec01b6a8607e19342a914db86975437000000000000000000000000000000000000000000000000000009184e72a00000000000000000000000000079568c2989232dca1840087d73d403602364c0d400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000003039',
      value: '0x0'
    })
  })

  describe('executeExternalClaim method', () => {
    test('should throw error if swap is not RSK to BTC', async () => {
      const invalidSwap: Swap = structuredClone(reverseSwapMock)
      invalidSwap.fromNetwork = 'ETH'
      invalidSwap.toNetwork = 'BTC'

      await expect(boltzClient.executeExternalClaim(invalidSwap))
        .rejects
        .toHaveProperty('details.cause', 'External claim is not applicable for this swap')
    })

    test('should throw error if context validation fails', async () => {
      const invalidSwaps = [
        { swap: { fromNetwork: '30', toNetwork: 'BTC', context: {} }, error: 'Missing claim private key in swap context' },
        {
          swap: {
            fromNetwork: '30',
            toNetwork: 'BTC',
            context: {
              secretContext: {
                claimPrivateKey: '1'
              }
            }
          },
          error: 'Missing server public key in swap context'
        },
        {
          swap: {
            fromNetwork: '30',
            toNetwork: 'BTC',
            context: {
              secretContext: {
                claimPrivateKey: '1'

              },
              publicContext: {
                claimPublicKey: '2'

              }
            }
          },
          error: 'Missing claim public key in swap context'
        },
        {
          swap: {
            fromNetwork: '30',
            toNetwork: 'BTC',
            context: {
              secretContext: {
                claimPrivateKey: '1'
              },
              publicContext: {
                claimPublicKey: '2',
                claimDetails: {
                  serverPublicKey: '3'
                }
              }
            }
          },
          error: 'Missing preimage in swap context'
        },
        {
          swap: {
            fromNetwork: '30',
            toNetwork: 'BTC',
            context: {
              secretContext: {
                claimPrivateKey: '1',
                preimage: '4'
              },
              publicContext: {
                claimPublicKey: '2',
                claimDetails: {
                  serverPublicKey: '3',
                  swapTree: ''
                }
              }
            }
          },
          error: 'Missing swap tree in swap context'
        }
      ] as Array<{ swap: Swap, error: string }>

      for (const invalidSwap of invalidSwaps) {
        await expect(boltzClient.executeExternalClaim(invalidSwap.swap))
          .rejects
          .toThrow(invalidSwap.error)
      }
    })

    test('should execute external claim successfully', async () => {
      const swap = {
        providerSwapId: 'mocked-swap-id',
        fromNetwork: '31',
        toNetwork: 'BTC',
        receiverAddress: 'tb1q8pa8kh5dj0chumrwsf6eqlsa4cyr7je0t77z9r',
        context: {
          secretContext: {
            claimPrivateKey: 'ab5239680989264b464838586c9435e3ea4a7c6e6471b430b6e7fa90de49101c',
            preimage: '3749c977b68c5d70f08c545f79545bf3b8d981edcf35c438e12580f9d45b485d'
          },
          publicContext: {
            claimPublicKey: '0212abe9051067db6b3f8aeae086f71ab340c2f6a597ed2d4882fe3ecac4c1711a',
            claimDetails: {
              serverPublicKey: '03af8ada65ed47678d415d92743c73559c71ccb7ce3f15c1a67743073c3f760fc9',
              swapTree: {
                claimLeaf: {
                  version: 192,
                  output: '82012088a91438a7df7a32ba98feea812ae8e033b2e5a1b6d6f5882012abe9051067db6b3f8aeae086f71ab340c2f6a597ed2d4882fe3ecac4c1711aac'
                },
                refundLeaf: {
                  version: 192,
                  output: '20af8ada65ed47678d415d92743c73559c71ccb7ce3f15c1a67743073c3f760fc9ad032f8e41b1'
                }
              }
            }
          }
        }
      } as unknown as Swap

      const mockTxId = 'mocked-tx-id'
      http.get.mockResolvedValueOnce({
        serverLock: {
          transaction: {
            hex: '02000000000101d7b24c8ea9609a411181ac144f44996e36fdbace4ca881bebf3dc88649ebd51e0000000000feffffff02e3c100000000000022512039c019a4635203b7d24ded0583b046af38b8d9c3f190df902f4fed31b5b4caed474902000000000022512099f54afafabb064b6643888e0bf10cf2f1342acabd7516d2b8b661b15a13bde30140ea0e79523b3c18d3cc45da8807ee4e424e3b35aa5e015c2a3fa505b065c2701c9baf8b8340b7571c18403c2895258dcc0401d40925003482fcf13ec8a3ed06d09f8d4100'
          }
        }
      })
      http.get.mockResolvedValueOnce({
        BTC: 2
      })
      http.post.mockResolvedValueOnce({
        pubNonce: '03eb4534de2d480375dedf3f83b739d8d6ccd102a5bd6aecbfeff0a3acbaa5131702938a68ff2469f917f79e9d9df5fbbf608bd20176eb69d73bf2eb86c99dbaaada',
        partialSignature: '07cfb093bc931d07b8ab80f5b42462069dce56909c7acfa22e3b217ce087a519'
      })
      http.post.mockResolvedValue({ id: mockTxId })

      const result = await boltzClient.executeExternalClaim(swap)
      expect(http.get).toHaveBeenNthCalledWith(
        1, `${PROVIDER_URLS.boltz.testnet}/swap/chain/${swap.providerSwapId}/transactions`
      )
      expect(http.get).toHaveBeenNthCalledWith(
        2, `${PROVIDER_URLS.boltz.testnet}/chain/fees`
      )
      expect(http.post).toHaveBeenNthCalledWith(
        1,
        `${PROVIDER_URLS.boltz.testnet}/swap/chain/${swap.providerSwapId}/claim`,
        {
          preimage: '3749c977b68c5d70f08c545f79545bf3b8d981edcf35c438e12580f9d45b485d',
          toSign: {
            index: 0,
            pubNonce: expect.any(String),
            transaction: expect.any(String)
          }
        }
      )
      expect(http.post).toHaveBeenNthCalledWith(
        2,
        `${PROVIDER_URLS.boltz.testnet}/chain/BTC/transaction`,
        { hex: '01000000000101651b98a178859375406371b8dff1b932eb78be3bdf923ae1e17515aae0fc89650000000000fdffffff011bc1000000000000160014387a7b5e8d93f17e6c6e8275907e1dae083f4b2f010301020300000000' }
      )
      expect(result).toBe(mockTxId)
    })
  })
})
