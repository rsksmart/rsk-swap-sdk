import { deepFreeze } from '@rsksmart/bridges-core-sdk'

/** A contract a provider's swap transaction may target, with the address its token approvals are granted to. */
export interface ProviderRouter {
  router: string
  spender: string
}

/** Contracts each provider's swap transaction may target, by EVM chain id. */
export const PROVIDER_ROUTERS: Readonly<Record<string, Readonly<Record<string, readonly ProviderRouter[]>>>> = deepFreeze({
  LIFI: {
    1: [{ router: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE', spender: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE' }],
    30: [{ router: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE', spender: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE' }],
    56: [{ router: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE', spender: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE' }]
  },
  SYMBIOSIS: {
    1: [{ router: '0xB4769e9c5bE31199a25ecD1B0C6609183fa72521', spender: '0xB4769e9c5bE31199a25ecD1B0C6609183fa72521' }],
    30: [
      { router: '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421', spender: '0x7f6fb9f3ce785F3d85772c038Fda58eC9432D421' },
      { router: '0x7057ab3fb2bee9c18e0cde4240de4ff7f159e365', spender: '0xfffdb2a69abcbbf55ecb2f6b348e0bd3d0f9f2e1' }
    ]
  }
})

/** Symbol of the native currency of each EVM chain, by chain id. */
export const NATIVE_CURRENCY: Readonly<Record<string, string>> = deepFreeze({
  1: 'ETH',
  30: 'RBTC',
  56: 'BNB'
})

/** Maximum native amount, in wei, a swap transaction may carry on top of the swapped amount, by EVM chain id. */
export const NATIVE_FEE_ALLOWANCE: Readonly<Record<string, string>> = deepFreeze({
  1: '20000000000000000',
  30: '1000000000000000',
  56: '20000000000000000'
})
