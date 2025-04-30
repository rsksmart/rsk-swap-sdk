import { assertTruthy, type Connection } from '@rsksmart/bridges-core-sdk'
import { decode } from 'bolt11'
import { type CreatedSwap, type Swap } from '../../api'
import { BOLTZ_ETHER_SWAP_ABI } from '../../constants/abi'
import { type RskSwapEnvironmentName } from '../../constants/environment'
import { VALIDATION_CONSTANTS } from '../../constants/validation'
import { satToWei } from '../../utils/conversion'
import { validateContractCode } from '../../utils/validation'
import { type ProviderContext, type SwapAction } from '../types'
import { type ClaimDetails, type BoltzAtomicSwap, type BoltzSubmarineSwapContext } from './types'

export class SubmarineSwap implements BoltzAtomicSwap {
  constructor (
    private readonly network: RskSwapEnvironmentName,
    private readonly connection: Connection
  ) {}

  createContext (): ProviderContext {
    return { publicContext: {}, secretContext: {} }
  }

  async validateAddress (swap: Swap): Promise<boolean> {
    const validationInfo = VALIDATION_CONSTANTS.boltz
    const expectedHash = this.network === 'Mainnet' ? validationInfo.mainnet.etherSwapBytecodeHash : validationInfo.testnet.etherSwapBytecodeHash
    const isValid = await validateContractCode(this.connection, swap.paymentAddress, expectedHash)
    return isValid
  }

  async generateAction (createdSwap: CreatedSwap): Promise<SwapAction> {
    const decodedInvoice = decode(createdSwap.swap.receiverAddress)
    const paymentHash = decodedInvoice.tags.find(tag => tag.tagName === 'payment_hash')?.data.toString()
    assertTruthy(paymentHash, 'The invoice does not contain a payment hash')
    const context = createdSwap.swap.context as BoltzSubmarineSwapContext
    assertTruthy(context?.publicContext?.claimAddress, 'Missing claimAddress in swap context')
    assertTruthy(context?.publicContext?.expectedAmount, 'Missing expectedAmount in swap context')
    assertTruthy(context?.publicContext?.timeoutBlockHeight, 'Missing timeoutBlockHeight in swap context')

    return {
      type: 'CONTRACT-INTERACTION',
      data: {
        to: createdSwap.swap.paymentAddress,
        data: BOLTZ_ETHER_SWAP_ABI.encodeFunctionData(
          'lock',
          [
            '0x' + paymentHash,
            context.publicContext?.claimAddress.toLowerCase(),
            context.publicContext?.timeoutBlockHeight
          ]
        ),
        value: '0x' + satToWei(context.publicContext?.expectedAmount).toString(16)
      },
      requiresClaim: false
    }
  }

  getClaimDetails (_swap: Swap): ClaimDetails {
    throw new Error('ClaimDetails are only needed for claims in EVM. Not in Lightning Network.')
  }
}
