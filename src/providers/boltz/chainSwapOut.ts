import { assertTruthy, type Connection, ethers } from '@rsksmart/bridges-core-sdk'
import { type Swap, type CreatedSwap } from '../../api'
import { type ProviderContext, type SwapAction } from '../types'
import { type BoltzAtomicSwap, type BoltzChainSwapOutContext, type ClaimDetails, PREIMAGE_LENGTH } from './types'
import { arrayToHexKey, satToWei } from '../../utils/conversion'
import { type ECPairAPI } from 'ecpair'
import { VALIDATION_CONSTANTS } from '../../constants/validation'
import { type RskSwapEnvironmentName } from '../../constants/environment'
import { validateContractCode } from '../../utils/validation'
import { BOLTZ_ETHER_SWAP_ABI } from '../../constants/abi'

export class ChainSwapOut implements BoltzAtomicSwap {
  constructor (
    private readonly network: RskSwapEnvironmentName,
    private readonly connection: Connection,
    private readonly keyFactory: ECPairAPI
  ) {}

  createContext (): ProviderContext {
    const preimage = ethers.utils.randomBytes(PREIMAGE_LENGTH)
    const preimageHash = ethers.utils.sha256(preimage)
    const keys = this.keyFactory.makeRandom()
    const privateKey = keys.privateKey
    assertTruthy(privateKey, 'Private key is undefined')
    return {
      publicContext: {
        preimageHash: preimageHash.slice(2),
        claimPublicKey: arrayToHexKey(keys.publicKey)
      },
      secretContext: {
        preimage: ethers.utils.hexlify(preimage).slice(2),
        claimPrivateKey: arrayToHexKey(privateKey)
      }
    }
  }

  async validateAddress (swap: Swap): Promise<boolean> {
    const validationInfo = VALIDATION_CONSTANTS.boltz
    const expectedHash = this.network === 'Mainnet' ? validationInfo.mainnet.etherSwapBytecodeHash : validationInfo.testnet.etherSwapBytecodeHash
    const isValid = await validateContractCode(this.connection, swap.paymentAddress, expectedHash)
    return isValid
  }

  async generateAction (createdSwap: CreatedSwap): Promise<SwapAction> {
    const context = createdSwap.swap.context as BoltzChainSwapOutContext

    assertTruthy(context.publicContext?.lockupDetails, 'Missing lockup details in swap')
    assertTruthy(context.publicContext?.preimageHash, 'Missing preimage hash in swap')
    const lockupDetails = context.publicContext.lockupDetails

    assertTruthy(lockupDetails?.claimAddress, 'Missing claimAddress in swap context')
    assertTruthy(lockupDetails?.amount, 'Missing amount in swap context')
    assertTruthy(lockupDetails?.timeoutBlockHeight, 'Missing timeoutBlockHeight in swap context')

    return {
      type: 'CONTRACT-INTERACTION',
      data: {
        to: createdSwap.swap.paymentAddress,
        data: BOLTZ_ETHER_SWAP_ABI.encodeFunctionData(
          'lock',
          [
            '0x' + context.publicContext.preimageHash,
            lockupDetails.claimAddress.toLowerCase(),
            lockupDetails.timeoutBlockHeight
          ]
        ),
        value: '0x' + satToWei(lockupDetails.amount).toString(16)
      },
      requiresClaim: true
    }
  }

  getClaimDetails (_swap: Swap): ClaimDetails {
    throw new Error('ClaimDetails are only needed for claims in EVM. Not in Bitcoin.')
  }
}
