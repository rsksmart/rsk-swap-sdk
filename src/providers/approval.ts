import { assertTruthy, type BlockchainConnection, ethers } from '@rsksmart/bridges-core-sdk'
import { RskSwapError } from '../error/error'
import { RSK_SWAP_ERROR_CODES } from '../error/codes'

const ERC20_INTERFACE = new ethers.utils.Interface([
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function balanceOf(address owner) public view returns (uint256)'
])

interface ApprovalParams {
  tokenAddress: string
  spender: string
  amount: string
  transferAmount: string
}

function isSigner(abstraction: ethers.providers.Provider | ethers.Signer): abstraction is ethers.Signer {
  return 'getAddress' in abstraction && typeof abstraction.getAddress === 'function'
}

export function createApprovalHandler(params: ApprovalParams): (connection: BlockchainConnection) => Promise<void> {
  const { tokenAddress, spender, amount, transferAmount } = params

  return async (connection: BlockchainConnection): Promise<void> => {
    const abstraction = connection.getAbstraction()
    if (!isSigner(abstraction)) {
      throw new Error('Connection must be a signer to execute approval')
    }

    const provider = abstraction.provider
    assertTruthy(provider, 'Signer must have a provider to check allowance')

    // ethers only accepts EIP-55 addresses
    const normalizedTokenAddress = tokenAddress.toLowerCase()
    const normalizedSpender = spender.toLowerCase()
    const userAddress = await abstraction.getAddress()
    const requiredAmount = ethers.BigNumber.from(amount)
    const tokenContract = new ethers.Contract(normalizedTokenAddress, ERC20_INTERFACE, provider)

    const balance: ethers.BigNumber = await tokenContract.balanceOf(userAddress)
    if (balance.lt(ethers.BigNumber.from(transferAmount))) throw RskSwapError.withCause(RSK_SWAP_ERROR_CODES.INSUFFICIENT_BALANCE)

    const currentAllowance: ethers.BigNumber = await tokenContract.allowance(userAddress, normalizedSpender)
    if (currentAllowance.gte(requiredAmount)) {
      return
    }

    const approveData = ERC20_INTERFACE.encodeFunctionData('approve', [normalizedSpender, requiredAmount])
    await connection.executeTransaction({
      to: normalizedTokenAddress,
      data: approveData,
      value: '0x0'
    })
  }
}
