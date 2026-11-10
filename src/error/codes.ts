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
  MANIPULATED_API_RESPONSE: {
    code: 'RskSwap-SDK-003',
    description: "The result returned with the API doesn't match with the request"
  },
  UNSUPPORTED_ACTION: {
    code: 'RskSwap-SDK-005',
    description: 'Unsupported action type'
  }
} as const)
