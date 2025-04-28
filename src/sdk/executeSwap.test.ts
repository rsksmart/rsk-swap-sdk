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
  test('return data on BOLT11', async () => {
    const bolt11 = 'LNTB10U1PN6L3W9PP5SQC4RZKSNA7S9HYWVQ68DQL9DGKEZY2V98JY6MP93E2NHP55HEMSSP5V63FSZY4RG07JR9WQ3J77JRDLKPUKGH7JHPA6S4PNWVM56MPWV4SDQQCQZYNXQYZ5VQ9QLZQQQQQQQQQQQQQQQQQQQQQQQQQQ9QSQFPPQAE00ZXDRE6MKVC7ELSR73PKRN8DM52DQRZJQ2GYP9ZA7VC7VD8M59FVU63PU00U4PAK35N4UPUV4MHYW5L586DVH7RV45JTAM8PUSQQQQQPQQQQQZSQQC82CVKFHFF3K9N5MZ2D9LVKJAR3XP3NC26JSPJHETPDQAN96765PJU2QQGE8GLF3FYYCVDW5LC7D3GS6VCPWQTL8QFECZTUT0R2GLSLSPP8YQ3V'
    const action = { type: 'BOLT11', data: bolt11 } as any as SwapAction
    const result = await executeSwap(blockchainConnection, action)
    expect(result).toBe(bolt11)
    expect(blockchainConnection.executeTransaction).not.toHaveBeenCalled()
  })
  test('execute transaction on EVM-NATIVE-PAYMENT', async () => {
    txMock.executeTransaction.mockImplementation(async () => Promise.resolve({ txHash: 'a hash' }))
    const action: SwapAction = {
      requiresClaim: false,
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
    expect(blockchainConnection.executeTransaction).toHaveBeenCalledWith(action.data)
  })

  test('execute transaction on CONTRACT-INTERACTION', async () => {
    txMock.executeTransaction.mockImplementation(async () => Promise.resolve({ txHash: 'a hash' }))
    const action: SwapAction = {
      requiresClaim: false,
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
    expect(blockchainConnection.executeTransaction).toHaveBeenCalledWith(action.data)
  })

  test('fail if the tx to execute is not an object', async () => {
    txMock.executeTransaction.mockImplementation(async () => Promise.resolve({ txHash: 'a hash' }))
    const action: SwapAction = {
      requiresClaim: false,
      type: 'EVM-NATIVE-PAYMENT',
      data: 'bip21 by mistake'
    }
    await expect(executeSwap(blockchainConnection, action)).rejects.toThrow('Received a wrong value to execute an EVM transaction: "bip21 by mistake"')
  })

  test('execute transaction on ERC20-PAYMENT', async () => {
    txMock.executeTransaction.mockImplementation(async () => Promise.resolve({ txHash: 'a hash' }))
    const action: SwapAction = {
      requiresClaim: false,
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
    expect(blockchainConnection.executeTransaction).toHaveBeenCalledWith(action.data)
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
