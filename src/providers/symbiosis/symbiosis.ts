import { ethers, assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type Swap, type CreateSwapResult } from '../../api'
import { type SwapAction, type ProviderContext, type SwapProviderClient } from '../../providers/types'
import { RskSwapError } from '../../error/error'
import { validateEvmSwapTransaction } from '../evmTransaction'
import { type CreateSwapArgs } from '../../sdk/createSwap'
import { createApprovalHandler } from '../approval'
import { type Network } from 'bitcoinjs-lib'
import { buildBip21Uri } from '../../utils/bip21'
import { BTC_DECIMALS, type PinnedToken } from '../../constants/tokens'

export interface SymbiosisEvmContext {
  chainId: number
  to: string
  from: string
  data: string
  value: string
  gasLimit?: string
  approveTo?: string
  tokenAddress?: string
  approveAmount?: string
}

export interface SymbiosisBtcContext {
  depositAddress: string
  expiresAt: string
}

export type SymbiosisContext =
  | SymbiosisEvmContext
  | SymbiosisBtcContext

/** {@link SwapProviderClient} implementation for Symbiosis. It only implements the required contract methods; for EVM contract-interaction swaps that need an ERC20 approval, it attaches an approval step via `executePreSteps`. */
export class SymbiosisClient implements SwapProviderClient {
  constructor (private readonly bitcoinNetwork: Network) {}

  createContext (_args: CreateSwapArgs): ProviderContext {
    return {
      publicContext: {},
      secretContext: {}
    }
  }

  async validateAddress (_swap: Swap): Promise<boolean> {
    return Promise.resolve(true)
  }

  async generateAction (createdSwap: CreateSwapResult, tokenInfo: PinnedToken): Promise<SwapAction> {
    const { swap, actionType } = createdSwap

    switch (actionType) {
      case 'BIP21': {
        const { publicContext: context } = swap.context as { publicContext: SymbiosisBtcContext }
        assertTruthy(context.depositAddress, 'Missing deposit address in Symbiosis swap context')
        return {
          type: actionType,
          data: buildBip21Uri({ address: context.depositAddress, amountInDecimal: ethers.utils.formatUnits(swap.fromAmount, BTC_DECIMALS) }, this.bitcoinNetwork)
        }
      }
      case 'CONTRACT-INTERACTION': {
        const { publicContext: context } = swap.context as { publicContext: SymbiosisEvmContext }
        assertTruthy(context?.to, 'Missing "to" address in Symbiosis swap context')
        assertTruthy(context?.data, 'Missing transaction data in Symbiosis swap context')
        const value = context.value === '0' ? '0x0' : context.value
        const spender = validateEvmSwapTransaction('SYMBIOSIS', swap, tokenInfo, { to: context.to, value, chainId: context.chainId })

        const action: SwapAction = {
          type: actionType,
          data: {
            to: context.to.toLowerCase(),
            data: context.data,
            value
          },
          chainId: Number(swap.fromNetwork)
        }

        if (context.approveTo) {
          const contextTokenAddress = context.tokenAddress
          const pinnedTokenAddress = tokenInfo.address
          assertTruthy(contextTokenAddress, `Token address not found in context for ${swap.fromToken}`)
          assertTruthy(pinnedTokenAddress, `Token address not found for ${swap.fromToken} on ${swap.fromNetwork}`)
          assertTruthy(
            contextTokenAddress.toLowerCase() === pinnedTokenAddress.toLowerCase(),
            `Token address mismatch: context=${contextTokenAddress}, expected=${pinnedTokenAddress}`
          )

          if (context.approveTo.toLowerCase() !== spender.toLowerCase()) {
            throw RskSwapError.untrustedAddress(swap)
          }
          const approveAmount = ethers.BigNumber.from(context.approveAmount ?? swap.fromAmount.toString())
          if (approveAmount.gt(swap.fromAmount.toString())) {
            throw RskSwapError.invalidApiResponse({ fromAmount: swap.fromAmount.toString() }, { approveAmount: context.approveAmount })
          }

          action.executePreSteps = createApprovalHandler({
            tokenAddress: contextTokenAddress,
            spender,
            amount: approveAmount.toString(),
            transferAmount: swap.fromAmount.toString()
          })
        }

        return action
      }
      default:
        throw new Error(`Action type ${actionType} not supported for Symbiosis`)
    }
  }
}
