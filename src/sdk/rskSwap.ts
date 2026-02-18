import {
  assertTruthy,
  type BlockchainConnection,
  getHttpClient,
  type HttpClient
} from '@rsksmart/bridges-core-sdk'
import {
  type Swap,
  type SwapProvider,
  type SwapEstimation,
  type SwapLimits,
  type CoinPrice,
  type Token
} from '../api'
import { estimateSwap, type SwapEstimationArgs } from './estimateSwap'
import { createSwap, type CreateSwapArgs } from './createSwap'
import { getSwap, type SwapId } from './getSwap'
import {
  type RskSwapEnvironment,
  type RskSwapEnvironmentName,
  RskSwapEnvironments
} from '../constants/environment'
import { getProviders } from './getProviders'
import { getProvider } from './getProvider'
import { executeSwap } from './executeSwap'
import { getSwapLimits, type SwapLimitsArgs } from './getLimits'
import { getPrices, type GetPricesArgs } from './getPrices'
import { listTokens } from './listTokens'
import { type SwapAction, type SwapWithAction } from '../providers/types'
import { ProviderClientResolver } from '../providers/resolver'
import { BoltzClient } from '../providers/boltz/boltz'
import { ChangellyClient } from '../providers/changelly/changelly'
import { SymbiosisClient } from '../providers/symbiosis/symbiosis'
import { claimSwap } from './claimSwap'
import { DefaultBoltzAtomicSwapFactory } from '../providers/boltz/factory'

/** Class that represents the entrypoint to the RSK Swap SDK */
export class RskSwapSDK {
  private readonly httpClient: HttpClient
  private readonly environment: RskSwapEnvironment
  private connection: BlockchainConnection
  private readonly providerClientResolver: ProviderClientResolver

  /**
   * Create a RskSwapSDK client instance.
   *
   * @param { RskSwapEnvironmentName } envName Name of the network environment to use.
   * @param { BlockchainConnection } connection Connection to the blockchain where the payments will be executed.
   */
  constructor (
    envName: RskSwapEnvironmentName,
    connection: BlockchainConnection
  ) {
    this.connection = connection
    this.httpClient = getHttpClient(async () => Promise.resolve(''))
    const environment = RskSwapEnvironments[envName]
    assertTruthy(environment, `Environment ${envName} not found`)
    this.environment = environment
    this.providerClientResolver = new ProviderClientResolver()
      .register('BOLTZ', new BoltzClient(envName, connection, this.httpClient, new DefaultBoltzAtomicSwapFactory()))
      .register('CHANGELLY', new ChangellyClient(this.environment.api, this.httpClient))
      .register('SYMBIOSIS', new SymbiosisClient(this.environment.api, this.httpClient))
  }

  /**
   * Change the current network connection
   * @param { BlockchainConnection } connection the connection object
   */
  changeConnection (connection: BlockchainConnection): void {
    this.connection = connection
  }

  /**
   * Get the estimation for the given amount of each provider that supports that pair.
   *
   * @param { SwapEstimationArgs } estimationArgs The estimation arguments.
   * @returns { SwapEstimation[] } The estimation of each provider. Including fees and blocks to deliver.
   */
  async estimateSwap (
    estimationArgs: SwapEstimationArgs
  ): Promise<SwapEstimation[]> {
    return estimateSwap(this.environment.api, this.httpClient, estimationArgs)
  }

  /**
   * Create a new swap with a specific provider.
   *
   * @param { CreateSwapArgs } args The swap creation arguments.
   * @returns { SwapWithAction } The swap with the action to execute its payment
   */
  async createNewSwap (args: CreateSwapArgs): Promise<SwapWithAction> {
    return createSwap(this.environment.api, this.httpClient, this.providerClientResolver, args)
  }

  /**
   * Get the status of an existing swap.
   *
   * @param { SwapId } id The swap id. Includes the provider id and the id of the swap in the provider's system.
   * @returns { Swap } The swap information
   */
  async getSwapStatus (id: SwapId): Promise<Swap> {
    return getSwap(this.environment.api, this.httpClient, id)
  }

  /**
   * Get the list of available providers.
   *
   * @returns { SwapProvider[] } The list of the enabled providers to get swaps from.
   */
  async getProviders (): Promise<SwapProvider[]> {
    return getProviders(this.environment.api, this.httpClient)
  }

  /**
   * Get the list of supported tokens.
   *
   * @returns { Token[] } List of the supported token to perform swaps.
   */
  async listTokens (): Promise<Token[]> {
    return listTokens(this.environment.api, this.httpClient)
  }

  /**
   * Get the information of a specific provider.
   *
   * @param { string } id The provider id.
   * @returns { SwapProvider } The provider information.
   */
  async getProvider (id: string): Promise<SwapProvider> {
    return getProvider(this.environment.api, this.httpClient, id)
  }

  /**
   * Execute the payment of a swap. Depending on the action, this method will behave differently.
   * - Bitcoin payment: The method will return a BIP21 string for the user to pay.
   * - Lightning payment: The method will return a BOLT11 string for the user to pay.
   * - Native EVM token payment: The method will try to execute the payment transaction using the current {@link BlockchainConnection} and return the transaction hash.
   * - ERC20 token payment: The method will try to execute the payment transaction using the current {@link BlockchainConnection} and return the transaction hash. It will format the transaction data and destination accordingly.
   *
   * @param { SwapAction } action The action to execute the payment, as returned by the API.
   * @returns { string } The result of the action (BIP21 or transaction hash).
   */
  async executeSwap (action: SwapAction): Promise<string> {
    return executeSwap(this.connection, action)
  }

  /**
   * Claims an existing swap if applicable. It will execute the claim transaction on the blockchain.
   *
   * @param { SwapWithAction } swap The swap to claim
   * @returns { string } The transaction hash of the claim transaction
   *
   * @throws { RskSwapError } If the swap does not require a claim
   */
  async claimSwap (swap: SwapWithAction): Promise<string> {
    const result = await claimSwap(this.providerClientResolver, swap, this.connection)
    return result.txHash
  }

  /**
   * Get the limits for a swap pair. It will return the highest maximum limit and the lowest minimum limit among the limits of all the enabled providers.
   *
   * @param { SwapLimitsArgs } args The swap limits arguments.
   * @returns { SwapLimits } The swap limits
   */
  async getSwapLimits (args: SwapLimitsArgs): Promise<SwapLimits> {
    return getSwapLimits(this.environment.api, this.httpClient, args)
  }

  /**
   * Fetches the price(s) of the given currency/currencies in USD.
   * Supports multiple tokens IDs separated by commas.
   *
   * @param { GetPricesArgs } args The arguments containing the currencies.
   * @returns { CoinPrice[] } An array of coin names and their prices.
   */
  async getPrices (args: GetPricesArgs): Promise<CoinPrice[]> {
    return getPrices(this.environment.api, this.httpClient, args)
  }
}
