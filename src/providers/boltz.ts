import { assertTruthy, ethers, validateRequiredFields, type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { type CreateSwapResult, type Swap } from '../api'
import { decode } from 'bolt11'
import { type SwapAction, type TxData } from '../providers/types'
import { type ProviderContext, type SwapProviderClient } from './types'
import { VALIDATION_CONSTANTS } from '../constants/validation'
import { validateContractCode } from '../utils/validation'
import { BOLTZ_ETHER_SWAP_ABI } from '../constants/abi'
import { type RskSwapEnvironmentName } from '../constants/environment'
import { type CreateSwapArgs } from '../sdk/createSwap'

export interface BoltzProviderContext {
  publicContext: {
    preimageHash: string
    timeoutBlockHeight: number
    onchainAmount: bigint
    lockupAddress: string
    refundAddress: string
  }
  secretContext: {
    preimage: string
  }
}

export class BoltzClient implements SwapProviderClient {
  private readonly paymentTagName = 'payment_hash'
  private readonly ETHER_SWAP_INTERFACE = new ethers.utils.Interface(BOLTZ_ETHER_SWAP_ABI)

  constructor (
    private readonly network: RskSwapEnvironmentName,
    private readonly connection: BlockchainConnection
  ) {}

  createContext (_args: CreateSwapArgs): ProviderContext {
    const preimage = ethers.utils.randomBytes(32)
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

  validateAddress (swap: Swap): boolean {
    const decodedInvoice = decode(swap.paymentAddress)
    const context = swap.context as BoltzProviderContext
    assertTruthy(context?.publicContext?.preimageHash, 'Missing preimage hash in swap context')
    const preimageHash = decodedInvoice.tags.find(tag => tag.tagName === this.paymentTagName)
    const expectedHash = context.publicContext.preimageHash
    assertTruthy(preimageHash?.data, 'The invoice does not contain a payment hash')
    assertTruthy(expectedHash, 'The swap does not contain a preimage hash')
    return preimageHash.data === expectedHash
  }

  async generateAction (createdSwap: CreateSwapResult): Promise<SwapAction> {
    return {
      type: 'BOLT11',
      data: createdSwap.swap.paymentAddress.toUpperCase(),
      requiresClaim: true
    }
  }

  async buildClaimTransaction (swap: Swap): Promise<TxData> {
    const context = swap.context as BoltzProviderContext
    validateRequiredFields(context, 'publicContext', 'secretContext')
    validateRequiredFields(context.publicContext, 'lockupAddress', 'onchainAmount', 'refundAddress', 'timeoutBlockHeight')
    validateRequiredFields(context.secretContext, 'preimage')
    const lockupAddress = context.publicContext.lockupAddress.toLowerCase()
    const validationInfo = VALIDATION_CONSTANTS.boltz
    const expectedHash = this.network === 'Mainnet' ? validationInfo.mainnet.etherSwapBytecodeHash : validationInfo.testnet.etherSwapBytecodeHash
    await validateContractCode(this.connection, lockupAddress, expectedHash)
    const preimage = context.secretContext.preimage
    const publicContext = context.publicContext
    return {
      to: lockupAddress,
      data: this.ETHER_SWAP_INTERFACE.encodeFunctionData(
        'claim',
        [
          '0x' + preimage,
          BigInt(publicContext.onchainAmount) * BigInt(10 ** 10),
          swap.receiverAddress.toLowerCase(),
          publicContext.refundAddress.toLowerCase(),
          publicContext.timeoutBlockHeight
        ]
      ),
      value: '0x0'
    }
  }
}
