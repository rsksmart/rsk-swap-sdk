import { assertTruthy, type BlockchainConnection, ethers } from '@rsksmart/bridges-core-sdk'
import { RskSwapError } from '../error/error'

export async function validateContractCode (connection: BlockchainConnection, address: string, expectedHash: string): Promise<void> {
  const bytecode = await connection.signer.provider?.getCode(address)
  assertTruthy(bytecode, `Contract not found at address ${address}`)
  const hash = ethers.utils.sha256(ethers.utils.hexlify(bytecode))
  if (hash !== expectedHash) {
    throw RskSwapError.unexpectedContract(address)
  }
}
