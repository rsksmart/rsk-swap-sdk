import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import * as resolverModule from '../providers/resolver'
import { type SwapProviderClient, type SwapWithAction, type TxData } from '../providers/types'

import { claimSwap } from './claimSwap'

const claimTx: TxData = {
  to: 'to',
  data: 'data',
  value: 'value'
}

jest.mock('../providers/resolver', function () {
  return {
    ProviderClientResolver: jest.fn().mockImplementation(() => {
      return {
        register: jest.fn(),
        get: jest.fn().mockReturnValue({
          buildClaimTransaction: jest.fn().mockReturnValueOnce(claimTx)
        })
      }
    })
  }
})

describe('claimSwap function should', () => {
  const providerId = 'PROVIDER1'
  const txResult = { successful: true, txHash: 'txHash' }
  let providerClientMock: jest.Mocked<SwapProviderClient>
  let providerResolver: resolverModule.ProviderClientResolver
  let connectionMock: BlockchainConnection
  let swapMock: SwapWithAction

  beforeEach(() => {
    providerResolver = new resolverModule.ProviderClientResolver()
    providerClientMock = providerResolver.get(providerId) as jest.Mocked<SwapProviderClient>
    connectionMock = jest.mocked({
      executeTransaction: jest.fn().mockReturnValue(Promise.resolve({ successful: true, txHash: 'txHash' }))
    } as any)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    swapMock = { swap: { providerId }, action: { requiresClaim: true } } as SwapWithAction
  })

  test('make the proper calls to claim the swap successfully', async () => {
    const result = await claimSwap(providerResolver, swapMock, connectionMock)
    expect(providerResolver.get).toHaveBeenCalledTimes(2)
    expect(providerResolver.get).toHaveBeenCalledWith(providerId)
    expect(providerClientMock.buildClaimTransaction).toHaveBeenCalledTimes(1)
    expect(providerClientMock.buildClaimTransaction).toHaveBeenCalledWith(swapMock.swap)
    expect(connectionMock.executeTransaction).toHaveBeenCalledTimes(1)
    expect(connectionMock.executeTransaction).toHaveBeenCalledWith(claimTx)
    expect(result).toEqual(txResult)
  })
  test("fail if swap doesn't require claim", async () => {
    const modifiedMock = structuredClone(swapMock)
    modifiedMock.action.requiresClaim = false
    expect.assertions(3)
    try {
      await claimSwap(providerResolver, modifiedMock, connectionMock)
    } catch (e: any) {
      expect(e.message).toBe('Swap error')
      expect(e.details.cause).toBe('This swap does not require a claim')
      expect(e.details.swap).toEqual(swapMock.swap)
    }
  })
  test('fail if client is not supported by resolver', async () => {
    const realModule: typeof resolverModule = jest.requireActual('../providers/resolver')
    const resolver = new realModule.ProviderClientResolver()
    const modifiedMock = structuredClone(swapMock)
    modifiedMock.action.requiresClaim = false
    await expect(claimSwap(resolver, swapMock, connectionMock)).rejects.toThrow('Provider PROVIDER1 not supported')
  })
  test("fail if claim transaction can't be built", async () => {
    providerClientMock.buildClaimTransaction = undefined
    await expect(claimSwap(providerResolver, swapMock, connectionMock)).rejects.toThrow('Claim transaction not available')
  })
})
