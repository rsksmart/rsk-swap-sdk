import { type HttpClient, ethers, assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type Swap, type Token, type CreateSwapResult, Routes } from '../../api'
import { type SwapAction, type ProviderContext, type SwapProviderClient } from '../../providers/types'
import { type CreateSwapArgs } from '../../sdk/createSwap'

export class ChangellyClient implements SwapProviderClient {
  private readonly ERC20_INTERFACE = new ethers.utils.Interface(['function transfer(address _to, uint _value) public'])
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
    // Changelly returns only EOAs
    return Promise.resolve(true)
  }

  async generateAction (createdSwap: CreateSwapResult): Promise<SwapAction> {
    const { swap, actionType } = createdSwap
    const tokenInfo = await this.httpClient.get<Token>(this.apiUrl + Routes.getToken + swap.fromToken)
    switch (actionType) {
      case 'BIP21':
        return {
          type: actionType,
          data: `bitcoin:${swap.paymentAddress}?amount=${ethers.utils.formatUnits(swap.fromAmount, tokenInfo.decimals)}`,
          requiresClaim: false
        }
      case 'ERC20-PAYMENT': {
        const tokenAddress = tokenInfo.addresses[swap.fromNetwork]
        assertTruthy(tokenAddress, `Token ${tokenInfo.symbol} is not available on ${swap.fromNetwork}`)
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
