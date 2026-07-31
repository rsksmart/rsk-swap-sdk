import { ethers, assertTruthy, type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type SwapProviderClient, type ProviderContext, type SwapAction, type TxData } from '../types'
import { type CreateSwapArgs } from '../../sdk/createSwap'
import { type CreateSwapResult, type Swap, type Token, Routes } from '../../api'
import { createApprovalHandler } from '../symbiosis/approval'

/** {@link SwapProviderClient} implementation for LI.FI. Its swaps never require a claim, so it only implements the required contract methods; for ERC20 payments it attaches an approval step via `executePreSteps`. */
export class LiFiClient implements SwapProviderClient {
  constructor (
    private readonly apiUrl: string,
    private readonly httpClient: HttpClient
  ) {}

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
        const action: SwapAction = { type: actionType, data: { to, data, value }, requiresClaim: false }
        if (actionType === 'ERC20-PAYMENT') {
          const tokenInfo = await this.httpClient.get<Token>(this.apiUrl + Routes.getToken + swap.fromToken)
          const tokenAddress = tokenInfo.addresses[swap.fromNetwork]
          assertTruthy(tokenAddress, `Token ${tokenInfo.symbol} is not available on ${swap.fromNetwork}`)
          action.executePreSteps = createApprovalHandler({
            tokenAddress,
            spender: to,
            amount: swap.fromAmount.toString()
          })
        }
        return action
      }
      default:
        throw new Error(`Action type ${actionType} not supported for LI.FI`)
    }
  }
}
