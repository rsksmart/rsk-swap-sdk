import { type HttpClient, ethers, assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type Swap, type Token, type CreateSwapResult, Routes } from '../../api'
import { type SwapAction, type ProviderContext, type SwapProviderClient } from '../../providers/types'
import { type CreateSwapArgs } from '../../sdk/createSwap'
import { createApprovalHandler } from './approval'

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

export class SymbiosisClient implements SwapProviderClient {
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
    const tokenInfo = await this.httpClient.get<Token>(this.apiUrl + Routes.getToken + swap.fromToken)

    switch (actionType) {
      case 'BIP21': {
        const context = swap.context as SymbiosisBtcContext
        assertTruthy(context.depositAddress, 'Missing deposit address in Symbiosis swap context')
        return {
          type: actionType,
          data: `bitcoin:${context.depositAddress}?amount=${ethers.utils.formatUnits(swap.fromAmount, tokenInfo.decimals)}`,
          requiresClaim: false
        }
      }
      case 'CONTRACT-INTERACTION': {
        const { publicContext: context } = swap.context as { publicContext: SymbiosisEvmContext }
        assertTruthy(context?.to, 'Missing "to" address in Symbiosis swap context')
        assertTruthy(context?.data, 'Missing transaction data in Symbiosis swap context')

        const action: SwapAction = {
          type: actionType,
          data: {
            to: context.to,
            data: context.data,
            value: context.value === '0' ? '0x0' : context.value
          },
          requiresClaim: false
        }

        if (context.approveTo) {
          const contextTokenAddress = context.tokenAddress
          const apiTokenAddress = tokenInfo.addresses?.[swap.fromNetwork]
          assertTruthy(contextTokenAddress, `Token address not found in context for ${swap.fromToken}`)
          assertTruthy(apiTokenAddress, `Token address not found in API for ${swap.fromToken} on ${swap.fromNetwork}`)
          assertTruthy(
            contextTokenAddress.toLowerCase() === apiTokenAddress.toLowerCase(),
            `Token address mismatch: context=${contextTokenAddress}, api=${apiTokenAddress}`
          )

          action.executePreSteps = createApprovalHandler({
            tokenAddress: contextTokenAddress,
            spender: context.approveTo,
            amount: context.approveAmount ?? swap.fromAmount.toString()
          })
        }

        return action
      }
      default:
        throw new Error(`Action type ${actionType} not supported for Symbiosis`)
    }
  }
}
