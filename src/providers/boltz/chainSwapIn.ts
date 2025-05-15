import { type ClaimDetails, PREIMAGE_LENGTH, type BoltzAtomicSwap, type BoltzChainSwapInContext } from './types'
import { type CreatedSwap, type Swap } from '../../api'
import { type ProviderContext, type SwapAction } from '../types'
import { assertTruthy, ethers, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type ECPairAPI } from 'ecpair'
import { tapTweakHash, toHashTree } from 'bitcoinjs-lib/src/payments/bip341'
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371'
import { type RskSwapEnvironmentName } from '../../constants/environment'
import { networks, payments } from 'bitcoinjs-lib'
import { BTC_DECIMALS } from '../../constants/tokens'
import { arrayToHexKey } from '../../utils/conversion'
import { getSecp256k1 } from './secp256k1'
import { createWorkers } from '../../utils/workers'
import { type Taptree } from 'bitcoinjs-lib/src/types'

export class ChainSwapIn implements BoltzAtomicSwap {
  constructor (
    private readonly network: RskSwapEnvironmentName,
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
        refundPublicKey: arrayToHexKey(keys.publicKey)
      },
      secretContext: {
        preimage: ethers.utils.hexlify(preimage).slice(2),
        refundPrivateKey: arrayToHexKey(privateKey)
      }
    }
  }

  async validateAddress (swap: Swap): Promise<boolean> {
    const secp256k1 = await getSecp256k1()
    const context = swap.context as BoltzChainSwapInContext
    const pubKey = context?.publicContext?.refundPublicKey
    const serverPubKey = context?.publicContext?.lockupDetails?.serverPublicKey
    assertTruthy(pubKey, 'Missing server public key in swap context')
    assertTruthy(serverPubKey, 'Missing refund public key in swap context')
    const claimLeaf = context?.publicContext?.lockupDetails?.swapTree?.claimLeaf
    const refundLeaf = context?.publicContext?.lockupDetails?.swapTree?.refundLeaf
    assertTruthy(claimLeaf, 'Missing claim leaf in swap context')
    assertTruthy(refundLeaf, 'Missing refund leaf in swap context')
    const aggregatedKey = secp256k1.musig.pubkeyAgg([
      Buffer.from(serverPubKey, 'hex'),
      Buffer.from(pubKey, 'hex')
    ])
    const params = { claimLeaf, refundLeaf }
    const swapTree = await createWorkers<typeof params, Array<{ output: string, version: number }>, Taptree>(
      { provider: 'boltz', workerName: 'treeDeserializer' },
      params,
      (swapTree) => {
        const claimLeaf = swapTree[0]
        const refundLeaf = swapTree[1]
        assertTruthy(claimLeaf, 'Claim leaf is undefined')
        assertTruthy(refundLeaf, 'Refund leaf is undefined')
        // We can parse like this because this tree has only 2 scripts (claim and refund)
        const parsedTree: Taptree = [
          {
            version: claimLeaf.version,
            output: Buffer.from(claimLeaf.output, 'hex')
          },
          {
            version: refundLeaf.version,
            output: Buffer.from(refundLeaf.output, 'hex')
          }
        ]
        return parsedTree
      })
    const tweak = tapTweakHash(
      Buffer.from(aggregatedKey.aggPubkey),
      toHashTree(swapTree).hash
    )
    const tweaked = secp256k1.musig.pubkeyXonlyTweakAdd(
      aggregatedKey.keyaggCache,
      tweak,
      true
    )
    const tweakedKey = toXOnly(Buffer.from(tweaked.pubkey))
    const expectedAddress = payments.p2tr({
      pubkey: tweakedKey,
      network: this.network === 'Mainnet' ? networks.bitcoin : networks.testnet
    }).address
    return expectedAddress === swap.paymentAddress
  }

  async generateAction (createdSwap: CreatedSwap): Promise<SwapAction> {
    const swap = createdSwap.swap
    return {
      type: 'BIP21',
      data: `bitcoin:${swap.paymentAddress}?amount=${ethers.utils.formatUnits(swap.fromAmount, BTC_DECIMALS)}`,
      requiresClaim: true
    }
  }

  getClaimDetails (swap: Swap): ClaimDetails {
    const context = swap.context as BoltzChainSwapInContext
    validateRequiredFields(context, 'publicContext', 'secretContext')
    validateRequiredFields(context.publicContext, 'claimDetails')
    validateRequiredFields(context.secretContext, 'preimage')
    validateRequiredFields(context.publicContext.claimDetails, 'lockupAddress', 'amount', 'refundAddress', 'timeoutBlockHeight')
    return {
      lockupAddress: context.publicContext.claimDetails.lockupAddress,
      refundAddress: context.publicContext.claimDetails.refundAddress,
      onchainAmount: context.publicContext.claimDetails.amount,
      timeoutBlockHeight: context.publicContext.claimDetails.timeoutBlockHeight,
      preimage: context.secretContext.preimage
    }
  }
}
