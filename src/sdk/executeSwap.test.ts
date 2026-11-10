import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { executeSwap } from './executeSwap'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { type SwapAction } from '../providers/types'
import { RskSwapError } from '../error/error'

jest.mock('@rsksmart/bridges-core-sdk', () => {
  return {
    ...jest.requireActual<any>('@rsksmart/bridges-core-sdk'),
    BlockchainConnection: {
      createUsingPassphrase: jest.fn()
    }
  }
})

describe('executeSwap function should', () => {
  let blockchainConnection: BlockchainConnection
  let txMock: { executeTransaction: jest.Mock }

  beforeEach(async () => {
    txMock = { executeTransaction: jest.fn() }
    jest.spyOn(BlockchainConnection, 'createUsingPassphrase').mockResolvedValue(txMock as any)
    blockchainConnection = await BlockchainConnection.createUsingPassphrase('pass')
  })

  test('return data on BIP21', async () => {
    const bip21 = 'bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=20.3'
    const action = { type: 'BIP21', data: bip21 } as any as SwapAction
    const result = await executeSwap(blockchainConnection, action)
    expect(result).toBe(bip21)
    expect(blockchainConnection.executeTransaction).not.toHaveBeenCalled()
  })
  test('fail if BIP21 data is an object', async () => {
    const action = { type: 'BIP21', data: { some: 'object' } } as any as SwapAction
    await expect(executeSwap(blockchainConnection, action)).rejects.toThrow('Received a wrong value to show in a QR code: {"some":"object"}')
  })
  test('execute transaction on EVM-NATIVE-PAYMENT', async () => {
    txMock.executeTransaction.mockImplementation(async () => Promise.resolve({ txHash: 'a hash' }))
    const action: SwapAction = {
      type: 'EVM-NATIVE-PAYMENT',
      data: {
        to: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
        value: BigInt('500').toString(16),
        data: '0x'
      }
    }
    const result = await executeSwap(blockchainConnection, action)
    expect(result).toBe('a hash')
    expect(blockchainConnection.executeTransaction).toHaveBeenCalledTimes(1)
    expect(blockchainConnection.executeTransaction).toHaveBeenCalledWith({
      to: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
      value: BigInt('500').toString(16),
      data: '0x'
    })
  })

  test('execute transaction on CONTRACT-INTERACTION', async () => {
    txMock.executeTransaction.mockImplementation(async () => Promise.resolve({ txHash: 'a hash' }))
    const action: SwapAction = {
      type: 'CONTRACT-INTERACTION',
      data: {
        to: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
        value: BigInt('500').toString(16),
        data: '0x'
      }
    }
    const result = await executeSwap(blockchainConnection, action)
    expect(result).toBe('a hash')
    expect(blockchainConnection.executeTransaction).toHaveBeenCalledTimes(1)
    expect(blockchainConnection.executeTransaction).toHaveBeenCalledWith({
      to: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
      value: BigInt('500').toString(16),
      data: '0x'
    })
  })

  test('fail if the tx to execute is not an object', async () => {
    txMock.executeTransaction.mockImplementation(async () => Promise.resolve({ txHash: 'a hash' }))
    const action: SwapAction = {
      type: 'EVM-NATIVE-PAYMENT',
      data: 'bip21 by mistake'
    }
    await expect(executeSwap(blockchainConnection, action)).rejects.toThrow('Received a wrong value to execute an EVM transaction: "bip21 by mistake"')
  })

  test('execute transaction on ERC20-PAYMENT', async () => {
    txMock.executeTransaction.mockImplementation(async () => Promise.resolve({ txHash: 'a hash' }))
    const action: SwapAction = {
      type: 'ERC20-PAYMENT',
      data: {
        to: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
        value: BigInt('500').toString(16),
        data: '0xabcdef'
      }
    }
    const result = await executeSwap(blockchainConnection, action)
    expect(result).toBe('a hash')
    expect(blockchainConnection.executeTransaction).toHaveBeenCalledTimes(1)
    expect(blockchainConnection.executeTransaction).toHaveBeenCalledWith({
      to: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
      value: BigInt('500').toString(16),
      data: '0xabcdef'
    })
  })

  test('ERC20-PAYMENT runs executePreSteps before main tx when set', async () => {
    const preStep = jest.fn(async () => {
      await blockchainConnection.executeTransaction({ to: '0xToken', data: '0xapprove', value: '0x0' })
    })
    txMock.executeTransaction
      .mockImplementationOnce(async () => ({ txHash: 'a' }))
      .mockImplementationOnce(async () => ({ txHash: 'b' }))
    const action: SwapAction = {
      type: 'ERC20-PAYMENT',
      data: { to: '0x9D93929A9099be4355fC2389FbF253982F9dF47c', value: '0x0', data: '0xabcdef' },
      executePreSteps: preStep
    }
    await expect(executeSwap(blockchainConnection, action)).resolves.toBe('b')
    expect(preStep).toHaveBeenCalledTimes(1)
    expect(blockchainConnection.executeTransaction).toHaveBeenCalledTimes(2)
  })
  test('do nothing on NONE', async () => {
    const action = { type: 'NONE', data: {} } as any as SwapAction
    const result = await executeSwap(blockchainConnection, action)
    expect(result).toBe('')
    expect(blockchainConnection.executeTransaction).not.toHaveBeenCalled()
  })
  test('fail on unknown action', async () => {
    const action = { type: 'UNKNOWN', data: {} } as any as SwapAction
    expect.assertions(3)
    try {
      await executeSwap(blockchainConnection, action)
    } catch (e: any) {
      expect(e).toBeInstanceOf(RskSwapError)
      expect(e.message).toBe('Unsupported action type')
      expect(e.details.action).toEqual({ type: 'UNKNOWN', data: {} })
    }
  })
})
