import { describe, expect, test, jest } from '@jest/globals'
import { type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { validateContractCode } from './validation'

describe('validateContractCode should', () => {
  test('not throw if the contract code is valid', async () => {
    const connectionMock: unknown = jest.mocked({
      getAbstraction: () => {
        return {
          provider: {
            getCode: async () => Promise.resolve('0xaabbcc')
          }
        }
      }
    })
    const hash = '0xfa22dfe1da9013b3c1145040acae9089e0c08bc1c1a0719614f4b73add6f6ef5'
    const address = '0x1a1b1c'
    await expect(validateContractCode(connectionMock as BlockchainConnection, address, hash)).resolves.not.toThrow()
  })
  test('throw if is unable to get the bytecode', async () => {
    const connectionMock: unknown = jest.mocked({ getAbstraction: () => { return { provider: { getCode: async () => Promise.resolve('') } } } })
    const hash = '0xfa22dfe1da9013b3c1145040acae9089e0c08bc1c1a0719614f4b73add6f6ef5'
    const address = '0x1a1b1c'
    await expect(validateContractCode(connectionMock as BlockchainConnection, address, hash))
      .rejects
      .toThrow('Contract not found at address 0x1a1b1c')
  })
  test('throw if bytecode hash does not match', async () => {
    const connectionMock: unknown = jest.mocked({
      getAbstraction: () => {
        return {
          getCode: async () => Promise.resolve('0xaabbcc')
        }
      }
    })
    const hash = '0xcdefab'
    const address = '0x1a1b1c'
    await expect(validateContractCode(connectionMock as BlockchainConnection, address, hash)).resolves.toBe(false)
  })
})
