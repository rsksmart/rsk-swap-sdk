/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface SwapPairDTO {
  /** The chain id of the origin network or BTC if the origin network is Bitcoin */
  fromNetwork: string;
  /** The chain id of the destination network or BTC if the destination is Bitcoin */
  toNetwork: string;
  /** Origin token symbol */
  fromToken: string;
  /** Destination token symbol */
  toToken: string;
  /** Origin token id in the provider's system */
  fromTokenProviderId: string;
  /** Destination token id in the provider's system */
  toTokenProviderId: string;
}

export const SwapPairDtoRequiredFields: string[] = [
  "fromNetwork",
  "toNetwork",
  "fromToken",
  "toToken",
  "fromTokenProviderId",
  "toTokenProviderId",
];

export interface SwapProviderDTO {
  /** Unique identifier for the provider */
  providerId: string;
  /** Description of the provider */
  description: string;
  /** Short name of the provider */
  shortName: string;
  /** URL to the provider logo */
  logoUrl: string;
  /** URL to the provider site */
  siteUrl: string;
  /** Supported pairs to provide swaps */
  supportedPairs: SwapPairDTO[];
}

export const SwapProviderDtoRequiredFields: string[] = [
  "providerId",
  "description",
  "shortName",
  "logoUrl",
  "siteUrl",
  "supportedPairs",
];

export interface ErrorDto {
  code: string;
  message: string;
  context: object;
}

export const ErrorDtoRequiredFields: string[] = ["code", "message", "context"];

export interface FeeDTO {
  type:
    | "PERCENTAGE_BOLTZ_FEE"
    | "FIXED_MINER_FEE"
    | "FIXED_DESTINATION_NETWORK_FEE"
    | "FIXED_CHANGELLY_FEE"
    | "FIXED_GAS_FEE"
    | "FIXED_LIFI_PROVIDER_FEE"
    | "FIXED_NETWORK_FEE"
    | "FIXED_SERVICE_FEE"
    | "FIXED_MOCK_FEE";
  amount: bigint | number;
  symbol?: string;
  decimals?: number;
}

export const FeeDtoRequiredFields: string[] = ["type", "amount"];

export interface SwapEstimationRS {
  /** The provider ID that generated the estimation */
  providerId: string;
  /** The chain id of the origin network or BTC if the origin network is Bitcoin */
  fromNetwork: string;
  /** The chain id of the destination network or BTC if the destination is Bitcoin */
  toNetwork: string;
  /** The token symbol of the origin token */
  fromToken: string;
  /** The token symbol of the destination token */
  toToken: string;
  /**
   * The total amount to pay for the swap
   * @format int64
   */
  total: bigint | number;
  /** The number of confirmations for the payment to be processed by the provider */
  requiredConfirmations: number;
  /** The estimated time in seconds for the swap to complete (used by providers like LiFi) */
  estimatedTime?: number;
  /** The fees that are charged in the swap by this provider */
  fees: FeeDTO[];
}

export const SwapEstimationRsRequiredFields: string[] = [
  "providerId",
  "fromNetwork",
  "toNetwork",
  "fromToken",
  "toToken",
  "total",
  "requiredConfirmations",
  "fees",
];

export interface SwapLimitsRS {
  /**
   * The minimum amount that can be swapped in the origin token smallest unit
   * @format int64
   */
  minAmount: bigint | number;
  /**
   * The maximum amount that can be swapped in the origin token smallest unit
   * @format int64
   */
  maxAmount: bigint | number;
}

export const SwapLimitsRsRequiredFields: string[] = ["minAmount", "maxAmount"];

export interface CreateSwapContext {
  /** The preimage hash of the swap */
  preimageHash?: string;
  /** The refund public key of the swap */
  refundPublicKey?: string;
  /** The claim public key of the swap */
  claimPublicKey?: string;
  /** Slippage tolerance as an integer (e.g. 300 for 3%) */
  slippage?: number;
}

export interface CreateSwapRQ {
  /** Id of the provider to execute the swap */
  providerId: string;
  /** The chain id of the origin network or BTC if the origin is Bitcoin */
  fromNetwork: string;
  /** The chain id of the destination network or BTC if the destination is Bitcoin */
  toNetwork: string;
  /** The token symbol of the origin token */
  fromToken: string;
  /** The token symbol of the destination token */
  toToken: string;
  /**
   * The amount of the origin network to swap, in the smallest unit for that token
   * @format int64
   */
  fromAmount: bigint | number;
  /** The destination address of the swap. Must be of the destination network */
  address: string;
  /** The address to refund the amount in case of error. Must be of the origin network */
  refundAddress: string;
  /** The context of the swap, depends on the provider */
  context?: CreateSwapContext;
}

export const CreateSwapRqRequiredFields: string[] = [
  "providerId",
  "fromNetwork",
  "toNetwork",
  "fromToken",
  "toToken",
  "fromAmount",
  "address",
  "refundAddress",
];

export interface SwapDTO {
  /** ID of the swap in the provider system */
  providerSwapId: string;
  /** ID of the provider that created the swap */
  providerId: string;
  /**
   * The amount of the origin network to swap, in the smallest unit for that token
   * @format int64
   */
  fromAmount: bigint | number;
  /** The address to pay for the swap in the origin network */
  paymentAddress: string;
  /** The address to receive the swap in the destination network */
  receiverAddress: string;
  /** The address to refund the amount in case of error. Must be of the origin network */
  refundAddress: string;
  /** The token symbol of the origin token */
  fromToken: string;
  /** The token symbol of the destination token */
  toToken: string;
  /** The chain id of the origin network or BTC if the origin is Bitcoin */
  fromNetwork: string;
  /** The chain id of the destination network or BTC if the destination is Bitcoin */
  toNetwork: string;
  /** The status of the swap */
  status:
    | "CREATED"
    | "PENDING"
    | "EXPIRED"
    | "CLAIMED"
    | "REFUNDED"
    | "REFUND_PENDING"
    | "CLAIM_PENDING"
    | "FAILED"
    | "COMPLETED"
    | "UNKNOWN";
  /** The number of confirmations for the payment to be processed by the provider */
  requiredConfirmations: number;
  /** The estimated time in seconds for the swap to complete (used by providers like LiFi) */
  estimatedTime?: number;
  /** The fees that are charged in the swap by this provider */
  usedFees: FeeDTO[];
  /** The context of the swap, depends on the provider */
  context: object;
}

export const SwapDtoRequiredFields: string[] = [
  "providerSwapId",
  "providerId",
  "fromAmount",
  "paymentAddress",
  "receiverAddress",
  "refundAddress",
  "fromToken",
  "toToken",
  "fromNetwork",
  "toNetwork",
  "status",
  "requiredConfirmations",
  "usedFees",
  "context",
];

export interface CreateSwapRS {
  /** The swap created */
  swap: SwapDTO;
  /** The type of action to perform */
  actionType: "NONE" | "ERC20-PAYMENT" | "EVM-NATIVE-PAYMENT" | "BIP21" | "BOLT11" | "CONTRACT-INTERACTION";
}

export const CreateSwapRsRequiredFields: string[] = ["swap", "actionType"];

export interface TokenDTO {
  /**
   * Symbol of the asset
   * @example "RBTC"
   */
  symbol: string;
  /**
   * Long name of the asset
   * @example "Rootstock Smart Bitcoin"
   */
  description: string;
  /** Type of the asset */
  type: "native-evm" | "erc20" | "native-btc" | "oft";
  /**
   * Decimal precision of the asset
   * @example 18
   */
  decimals: number;
  /**
   * Address of the token depending on the network. Only used for ERC20 tokens. The key is the chainId and the value is the address.
   * @example {"1":"0xdac17f958d2ee523a2206206994597c13d831ec7"}
   */
  addresses: Record<string, string>;
}

export const TokenDtoRequiredFields: string[] = ["symbol", "description", "type", "decimals", "addresses"];

export interface CoinPriceDto {
  /**
   * Name of the cryptocurrency
   * @example "bitcoin"
   */
  name: string;
  /**
   * Price of the cryptocurrency in USD
   * @example 50000
   */
  price: number;
}

export const CoinPriceDtoRequiredFields: string[] = ["name", "price"];
