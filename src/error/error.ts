import { BridgeError, type ErrorDetails } from '@rsksmart/bridges-core-sdk'
import { type Swap } from '../index'
import { RSK_SWAP_ERROR_CODES, type RskSwapErrorCode } from './codes'
import { type SwapWithAction, type SwapAction } from '../providers/types'

export class RskSwapError extends BridgeError {
  private readonly _code: string

  constructor (args: ErrorDetails & { code: string }) {
    super(args)
    this._code = args.code
  }

  get code (): string {
    return this._code
  }

  static withCause (errorCode: RskSwapErrorCode, swap?: Swap | SwapWithAction): RskSwapError {
    return new RskSwapError({
      timestamp: Date.now(),
      recoverable: true,
      message: errorCode.description,
      code: errorCode.code,
      details: { swap }
    })
  }

  static untrustedAddress (swap: Swap): RskSwapError {
    return new RskSwapError({
      timestamp: Date.now(),
      recoverable: true,
      message: RSK_SWAP_ERROR_CODES.UNTRUSTED_ADDRESS.description,
      code: RSK_SWAP_ERROR_CODES.UNTRUSTED_ADDRESS.code,
      details: {
        cause: `Address returned by the server (${swap.paymentAddress}) does not meet the requirements for the client to consider it as valid`,
        swap
      }
    })
  }

  static unexpectedContract (address: string): RskSwapError {
    return new RskSwapError({
      timestamp: Date.now(),
      recoverable: true,
      message: RSK_SWAP_ERROR_CODES.UNEXPECTED_BYTECODE.description,
      code: RSK_SWAP_ERROR_CODES.UNEXPECTED_BYTECODE.code,
      details: {
        cause: `Code found at address ${address} doesn't match expected code`,
        address
      }
    })
  }

  static invalidApiResponse (request: unknown, response: unknown): RskSwapError {
    return new RskSwapError({
      timestamp: Date.now(),
      recoverable: true,
      message: RSK_SWAP_ERROR_CODES.MANIPULATED_API_RESPONSE.description,
      code: RSK_SWAP_ERROR_CODES.MANIPULATED_API_RESPONSE.code,
      details: { request, response }
    })
  }

  static unsupportedAction (action: SwapAction): RskSwapError {
    return new RskSwapError({
      timestamp: Date.now(),
      recoverable: true,
      message: RSK_SWAP_ERROR_CODES.UNSUPPORTED_ACTION.description,
      code: RSK_SWAP_ERROR_CODES.UNSUPPORTED_ACTION.code,
      details: { action }
    })
  }
}
