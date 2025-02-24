import { type CreateSwapRQ, createSwapArgsRequiredFields, Routes, type CreateSwapResult } from '../api'
import { validateRequiredFields, type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type SwapWithAction } from '../providers/types'
import { type ProviderClientResolver } from '../providers/resolver'
import { RskSwapError } from '../error/error'

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
  const result: CreateSwapResult = await client.post(url.toString(), request, { includeCaptcha: false })
  // only the public context is sent to the server
  result.swap.context = {
    publicContext: {
      ...result.swap.context,
      ...context.publicContext // to ensure the original context was not modified
    },
    secretContext: context.secretContext
  }

  if (!swapProviderClient.validateAddress(result.swap)) {
    throw RskSwapError.untrustedAddress(result.swap)
  }

  const action = await swapProviderClient.generateAction(result)
  return {
    swap: result.swap,
    action
  }
}
