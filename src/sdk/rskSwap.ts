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
import { claimSwap } from './claimSwap'
import { DefaultBoltzAtomicSwapFactory } from '../providers/boltz/factory'
import { NoOpTelemetryProvider } from '../telemetry/noop'
import { SafeTelemetryProvider } from '../telemetry/safe'
import type { TelemetryProvider } from '../telemetry/types'
import { SentryTelemetryProvider } from '../telemetry/sentry'

export interface TelemetryInitOptions {
  dsn: string
  options?: Record<string, unknown>
  tag?: string
}

export interface RskSwapSDKOptions {
  telemetry?: TelemetryProvider
  telemetryInit?: TelemetryInitOptions
}

/** Class that represents the entrypoint to the RSK Swap SDK */
export class RskSwapSDK {
  private readonly httpClient: HttpClient
  private readonly environment: RskSwapEnvironment
  private connection: BlockchainConnection
  private readonly providerClientResolver: ProviderClientResolver
  private telemetry: TelemetryProvider
  private readonly envName: RskSwapEnvironmentName

  /**
   * Create a RskSwapSDK client instance.
   *
   * @param { RskSwapEnvironmentName } envName Name of the network environment to use.
   * @param { BlockchainConnection } connection Connection to the blockchain where the payments will be executed.
   * @param { RskSwapSDKOptions } options Optional SDK configuration
   */
  constructor (
    envName: RskSwapEnvironmentName,
    connection: BlockchainConnection,
    options: RskSwapSDKOptions = {}
  ) {
    this.envName = envName
    this.connection = connection
    this.httpClient = getHttpClient(async () => Promise.resolve(''))
    const environment = RskSwapEnvironments[envName]
    assertTruthy(environment, `Environment ${envName} not found`)
    this.environment = environment
    this.providerClientResolver = new ProviderClientResolver()
      .register('BOLTZ', new BoltzClient(envName, connection, this.httpClient, new DefaultBoltzAtomicSwapFactory()))
      .register('CHANGELLY', new ChangellyClient(this.environment.api, this.httpClient))
    this.telemetry = new SafeTelemetryProvider(new NoOpTelemetryProvider())

    if (options.telemetry) {
      this.telemetry = new SafeTelemetryProvider(options.telemetry)
    } else if (options.telemetryInit?.dsn) {
      SentryTelemetryProvider.create(
        options.telemetryInit.dsn,
        options.telemetryInit.options,
        options.telemetryInit.tag
      ).then((provider) => {
        this.telemetry = new SafeTelemetryProvider(provider)
      }).catch(() => {
        // Telemetry init failures must never affect SDK behavior.
      })
    }
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
    try {
      return await estimateSwap(this.environment.api, this.httpClient, estimationArgs)
    } catch (error) {
      this.telemetry.captureException(normalizeError(error), {
        operation: 'estimateSwap',
        env: this.envName
      })
      throw error
    }
  }

  /**
   * Create a new swap with a specific provider.
   *
   * @param { CreateSwapArgs } args The swap creation arguments.
   * @returns { SwapWithAction } The swap with the action to execute its payment
   */
  async createNewSwap (args: CreateSwapArgs): Promise<SwapWithAction> {
    try {
      return await createSwap(this.environment.api, this.httpClient, this.providerClientResolver, args)
    } catch (error) {
      this.telemetry.captureException(normalizeError(error), {
        operation: 'createNewSwap',
        env: this.envName,
        providerId: args.providerId
      })
      throw error
    }
  }

  /**
   * Get the status of an existing swap.
   *
   * @param { SwapId } id The swap id. Includes the provider id and the id of the swap in the provider's system.
   * @returns { Swap } The swap information
   */
  async getSwapStatus (id: SwapId): Promise<Swap> {
    try {
      return await getSwap(this.environment.api, this.httpClient, id)
    } catch (error) {
      this.telemetry.captureException(normalizeError(error), {
        operation: 'getSwapStatus',
        env: this.envName,
        providerId: id.providerId
      })
      throw error
    }
  }

  /**
   * Get the list of available providers.
   *
   * @returns { SwapProvider[] } The list of the enabled providers to get swaps from.
   */
  async getProviders (): Promise<SwapProvider[]> {
    try {
      return await getProviders(this.environment.api, this.httpClient)
    } catch (error) {
      this.telemetry.captureException(normalizeError(error), {
        operation: 'getProviders',
        env: this.envName
      })
      throw error
    }
  }

  /**
   * Get the list of supported tokens.
   *
   * @returns { Token[] } List of the supported token to perform swaps.
   */
  async listTokens (): Promise<Token[]> {
    try {
      return await listTokens(this.environment.api, this.httpClient)
    } catch (error) {
      this.telemetry.captureException(normalizeError(error), {
        operation: 'listTokens',
        env: this.envName
      })
      throw error
    }
  }

  /**
   * Get the information of a specific provider.
   *
   * @param { string } id The provider id.
   * @returns { SwapProvider } The provider information.
   */
  async getProvider (id: string): Promise<SwapProvider> {
    try {
      return await getProvider(this.environment.api, this.httpClient, id)
    } catch (error) {
      this.telemetry.captureException(normalizeError(error), {
        operation: 'getProvider',
        env: this.envName,
        providerId: id
      })
      throw error
    }
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
    try {
      return await executeSwap(this.connection, action)
    } catch (error) {
      this.telemetry.captureException(normalizeError(error), {
        operation: 'executeSwap',
        env: this.envName
      })
      throw error
    }
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
    try {
      const result = await claimSwap(this.providerClientResolver, swap, this.connection)
      return result.txHash
    } catch (error) {
      this.telemetry.captureException(normalizeError(error), {
        operation: 'claimSwap',
        env: this.envName,
        providerId: swap.swap.providerId
      })
      throw error
    }
  }

  /**
   * Get the limits for a swap pair. It will return the highest maximum limit and the lowest minimum limit among the limits of all the enabled providers.
   *
   * @param { SwapLimitsArgs } args The swap limits arguments.
   * @returns { SwapLimits } The swap limits
   */
  async getSwapLimits (args: SwapLimitsArgs): Promise<SwapLimits> {
    try {
      return await getSwapLimits(this.environment.api, this.httpClient, args)
    } catch (error) {
      this.telemetry.captureException(normalizeError(error), {
        operation: 'getSwapLimits',
        env: this.envName
      })
      throw error
    }
  }

  /**
   * Fetches the price(s) of the given currency/currencies in USD.
   * Supports multiple tokens IDs separated by commas.
   *
   * @param { GetPricesArgs } args The arguments containing the currencies.
   * @returns { CoinPrice[] } An array of coin names and their prices.
   */
  async getPrices (args: GetPricesArgs): Promise<CoinPrice[]> {
    try {
      return await getPrices(this.environment.api, this.httpClient, args)
    } catch (error) {
      this.telemetry.captureException(normalizeError(error), {
        operation: 'getPrices',
        env: this.envName
      })
      throw error
    }
  }
}

function normalizeError (error: unknown): Error {
  return error instanceof Error ? error : new Error('Unknown error')
}
