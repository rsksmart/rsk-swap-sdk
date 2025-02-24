import { type Api } from './bindings/ApiRoute'

export type SwapEstimationQuery =
  Api.SwapsControllerGetSwapEstimation.RequestQuery
export type GetSwapArgs = Api.SwapsControllerGetSwapStatus.RequestQuery
export type SwapLimitsQuery = Api.SwapsControllerGetSwapLimits.RequestQuery
export type GetPricesQuery = Api.PriceFeederControllerGetPrices.RequestQuery
export type GetSwapQuery = Api.SwapsControllerGetSwapStatus.RequestQuery

export {
  type SwapEstimationRS as SwapEstimation,
  type FeeDTO as Fee,
  type CreateSwapRQ,
  type CreateSwapRS as CreatedSwap,
  type SwapDTO as Swap,
  type SwapProviderDTO as SwapProvider,
  type SwapPairDTO as SwapPair,
  type SwapLimitsRS as SwapLimits,
  type CoinPriceDto as CoinPrice,
  type TokenDTO as Token,
  type CreateSwapRS as CreateSwapResult,
  SwapEstimationRsRequiredFields as swapEstimationRequiredFields,
  FeeDtoRequiredFields as feeRequiredFields,
  CreateSwapRqRequiredFields as createSwapArgsRequiredFields,
  CreateSwapRsRequiredFields as swapWithActionRequiredFields,
  SwapDtoRequiredFields as swapRequiredFields
} from './bindings/data-contracts'

export const Routes = {
  swapLimits: '/swaps/limits',
  estimateSwap: '/swaps/estimate',
  getSwap: '/swaps',
  createSwap: '/swaps',
  getProviders: '/providers',
  getTokens: '/tokens',
  getProvider: '/providers/',
  getPrices: '/price-feeder',
  getToken: '/tokens/'
} as const
