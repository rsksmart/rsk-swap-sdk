import { deepFreeze } from '@rsksmart/bridges-core-sdk'

export interface RskSwapErrorCode {
  code: string
  description: string
}

export const RSK_SWAP_ERROR_CODES = deepFreeze({
  UNTRUSTED_ADDRESS: {
    code: 'RskSwap-SDK-001',
    description: 'Untrusted destination address'
  },
  UNEXPECTED_BYTECODE: {
    code: 'RskSwap-SDK-002',
    description: 'Unexpected contract content'
  },
  MANIPULATED_API_RESPONSE: {
    code: 'RskSwap-SDK-003',
    description: "The result returned with the API doesn't match with the request"
  },
  NOT_CLAIMABLE: {
    code: 'RskSwap-SDK-004',
    description: 'This swap does not require a claim'
  },
  UNSUPPORTED_ACTION: {
    code: 'RskSwap-SDK-005',
    description: 'Unsupported action type'
  }
} as const)
