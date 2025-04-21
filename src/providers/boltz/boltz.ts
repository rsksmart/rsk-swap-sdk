import { assertTruthy, ethers, type HttpClient, type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { type CreateSwapResult, type Swap } from '../../api'
import { type SwapAction, type TxData, type ProviderContext, type SwapProviderClient } from '../../providers/types'
import { VALIDATION_CONSTANTS } from '../../constants/validation'
import { validateContractCode } from '../../utils/validation'
import { BOLTZ_ETHER_SWAP_ABI } from '../../constants/abi'
import { type RskSwapEnvironmentName } from '../../constants/environment'
import { type CreateSwapArgs } from '../../sdk/createSwap'
import { type BoltzChainSwapOutContext, type BoltzAtomicSwap } from './types'
import { type ReverseSwap } from './reverseSwap'
import { isBtcChain, isLightningNetwork, isRskChain } from '../../utils/chain'
import { RskSwapError } from '../../error/error'
import { satToWei } from '../../utils/conversion'
import { type SubmarineSwap } from './submarineSwap'
import { type ChainSwapIn } from './chainSwapIn'
import { constructClaimTransaction, detectSwap, Musig, OutputType, SwapTreeSerializer, TaprootUtils, targetFee } from 'boltz-core'
import { type ChainSwapOut } from './chainSwapOut'
import { PROVIDER_URLS } from '../../constants/url'
import { initEccLib, networks, Transaction, address } from 'bitcoinjs-lib'
import * as ecpair from 'ecpair'
import { type ECPairAPI } from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import { getSecp256k1 } from './secp256k1'
import { type BoltzAtomicSwapFactory } from './factory'

export class BoltzClient implements SwapProviderClient {
  private readonly reverseSwap: ReverseSwap
  private readonly submarineSwap: SubmarineSwap
  private readonly chainSwapIn: ChainSwapIn
  private readonly chainSwapOut: ChainSwapOut
  private readonly providerUrl: string
  private readonly keyFactory: ECPairAPI

  constructor (
    private readonly network: RskSwapEnvironmentName,
    private readonly connection: BlockchainConnection,
    private readonly httpClient: HttpClient,
    swapFactory: BoltzAtomicSwapFactory
  ) {
    initEccLib(ecc)
    this.keyFactory = ecpair.ECPairFactory(ecc)
    this.reverseSwap = swapFactory.createReverseSwap()
    this.submarineSwap = swapFactory.createSubmarineSwap(this.network, this.connection)
    this.chainSwapIn = swapFactory.createChainSwapIn(this.network, this.keyFactory)
    this.chainSwapOut = swapFactory.createChainSwapOut(this.network, this.connection, this.keyFactory)
    this.providerUrl = this.network === 'Mainnet' ? PROVIDER_URLS.boltz.mainnet : PROVIDER_URLS.boltz.testnet
  }

  private routeAtomicSwap (spec: { fromNetwork: string, toNetwork: string }): BoltzAtomicSwap {
    const { fromNetwork, toNetwork } = spec
    if (isLightningNetwork(fromNetwork) && isRskChain(toNetwork)) {
      return this.reverseSwap
    } else if (isRskChain(fromNetwork) && isLightningNetwork(toNetwork)) {
      return this.submarineSwap
    } else if (isBtcChain(fromNetwork) && isRskChain(toNetwork)) {
      return this.chainSwapIn
    } else if (isRskChain(fromNetwork) && isBtcChain(toNetwork)) {
      return this.chainSwapOut
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
    const claimDetails = this.routeAtomicSwap(swap).getClaimDetails(swap)
    const lockupAddress = claimDetails.lockupAddress.toLowerCase()
    const validationInfo = VALIDATION_CONSTANTS.boltz
    const expectedHash = this.network === 'Mainnet' ? validationInfo.mainnet.etherSwapBytecodeHash : validationInfo.testnet.etherSwapBytecodeHash
    const isValidContract = await validateContractCode(this.connection, lockupAddress, expectedHash)
    if (!isValidContract) {
      throw RskSwapError.unexpectedContract(lockupAddress)
    }
    return {
      to: lockupAddress,
      data: BOLTZ_ETHER_SWAP_ABI.encodeFunctionData(
        'claim',
        [
          '0x' + claimDetails.preimage,
          satToWei(claimDetails.onchainAmount),
          swap.receiverAddress.toLowerCase(),
          claimDetails.refundAddress.toLowerCase(),
          claimDetails.timeoutBlockHeight
        ]
      ),
      value: '0x0'
    }
  }

  async executeExternalClaim (swap: Swap): Promise<string> {
    if (!(isRskChain(swap.fromNetwork) && isBtcChain(swap.toNetwork))) {
      throw RskSwapError.withCause('External claim is not applicable for this swap', swap)
    }

    const context = this.validateExternalClaimContext(swap)
    const keys = this.keyFactory.fromPrivateKey(Buffer.from(context.secretContext.claimPrivateKey, 'hex'))
    const musig = await this.createSigningSession(context, keys)
    const claimTxInfo = await this.buildExternalClaimTransaction({ keys, musig, context, swap })
    const claimTx = await this.signClaimTransactionCooperatively({
      swap,
      context,
      musig,
      unsignedClaimTx: claimTxInfo.unsignedClaimTx,
      lockOutput: claimTxInfo.lockOutput
    })
    const { id: txId } = await this.httpClient.post<{ id: string }>(
      `${this.providerUrl}/chain/BTC/transaction`,
      { hex: claimTx.toHex() }
    )
    return txId
  }

  private validateExternalClaimContext (swap: Swap): BoltzChainSwapOutContext {
    const context = swap.context as BoltzChainSwapOutContext
    assertTruthy(context?.secretContext?.claimPrivateKey, 'Missing claim private key in swap context')
    assertTruthy(context?.publicContext?.claimPublicKey, 'Missing server public key in swap context')
    assertTruthy(context?.publicContext?.claimDetails?.serverPublicKey, 'Missing claim public key in swap context')
    assertTruthy(context?.secretContext?.preimage, 'Missing preimage in swap context')
    assertTruthy(context?.publicContext?.claimDetails?.swapTree, 'Missing swap tree in swap context')
    return context
  }

  private async createSigningSession (context: BoltzChainSwapOutContext, keys: ecpair.ECPairInterface): Promise<Musig> {
    const secp256k1 = await getSecp256k1()
    const random = ethers.utils.randomBytes(32)
    const serverPubKeyBuffer = Buffer.from(context.publicContext.claimDetails.serverPublicKey, 'hex')
    assertTruthy(secp256k1, 'EC standard not initialized')
    return new Musig(secp256k1, keys, Buffer.from(random), [
      serverPubKeyBuffer,
      Buffer.from(context.publicContext.claimPublicKey, 'hex')
    ])
  }

  private async buildExternalClaimTransaction (args: {
    context: BoltzChainSwapOutContext
    swap: Swap
    musig: Musig
    keys: ecpair.ECPairInterface
  }): Promise<{ unsignedClaimTx: Transaction, lockOutput: ReturnType<typeof detectSwap> }> {
    const { musig, context, keys, swap } = args
    const tweakedKey = TaprootUtils.tweakMusig(
      musig,
      SwapTreeSerializer.deserializeSwapTree(context.publicContext.claimDetails.swapTree).tree
    )

    const swapTxs = await this.httpClient.get<{ serverLock: { transaction: { hex: string } } }>(`${this.providerUrl}/swap/chain/${swap.providerSwapId}/transactions`)
    const btcLockTx = Transaction.fromHex(swapTxs.serverLock.transaction.hex)
    const lockOutput = detectSwap(tweakedKey, btcLockTx)
    assertTruthy(lockOutput, 'Swap lock output not found in transaction')
    const fees = await this.httpClient.get<{ BTC: number }>(`${this.providerUrl}/chain/fees`)
    const unsignedClaimTx = targetFee(fees.BTC, (fee) =>
      constructClaimTransaction(
        [
          {
            ...lockOutput,
            keys,
            preimage: Buffer.from(context.secretContext.preimage, 'hex'),
            cooperative: true,
            type: OutputType.Taproot,
            txHash: btcLockTx.getHash()
          }
        ],
        address.toOutputScript(swap.receiverAddress, this.network === 'Mainnet' ? networks.bitcoin : networks.testnet),
        fee
      )
    )
    return { unsignedClaimTx, lockOutput }
  }

  private async signClaimTransactionCooperatively (args: {
    swap: Swap
    context: BoltzChainSwapOutContext
    musig: Musig
    unsignedClaimTx: Transaction
    lockOutput: ReturnType<typeof detectSwap>
  }): Promise<Transaction> {
    const { swap, context, musig, unsignedClaimTx: claimTx, lockOutput } = args
    const boltzSig = await this.httpClient.post<{ pubNonce: string, partialSignature: string }>(
      `${this.providerUrl}/swap/chain/${swap.providerSwapId}/claim`,
      {
        preimage: context.secretContext.preimage,
        toSign: {
          index: 0,
          pubNonce: Buffer.from(musig.getPublicNonce()).toString('hex'),
          transaction: claimTx.toHex()
        }
      }
    )
    const serverPubKeyBuffer = Buffer.from(context.publicContext.claimDetails.serverPublicKey, 'hex')
    musig.aggregateNonces([
      [serverPubKeyBuffer, Buffer.from(boltzSig.pubNonce, 'hex')]
    ])
    musig.initializeSession(
      claimTx.hashForWitnessV1(
        0,
        [lockOutput.script],
        [lockOutput.value],
        Transaction.SIGHASH_DEFAULT
      )
    )
    musig.addPartial(serverPubKeyBuffer, Buffer.from(boltzSig.partialSignature, 'hex'))
    musig.signPartial()
    assertTruthy(claimTx.ins[0], 'Missing input in claim transaction')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    claimTx.ins.at(0)!.witness = [musig.aggregatePartials()]
    return claimTx
  }
}
