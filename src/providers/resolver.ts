import { type SwapProviderClient } from './types'

export class ProviderClientResolver {
  private readonly clients: Map<string, SwapProviderClient>

  constructor () {
    this.clients = new Map()
  }

  register (providerId: string, client: SwapProviderClient): ProviderClientResolver {
    this.clients.set(providerId, client)
    return this
  }

  get (providerId: string): SwapProviderClient {
    const client = this.clients.get(providerId)
    if (!client) {
      throw new Error(`Provider ${providerId} not supported`)
    }
    return client
  }
}
