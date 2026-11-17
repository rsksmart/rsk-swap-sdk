import { ethers, assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type Swap, type CreateSwapResult } from '../../api'
import { type SwapAction, type ProviderContext, type SwapProviderClient } from '../../providers/types'
import { type CreateSwapArgs } from '../../sdk/createSwap'
import { type Network } from 'bitcoinjs-lib'
import { buildBip21Uri } from '../../utils/bip21'
import { BTC_DECIMALS, type PinnedToken } from '../../constants/tokens'

/** {@link SwapProviderClient} implementation for Changelly. Its swaps never require a claim, so it only implements the required contract methods. */
export class ChangellyClient implements SwapProviderClient {
  private readonly ERC20_INTERFACE = new ethers.utils.Interface(['function transfer(address _to, uint _value) public'])
  constructor (private readonly bitcoinNetwork: Network) {}

  createContext (_args: CreateSwapArgs): ProviderContext {
    return {
      publicContext: {},
      secretContext: {}
    }
  }

  async validateAddress (_swap: Swap): Promise<boolean> {
    // Changelly returns only EOAs
    return Promise.resolve(true)
  }

  async generateAction (createdSwap: CreateSwapResult, tokenInfo: PinnedToken): Promise<SwapAction> {
    const { swap, actionType } = createdSwap
    switch (actionType) {
      case 'BIP21':
        return {
          type: actionType,
          data: buildBip21Uri({ address: swap.paymentAddress, amountInDecimal: ethers.utils.formatUnits(swap.fromAmount, BTC_DECIMALS) }, this.bitcoinNetwork),
          requiresClaim: false
        }
      case 'ERC20-PAYMENT': {
        const tokenAddress = tokenInfo.address
        assertTruthy(tokenAddress, `Token ${swap.fromToken} is not available on ${swap.fromNetwork}`)
        return {
          requiresClaim: false,
          type: actionType,
          data: {
            to: tokenAddress,
            data: this.ERC20_INTERFACE.encodeFunctionData('transfer', [
              swap.paymentAddress,
              swap.fromAmount
            ]),
            value: '0x0'
          }
        }
      }
      case 'EVM-NATIVE-PAYMENT':
        return {
          requiresClaim: false,
          type: actionType,
          data: {
            to: swap.paymentAddress,
            value: '0x' + swap.fromAmount.toString(16),
            data: '0x'
          }
        }
      default:
        throw new Error(`Action type ${actionType} not supported for Changelly`)
    }
  }
}
