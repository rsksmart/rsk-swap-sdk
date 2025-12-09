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
    if (actionType !== 'ERC20-PAYMENT' && actionType !== 'EVM-NATIVE-PAYMENT') {
      throw new Error(`Action type ${actionType} not supported for LI.FI`)
    }
    // TODO: validate by decoding data with ethers and contract interface or calling LIFI API /calldata/parse (beta endpoint)
    const data = swap.context as TxData
    return {
      type: actionType,
      data,
      requiresClaim: false
    }
  }
}
