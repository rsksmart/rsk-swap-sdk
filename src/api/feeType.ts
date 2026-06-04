import type { FeeDTO } from './bindings/data-contracts'

export const FeeType = {
  PERCENTAGE_BOLTZ_FEE: 'PERCENTAGE_BOLTZ_FEE',
  FIXED_MINER_FEE: 'FIXED_MINER_FEE',
  FIXED_DESTINATION_NETWORK_FEE: 'FIXED_DESTINATION_NETWORK_FEE',
  FIXED_CHANGELLY_FEE: 'FIXED_CHANGELLY_FEE',
  FIXED_GAS_FEE: 'FIXED_GAS_FEE',
  FIXED_LIFI_PROVIDER_FEE: 'FIXED_LIFI_PROVIDER_FEE',
  FIXED_NETWORK_FEE: 'FIXED_NETWORK_FEE',
  FIXED_SERVICE_FEE: 'FIXED_SERVICE_FEE',
  FIXED_MOCK_FEE: 'FIXED_MOCK_FEE'
} as const satisfies Record<FeeDTO['type'], FeeDTO['type']>

export type FeeType = FeeDTO['type']

export const isPercentageFee = (t: FeeType): boolean =>
  t === FeeType.PERCENTAGE_BOLTZ_FEE

const NETWORK_FEE_TYPES: ReadonlySet<FeeType> = new Set<FeeType>([
  FeeType.FIXED_MINER_FEE,
  FeeType.FIXED_DESTINATION_NETWORK_FEE,
  FeeType.FIXED_GAS_FEE,
  FeeType.FIXED_NETWORK_FEE
])

export const isNetworkFee = (t: FeeType): boolean => NETWORK_FEE_TYPES.has(t)
