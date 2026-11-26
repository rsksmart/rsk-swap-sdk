import { address, initEccLib, type Network } from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
import { type Bip21QrCodeArgs } from '../sdk/getQrCode'

/**
 * Builds a BIP21 URI (`bitcoin:<address>?amount=…&label=…&message=…`).
 * @throws { Error } When `address` is not a valid Bitcoin address for `network`.
 */
export function buildBip21Uri (args: Bip21QrCodeArgs, network: Network): string {
  initEccLib(ecc)
  try {
    address.toOutputScript(args.address, network)
  } catch {
    throw new Error(`Invalid Bitcoin address: ${args.address}`)
  }
  const params = new URLSearchParams()
  if (args.amountInDecimal) params.set('amount', args.amountInDecimal)
  if (args.label) params.set('label', args.label)
  if (args.message) params.set('message', args.message)
  const query = params.toString().replace(/\+/g, '%20')
  return query ? `bitcoin:${args.address}?${query}` : `bitcoin:${args.address}`
}
