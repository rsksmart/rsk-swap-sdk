import { describe, expect, test, beforeEach, jest } from '@jest/globals'

import * as getProvidersMod from './getProviders'
import * as getProviderMod from './getProvider'
import * as estimateSwapMod from './estimateSwap'
import * as createSwapMod from './createSwap'
import * as getSwapMod from './getSwap'
import * as executeSwapMod from './executeSwap'
import * as getLimitsMod from './getLimits'
import * as listTokensMod from './listTokens'
import * as claimSwapMod from './claimSwap'

import { RskSwapSDK } from './rskSwap'
import { type CreateSwapRQ as CreateSwapArgs } from '../api'
import { type TxResult, type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { type SwapWithAction, type SwapAction } from '../providers/types'
import { ProviderClientResolver } from '../providers/resolver'
import { BoltzClient } from '../providers/boltz'
import { ChangellyClient } from '../providers/changelly'

jest.mock('./getProviders')
jest.mock('./getProvider')
jest.mock('./estimateSwap')
jest.mock('./createSwap')
jest.mock('./getSwap')
jest.mock('./executeSwap')
jest.mock('./getLimits')
jest.mock('./listTokens')
jest.mock('./claimSwap')

jest.mock('../providers/boltz', () => {
  return {
    BoltzClient: jest.fn().mockImplementation(() => {
      return {
        createContext: jest.fn(),
        validateAddress: jest.fn(),
        generateAction: jest.fn()
      }
    })
  }
})

jest.mock('../providers/changelly', () => {
  return {
    ChangellyClient: jest.fn().mockImplementation(() => {
      return {
        createContext: jest.fn(),
        validateAddress: jest.fn(),
        generateAction: jest.fn()
      }
    })
  }
})

describe('RskSwapSDK class should', () => {
  const apiUrl = 'http://localhost:8080/api'
  let sdk: RskSwapSDK
  let connectionMock: BlockchainConnection
  const httpClientMatcher = expect.objectContaining({
    get: expect.any(Function),
    post: expect.any(Function),
    getCaptchaToken: expect.any(Function)
  })

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    connectionMock = jest.mocked({
      getChainHeight: async () => Promise.resolve(1)
    } as BlockchainConnection)
    sdk = new RskSwapSDK('Local', connectionMock)
  })
  test('initialize properly', async () => {
    jest.clearAllMocks()
    sdk = new RskSwapSDK('Local', connectionMock)
    expect(sdk).toBeDefined()
    expect(BoltzClient).toHaveBeenCalledTimes(1)
    expect(ChangellyClient).toHaveBeenCalledTimes(1)
  })
  test('throw an error on unexpected environment name', async () => {
    // @ts-expect-error "Unexpected" is not assignable to parameter of type RskSwapEnvironmentName
    expect(() => new RskSwapSDK('Unexpected', connectionMock)).toThrow('Environment Unexpected not found')
  })
  test('invoke estimateSwap properly', async () => {
    const mockResult: any = { value: 1 }
    jest.spyOn(estimateSwapMod, 'estimateSwap').mockResolvedValueOnce(mockResult)
    const args: estimateSwapMod.SwapEstimationArgs = {
      fromToken: 'ETH',
      toToken: 'BTC',
      fromAmount: BigInt(1),
      fromChainId: '1',
      toChainId: 'BTC'
    }
    const result = await sdk.estimateSwap(args)
    expect(result).toEqual(mockResult)
    expect(estimateSwapMod.estimateSwap).toHaveBeenCalledTimes(1)
    expect(estimateSwapMod.estimateSwap).toHaveBeenCalledWith(apiUrl, httpClientMatcher, args)
  })
  test('invoke createNewSwap properly', async () => {
    const mockResult: any = { value: 2 }
    jest.spyOn(createSwapMod, 'createSwap').mockResolvedValueOnce(mockResult)
    const args: CreateSwapArgs = {
      providerId: 'PROVIDER1',
      address: '0x123456789',
      fromToken: 'ETH',
      toToken: 'BTC',
      fromAmount: BigInt(1),
      refundAddress: '0x123456789',
      fromNetwork: '1',
      toNetwork: 'BTC',
      context: {}
    }
    const result = await sdk.createNewSwap(args)
    expect(result).toEqual(mockResult)
    expect(createSwapMod.createSwap).toHaveBeenCalledTimes(1)
    expect(createSwapMod.createSwap).toHaveBeenCalledWith(apiUrl, httpClientMatcher, expect.any(ProviderClientResolver), args)
  })
  test('invoke getSwapStatus properly', async () => {
    const mockResult: any = { value: 3 }
    jest.spyOn(getSwapMod, 'getSwap').mockResolvedValueOnce(mockResult)
    const id = { providerId: 'P1', id: '123' }
    const result = await sdk.getSwapStatus(id)
    expect(result).toEqual(mockResult)
    expect(getSwapMod.getSwap).toHaveBeenCalledTimes(1)
    expect(getSwapMod.getSwap).toHaveBeenCalledWith(apiUrl, httpClientMatcher, id)
  })
  test('invoke getProviders properly', async () => {
    const mockResult: any = { value: 4 }
    jest.spyOn(getProvidersMod, 'getProviders').mockResolvedValueOnce(mockResult)
    const result = await sdk.getProviders()
    expect(result).toEqual(mockResult)
    expect(getProvidersMod.getProviders).toHaveBeenCalledTimes(1)
    expect(getProvidersMod.getProviders).toHaveBeenCalledWith(apiUrl, httpClientMatcher)
  })
  test('invoke getProvider properly', async () => {
    const mockResult: any = { value: 5 }
    jest.spyOn(getProviderMod, 'getProvider').mockResolvedValueOnce(mockResult)
    const id = 'PROVIDER1'
    const result = await sdk.getProvider(id)
    expect(result).toEqual(mockResult)
    expect(getProviderMod.getProvider).toHaveBeenCalledTimes(1)
    expect(getProviderMod.getProvider).toHaveBeenCalledWith(apiUrl, httpClientMatcher, id)
  })

  test('invoke executeSwap properly', async () => {
    const hash = 'a tx hash'
    jest.spyOn(executeSwapMod, 'executeSwap').mockResolvedValueOnce(hash)
    const action: SwapAction = {
      type: 'ERC20-PAYMENT',
      requiresClaim: false,
      data: {
        to: '0x123456789',
        data: '0x123456789',
        value: '0x123456789'
      }
    }
    const result = await sdk.executeSwap(action)
    expect(result).toEqual(hash)
    expect(executeSwapMod.executeSwap).toHaveBeenCalledTimes(1)
    expect(executeSwapMod.executeSwap).toHaveBeenCalledWith(connectionMock, action)
  })

  test('invoke getSwapLimits properly', async () => {
    const mockResult: any = { value: 6 }
    jest.spyOn(getLimitsMod, 'getSwapLimits').mockResolvedValueOnce(mockResult)
    const args: getLimitsMod.SwapLimitsArgs = {
      fromToken: 'ETH',
      toToken: 'BTC',
      fromChainId: '1',
      toChainId: 'BTC'
    }
    const result = await sdk.getSwapLimits(args)
    expect(result).toEqual(mockResult)
    expect(getLimitsMod.getSwapLimits).toHaveBeenCalledTimes(1)
    expect(getLimitsMod.getSwapLimits).toHaveBeenCalledWith(apiUrl, httpClientMatcher, args)
  })
  test('invoke listTokens properly', async () => {
    const mockResult: any = { value: 7 }
    jest.spyOn(listTokensMod, 'listTokens').mockResolvedValueOnce(mockResult)
    const result = await sdk.listTokens()
    expect(result).toEqual(mockResult)
    expect(listTokensMod.listTokens).toHaveBeenCalledTimes(1)
    expect(listTokensMod.listTokens).toHaveBeenCalledWith(apiUrl, httpClientMatcher)
  })

  test('invoke claimSwap properly', async () => {
    const mockResult: TxResult = { txHash: 'a tx hash', successful: true }
    jest.spyOn(claimSwapMod, 'claimSwap').mockResolvedValueOnce(mockResult)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const swap: SwapWithAction = { swap: { providerId: 'PROVIDER' }, action: { requiresClaim: true } } as SwapWithAction
    const result = await sdk.claimSwap(swap)
    expect(result).toEqual('a tx hash')
    expect(claimSwapMod.claimSwap).toHaveBeenCalledTimes(1)
    expect(claimSwapMod.claimSwap).toHaveBeenCalledWith(expect.any(ProviderClientResolver), swap, connectionMock)
  })

  test('change connection correctly', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const otherConnection = jest.mocked({} as BlockchainConnection)

    sdk.changeConnection(otherConnection)
    expect((sdk as any).connection).toBe(otherConnection)
    expect((sdk as any).connection).not.toBe(connectionMock)
  })
})
