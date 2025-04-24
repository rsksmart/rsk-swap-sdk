import { assertTruthy, ethers } from '@rsksmart/bridges-core-sdk'
import { decode } from 'bolt11'
import { type CreateSwapResult, type Swap } from '../../api'
import { PAYMENT_TAG_NAME } from '../../constants/validation'
import { type ProviderContext, type SwapAction } from '../types'
import { type BoltzReverseSwapContext } from './boltz'
import { type BoltzAtomicSwap } from './types'

export class ReverseSwap implements BoltzAtomicSwap {
  private static readonly PREIMAGE_LENGTH = 32
  createContext (): ProviderContext {
    const preimage = ethers.utils.randomBytes(ReverseSwap.PREIMAGE_LENGTH)
    const preimageHash = ethers.utils.sha256(preimage)
    return {
      publicContext: {
        preimageHash: preimageHash.slice(2)
      },
      secretContext: {
        preimage: ethers.utils.hexlify(preimage).slice(2)
      }
    }
  }

  async validateAddress (swap: Swap): Promise<boolean> {
    const decodedInvoice = decode(swap.paymentAddress)
    const context = swap.context as BoltzReverseSwapContext
    assertTruthy(context?.publicContext?.preimageHash, 'Missing preimage hash in swap context')
    const preimageHash = decodedInvoice.tags.find(tag => tag.tagName === PAYMENT_TAG_NAME)
    const expectedHash = context.publicContext.preimageHash
    assertTruthy(preimageHash?.data, 'The invoice does not contain a payment hash')
    assertTruthy(expectedHash, 'The swap does not contain a preimage hash')
    return Promise.resolve(preimageHash.data === expectedHash)
  }

  async generateAction (createdSwap: CreateSwapResult): Promise<SwapAction> {
    return {
      type: 'BOLT11',
      data: createdSwap.swap.paymentAddress.toUpperCase(),
      requiresClaim: true
    }
  }
}
