import { ethers, assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type SwapProviderClient, type ProviderContext, type SwapAction, type TxData } from '../types'
import { type CreateSwapArgs } from '../../sdk/createSwap'
import { type CreateSwapResult, type Swap } from '../../api'

export class LiFiClient implements SwapProviderClient {
  createContext (_args: CreateSwapArgs): ProviderContext {
    return {
      publicContext: {},
      secretContext: {}
    }
  }

  async validateAddress (_swap: Swap): Promise<boolean> {
    return Promise.resolve(true)
  }

  async generateAction (createdSwap: CreateSwapResult): Promise<SwapAction> {
    const { swap, actionType } = createdSwap
    switch (actionType) {
      case 'ERC20-PAYMENT':
      case 'EVM-NATIVE-PAYMENT': {
        const context = swap.context as { publicContext: TxData }
        assertTruthy(context?.publicContext?.to, 'Missing to in LI.FI swap context')
        assertTruthy(context?.publicContext?.data, 'Missing data in LI.FI swap context')
        assertTruthy(context?.publicContext?.value, 'Missing value in LI.FI swap context')
        const { to, data, value } = context.publicContext
        if (swap.paymentAddress && ethers.utils.getAddress(swap.paymentAddress) !== ethers.utils.getAddress(to)) {
          throw new Error(`LI.FI payment address mismatch: ${swap.paymentAddress} !== ${to}`)
        }
        return { type: actionType, data: { to, data, value }, requiresClaim: false }
      }
      default:
        throw new Error(`Action type ${actionType} not supported for LI.FI`)
    }
  }
}
