import { ethers } from '@rsksmart/bridges-core-sdk'
import { type Swap } from '../api'
import { NATIVE_CURRENCY, NATIVE_FEE_ALLOWANCE, PROVIDER_ROUTERS } from '../constants/routers'
import { RskSwapError } from '../error/error'

interface EvmSwapTransaction {
  to: string
  value?: string
  chainId?: number | string
}

/**
 * Checks a provider-built EVM transaction against the provider's routers and the swap's origin chain.
 * @returns The address token approvals for this transaction must be granted to
 * @throws {RskSwapError} UNTRUSTED_ADDRESS if the transaction target is not one of the provider's routers
 * @throws {RskSwapError} MANIPULATED_API_RESPONSE if the transaction chain or value does not match the swap
 */
export function validateEvmSwapTransaction (providerId: string, swap: Swap, tx: EvmSwapTransaction): string {
  const route = PROVIDER_ROUTERS[providerId]?.[swap.fromNetwork]?.find(({ router }) => router.toLowerCase() === tx.to.toLowerCase())
  const feeAllowance = NATIVE_FEE_ALLOWANCE[swap.fromNetwork]
  if (!route || feeAllowance === undefined) {
    throw RskSwapError.untrustedAddress(swap)
  }
  if (tx.chainId === undefined || tx.chainId.toString() !== swap.fromNetwork) {
    throw RskSwapError.invalidApiResponse({ fromNetwork: swap.fromNetwork }, { chainId: tx.chainId })
  }
  const isNativePayment = NATIVE_CURRENCY[swap.fromNetwork] === swap.fromToken
  const maxValue = ethers.BigNumber.from(feeAllowance).add(isNativePayment ? swap.fromAmount.toString() : 0)
  if (ethers.BigNumber.from(tx.value || '0').gt(maxValue)) {
    throw RskSwapError.invalidApiResponse({ maxValue: maxValue.toString() }, { value: tx.value })
  }
  return route.spender
}
