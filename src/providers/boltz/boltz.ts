import { validateRequiredFields, type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { type CreateSwapResult, type Swap } from '../../api'
import { type SwapAction, type TxData } from '../../providers/types'
import { type ProviderContext, type SwapProviderClient } from '../types'
import { VALIDATION_CONSTANTS } from '../../constants/validation'
import { validateContractCode } from '../../utils/validation'
import { BOLTZ_ETHER_SWAP_ABI } from '../../constants/abi'
import { type RskSwapEnvironmentName } from '../../constants/environment'
import { type CreateSwapArgs } from '../../sdk/createSwap'
import { type BoltzAtomicSwap } from './types'
import { ReverseSwap } from './reverseSwap'
import { isBtcChain, isLightningNetwork, isRskChain } from '../../utils/chain'
import { RskSwapError } from '../../error/error'
import { satToWei } from '../../utils/conversion'
import { SubmarineSwap } from './submarineSwap'

export interface BoltzReverseSwapContext {
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

export interface BoltzSubmarineSwapContext {
  publicContext: {
    timeoutBlockHeight: number
    claimAddress: string
    expectedAmount: bigint | number
  }
  secretContext: unknown
}

export class BoltzClient implements SwapProviderClient {
  private readonly reverseSwap: ReverseSwap
  private readonly submarineSwap: SubmarineSwap

  constructor (
    private readonly network: RskSwapEnvironmentName,
    private readonly connection: BlockchainConnection
  ) {
    this.reverseSwap = new ReverseSwap()
    this.submarineSwap = new SubmarineSwap(network, connection)
  }

  private routeAtomicSwap (spec: { fromNetwork: string, toNetwork: string }): BoltzAtomicSwap {
    const { fromNetwork, toNetwork } = spec
    if (isLightningNetwork(fromNetwork) && isRskChain(toNetwork)) {
      return this.reverseSwap
    } else if (isRskChain(fromNetwork) && isLightningNetwork(toNetwork)) {
      return this.submarineSwap
    } else if (isBtcChain(fromNetwork) && isRskChain(toNetwork)) {
      return this.reverseSwap // TODO replace with chain swap in
    } else if (isRskChain(fromNetwork) && isBtcChain(toNetwork)) {
      return this.reverseSwap // TODO replace with chain swap out
    }
    throw new Error(`Unsupported swap from ${fromNetwork} to ${toNetwork}`)
  }

  createContext (args: CreateSwapArgs): ProviderContext {
    const swapType = this.routeAtomicSwap(args)
    return swapType.createContext()
  }

  async validateAddress (swap: Swap): Promise<boolean> {
    const swapType = this.routeAtomicSwap(swap)
    return swapType.validateAddress(swap)
  }

  async generateAction (createdSwap: CreateSwapResult): Promise<SwapAction> {
    const swapType = this.routeAtomicSwap(createdSwap.swap)
    return swapType.generateAction(createdSwap)
  }

  async buildClaimTransaction (swap: Swap): Promise<TxData> {
    // TODO we need to check if this is the same context for revere swap and chain swap when going to rsk to determine the specific type, the any is temporal
    const context = swap.context as any
    validateRequiredFields(context, 'publicContext', 'secretContext')
    validateRequiredFields(context.publicContext, 'lockupAddress', 'onchainAmount', 'refundAddress', 'timeoutBlockHeight')
    validateRequiredFields(context.secretContext, 'preimage')
    const lockupAddress = context.publicContext.lockupAddress.toLowerCase()
    const validationInfo = VALIDATION_CONSTANTS.boltz
    const expectedHash = this.network === 'Mainnet' ? validationInfo.mainnet.etherSwapBytecodeHash : validationInfo.testnet.etherSwapBytecodeHash
    const isValidContract = await validateContractCode(this.connection, lockupAddress, expectedHash)
    if (!isValidContract) {
      throw RskSwapError.unexpectedContract(lockupAddress)
    }
    const preimage = context.secretContext.preimage
    const publicContext = context.publicContext
    return {
      to: lockupAddress,
      data: BOLTZ_ETHER_SWAP_ABI.encodeFunctionData(
        'claim',
        [
          '0x' + preimage,
          satToWei(publicContext.onchainAmount),
          swap.receiverAddress.toLowerCase(),
          publicContext.refundAddress.toLowerCase(),
          publicContext.timeoutBlockHeight
        ]
      ),
      value: '0x0'
    }
  }
}
