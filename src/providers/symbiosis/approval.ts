import { assertTruthy, type BlockchainConnection, ethers } from '@rsksmart/bridges-core-sdk'

const ERC20_INTERFACE = new ethers.utils.Interface([
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)'
])

interface ApprovalParams {
  tokenAddress: string
  spender: string
  amount: string
}

function isSigner (abstraction: ethers.providers.Provider | ethers.Signer): abstraction is ethers.Signer {
  return 'getAddress' in abstraction && typeof abstraction.getAddress === 'function'
}

export function createApprovalHandler (params: ApprovalParams): (connection: BlockchainConnection) => Promise<void> {
  const { tokenAddress, spender, amount } = params

  return async (connection: BlockchainConnection): Promise<void> => {
    const abstraction = connection.getAbstraction()
    if (!isSigner(abstraction)) {
      throw new Error('Connection must be a signer to execute approval')
    }

    const provider = abstraction.provider
    assertTruthy(provider, 'Signer must have a provider to check allowance')

    const userAddress = await abstraction.getAddress()
    const requiredAmount = ethers.BigNumber.from(amount)
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_INTERFACE, provider)

    const currentAllowance: ethers.BigNumber = await tokenContract.allowance(userAddress, spender)
    if (currentAllowance.gte(requiredAmount)) {
      return
    }

    const approveData = ERC20_INTERFACE.encodeFunctionData('approve', [spender, ethers.constants.MaxUint256])
    await connection.executeTransaction({
      to: tokenAddress,
      data: approveData,
      value: '0x0'
    })
  }
}
