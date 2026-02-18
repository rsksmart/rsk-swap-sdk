import { type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { RskSwapError } from '../error/error'
import { type SwapAction } from '../providers/types'

export async function executeSwap (connection: BlockchainConnection, action: SwapAction): Promise<string> {
  switch (action.type) {
    case 'NONE':
      return ''
    case 'BIP21':
      return returnQrCodeData(action)
    case 'BOLT11':
      return returnQrCodeData(action)
    case 'EVM-NATIVE-PAYMENT':
      return executeEvmTransaction(connection, action)
    case 'ERC20-PAYMENT':
      return executeEvmTransaction(connection, action)
    case 'CONTRACT-INTERACTION':
      await action.executePreSteps?.(connection)
      return executeEvmTransaction(connection, action)
    default:
      throw RskSwapError.unsupportedAction(action)
  }
}

/**
 * Use this function if the action type is a string that should be shown as a QR code (BIP21, BOLT11)
 * @param action The action to execute
 * @returns The data to show in a QR code
 */
function returnQrCodeData (action: SwapAction): string {
  if (typeof action.data !== 'string') {
    throw new Error(`Received a wrong value to show in a QR code: ${JSON.stringify(action.data)}`)
  }
  return action.data
}

/**
 * Use this function if the action type is a transaction to be executed on the EVM
 * @param connection The connection to the blockchain to execute the transaction
 * @param action The action to execute
 * @returns The transaction hash of the executed transaction
 */
async function executeEvmTransaction (connection: BlockchainConnection, action: SwapAction): Promise<string> {
  if (typeof action.data !== 'object') {
    throw new Error(`Received a wrong value to execute an EVM transaction: ${JSON.stringify(action.data)}`)
  }
  const result = await connection.executeTransaction(action.data)
  return result.txHash
}
