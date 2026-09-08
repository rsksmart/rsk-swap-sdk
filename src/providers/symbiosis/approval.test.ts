import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import { type BlockchainConnection, ethers } from '@rsksmart/bridges-core-sdk'
import { RskSwapError } from '../../error/error'
import { RSK_SWAP_ERROR_CODES } from '../../error/codes'
import { createApprovalHandler } from './approval'

const BALANCE_OF = '0x70a08231'
const ALLOWANCE = '0xdd62ed3e'

describe('createApprovalHandler should', () => {
  const user = '0x9d93929a9099be4355fc2389fbf253982f9df47c'
  const tokenAddress = '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5'
  const spender = '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE'
  const amount = ethers.utils.parseUnits('1', 18)

  let balance: ethers.BigNumber
  let allowance: ethers.BigNumber
  let executeTransaction: jest.Mock<BlockchainConnection['executeTransaction']>
  let connection: BlockchainConnection

  const encode = (value: ethers.BigNumber): string => ethers.utils.defaultAbiCoder.encode(['uint256'], [value])

  beforeEach(() => {
    balance = amount
    allowance = ethers.BigNumber.from(0)
    const provider: unknown = {
      _isProvider: true,
      resolveName: async (name: string) => name,
      call: async (tx: { data: string }) => {
        if (tx.data.startsWith(BALANCE_OF)) return encode(balance)
        if (tx.data.startsWith(ALLOWANCE)) return encode(allowance)
        throw new Error(`unexpected call ${tx.data}`)
      }
    }
    const signer: unknown = { getAddress: async () => user, provider }
    executeTransaction = jest.fn<BlockchainConnection['executeTransaction']>()
      .mockResolvedValue({ txHash: '0x01', successful: true })
    connection = {
      getAbstraction: () => signer,
      executeTransaction
    } as unknown as BlockchainConnection
  })

  const handler = (): Promise<void> => createApprovalHandler({ tokenAddress, spender, amount: amount.toString() })(connection)

  test('reject with INSUFFICIENT_BALANCE before requesting any approval when the balance is too low', async () => {
    balance = amount.sub(1)

    const promise = handler()

    await expect(promise).rejects.toBeInstanceOf(RskSwapError)
    await expect(promise).rejects.toMatchObject({ code: RSK_SWAP_ERROR_CODES.INSUFFICIENT_BALANCE.code })
    expect(executeTransaction).not.toHaveBeenCalled()
  })

  test('send an approve transaction when the balance covers the amount but the allowance does not', async () => {
    await handler()

    expect(executeTransaction).toHaveBeenCalledTimes(1)
    expect(executeTransaction).toHaveBeenCalledWith(expect.objectContaining({ to: tokenAddress, value: '0x0' }))
  })

  test('skip the approval when the allowance already covers the amount', async () => {
    allowance = amount

    await handler()

    expect(executeTransaction).not.toHaveBeenCalled()
  })
})
