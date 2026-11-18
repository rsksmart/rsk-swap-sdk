import { type CreateSwapRQ, createSwapArgsRequiredFields, Routes, type CreateSwapResult } from '../api'
import { validateRequiredFields, type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type SwapAction, type SwapWithAction } from '../providers/types'
import { type ProviderClientResolver } from '../providers/resolver'
import { RskSwapError } from '../error/error'
import { TOKEN_REGISTRY, type PinnedToken } from '../constants/tokens'
import { isBtcChain, isEvmChain } from '../utils/chain'

const CONTRACT_INTERACTION_PROVIDERS = ['SYMBIOSIS']

/** Arguments to create a new swap with a specific provider (see {@link RskSwapSDK.createNewSwap}). The provider-specific `context` is generated internally by the SDK and can't be passed in. */
export type CreateSwapArgs = Omit<CreateSwapRQ, 'context'>

export async function createSwap (apiUrl: string, client: HttpClient, clientResolver: ProviderClientResolver, args: CreateSwapArgs): Promise<SwapWithAction> {
  const swapProviderClient = clientResolver.get(args.providerId)
  const context = swapProviderClient.createContext(args)
  const request: CreateSwapRQ = {
    ...args,
    context: context.publicContext
  }
  const url = new URL(apiUrl + Routes.createSwap)
  validateRequiredFields(request, ...createSwapArgsRequiredFields)
  const fromToken = TOKEN_REGISTRY[request.fromNetwork]?.[request.fromToken]
  if (!fromToken) {
    throw RskSwapError.unsupportedToken(request.fromNetwork, request.fromToken)
  }
  const result: CreateSwapResult = await client.post(url.toString(), request, { includeCaptcha: true })

  if (!isValidApiResponse(request, result) || result.actionType !== getExpectedActionType(request, fromToken)) {
    throw RskSwapError.invalidApiResponse(request, result)
  }
  result.swap.fromAmount = BigInt(request.fromAmount)

  // only the public context is sent to the server
  const baseContext = {
    publicContext: {
      ...result.swap.context,
      ...context.publicContext // to ensure the original context was not modified
    },
    secretContext: context.secretContext
  }
  result.swap.context = baseContext

  const isValidAddress = await swapProviderClient.validateAddress(result.swap)
  if (!isValidAddress) {
    throw RskSwapError.untrustedAddress(result.swap)
  }

  const action = await swapProviderClient.generateAction(result, fromToken)
  const { fromNetwork } = result.swap
  return {
    swap: result.swap,
    action: { ...action, fromNetwork, ...(isEvmChain(fromNetwork) && { chainId: Number(fromNetwork) }) }
  }
}

function getExpectedActionType (request: CreateSwapRQ, fromToken: PinnedToken): SwapAction['type'] {
  if (isBtcChain(request.fromNetwork)) {
    return 'BIP21'
  }
  if (CONTRACT_INTERACTION_PROVIDERS.includes(request.providerId)) {
    return 'CONTRACT-INTERACTION'
  }
  return fromToken.type === 'native-evm' ? 'EVM-NATIVE-PAYMENT' : 'ERC20-PAYMENT'
}

function isIntegerAmount (amount: unknown): boolean {
  return typeof amount === 'bigint' || (typeof amount === 'number' && Number.isSafeInteger(amount))
}

function isValidApiResponse (request: CreateSwapRQ, result: CreateSwapResult): boolean {
  for (const [key, value] of Object.entries(request.context ?? {})) {
    if (result.swap.context[key as keyof object] !== value) {
      return false
    }
  }
  return isIntegerAmount(result.swap.fromAmount) &&
    BigInt(request.fromAmount) === BigInt(result.swap.fromAmount) &&
    request.fromToken === result.swap.fromToken &&
    request.toToken === result.swap.toToken &&
    request.fromNetwork === result.swap.fromNetwork &&
    request.toNetwork === result.swap.toNetwork &&
    request.providerId === result.swap.providerId &&
    request.address === result.swap.receiverAddress &&
    (result.swap.refundAddress === '' || request.refundAddress === result.swap.refundAddress)
}
