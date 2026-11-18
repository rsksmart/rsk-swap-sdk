import { deepFreeze } from '@rsksmart/bridges-core-sdk'
import { type Token } from '../api'

export const BTC_DECIMALS = 8 as const
export const EVM_NATIVE_DECIMALS = 18 as const

/** A token the SDK accepts as the origin of a swap. */
export interface PinnedToken {
  type: Token['type']
  decimals: number
  /** Token contract on the network. Only set for `erc20` and `erc677` tokens. */
  address?: string
}

/** Tokens the SDK accepts as the origin of a swap, by network and symbol. */
export const TOKEN_REGISTRY: Readonly<Record<string, Readonly<Record<string, PinnedToken>>>> = deepFreeze({
  BTC: {
    BTC: { type: 'native-btc', decimals: BTC_DECIMALS }
  },
  1: {
    ETH: { type: 'native-evm', decimals: EVM_NATIVE_DECIMALS },
    USDC: { type: 'erc20', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    USDT: { type: 'erc20', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    WBTC: { type: 'erc20', decimals: 8, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
    WETH: { type: 'erc20', decimals: 18, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    DAI: { type: 'erc20', decimals: 18, address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' }
  },
  30: {
    RBTC: { type: 'native-evm', decimals: EVM_NATIVE_DECIMALS },
    RIF: { type: 'erc677', decimals: 18, address: '0x2AcC95758f8b5F583470ba265EB685a8F45fC9D5' },
    USDT0: { type: 'erc20', decimals: 6, address: '0x779Ded0c9e1022225f8E0630b35a9b54bE713736' },
    WETH: { type: 'erc20', decimals: 18, address: '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590' },
    WRBTC: { type: 'erc20', decimals: 18, address: '0x542fDA317318eBF1d3DEAf76E0b632741A7e677d' },
    USDRIF: { type: 'erc20', decimals: 18, address: '0x3A15461d8aE0F0Fb5Fa2629e9DA7D66A794a6e37' },
    DOC: { type: 'erc20', decimals: 18, address: '0xe700691dA7b9851F2F35f8b8182c69c53CcaD9Db' }
  },
  56: {
    BNB: { type: 'native-evm', decimals: EVM_NATIVE_DECIMALS },
    USDC: { type: 'erc20', decimals: 18, address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' }
  }
})
