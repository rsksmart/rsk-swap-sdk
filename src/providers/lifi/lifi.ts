import { ethers } from '@rsksmart/bridges-core-sdk'
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
    const { to, data, value } = (swap.context as { publicContext: TxData }).publicContext
    if (swap.paymentAddress && ethers.utils.getAddress(swap.paymentAddress) !== ethers.utils.getAddress(to)) {
      throw new Error(`LI.FI payment address mismatch: ${swap.paymentAddress} !== ${to}`)
    }
    return { type: actionType, data: { to, data, value }, requiresClaim: false }
  }
}
