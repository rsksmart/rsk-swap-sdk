import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type SwapProviderClient, type ProviderContext, type SwapAction, type TxData } from '../types'
import { type CreateSwapArgs } from '../../sdk/createSwap'
import { type CreateSwapResult, type Swap } from '../../api'
import { createApprovalHandler } from '../approval'
import { validateEvmSwapTransaction } from '../evmTransaction'
import { type PinnedToken } from '../../constants/tokens'

/** {@link SwapProviderClient} implementation for LI.FI. It only implements the required contract methods; for ERC20 payments it attaches an approval step via `executePreSteps`. */
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

  async generateAction (createdSwap: CreateSwapResult, fromToken: PinnedToken): Promise<SwapAction> {
    const { swap, actionType } = createdSwap
    switch (actionType) {
      case 'ERC20-PAYMENT':
      case 'EVM-NATIVE-PAYMENT': {
        const context = swap.context as { publicContext: TxData & { chainId?: number } }
        assertTruthy(context?.publicContext?.to, 'Missing to in LI.FI swap context')
        assertTruthy(context?.publicContext?.data, 'Missing data in LI.FI swap context')
        assertTruthy(context?.publicContext?.value, 'Missing value in LI.FI swap context')
        const { to, data, value, chainId } = context.publicContext
        const spender = validateEvmSwapTransaction('LIFI', swap, fromToken, { to, value, chainId })
        if (swap.paymentAddress && swap.paymentAddress.toLowerCase() !== to.toLowerCase()) {
          throw new Error(`LI.FI payment address mismatch: ${swap.paymentAddress} !== ${to}`)
        }
        // ethers only accepts EIP-55 addresses
        const action: SwapAction = { type: actionType, data: { to: to.toLowerCase(), data, value }, chainId: Number(swap.fromNetwork) }
        if (actionType === 'ERC20-PAYMENT') {
          const tokenAddress = fromToken.address
          assertTruthy(tokenAddress, `Token ${swap.fromToken} is not available on ${swap.fromNetwork}`)
          action.executePreSteps = createApprovalHandler({
            tokenAddress,
            spender,
            amount: swap.fromAmount.toString(),
            transferAmount: swap.fromAmount.toString()
          })
        }
        return action
      }
      default:
        throw new Error(`Action type ${actionType} not supported for LI.FI`)
    }
  }
}
