import { BridgeError } from '@rsksmart/bridges-core-sdk'
import { type Swap } from '../index'

export class RskSwapError extends BridgeError {
  static withCause (cause: string, swap?: Swap): RskSwapError {
    return new RskSwapError({
      timestamp: Date.now(),
      recoverable: true,
      message: 'Swap error',
      details: { cause, swap }
    })
  }

  static untrustedAddress (swap: Swap): RskSwapError {
    return new RskSwapError({
      timestamp: Date.now(),
      recoverable: true,
      message: 'Untrusted destination address',
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
      message: 'Unexpected contract content',
      details: {
        cause: `Code found at address ${address} doesn't match expected code`,
        address
      }
    })
  }
}
