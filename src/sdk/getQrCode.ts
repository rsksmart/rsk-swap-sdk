import { toDataURL } from 'qrcode'
import { type Network } from 'bitcoinjs-lib'
import { buildBip21Uri } from '../utils/bip21'

/**
 * Arguments for the BIP21 QR code
 * @property address - The address of the wallet
 * @property amountInDecimal - The amount of the payment in decimal
 * @property label - The label of the payment
 * @property message - The message of the payment
 */
export interface Bip21QrCodeArgs {
  address: string
  amountInDecimal?: string
  label?: string
  message?: string
}

/**
 * Arguments for the EIP681 QR code
 * @property address - The address of the wallet
 * @property value - The value of the payment in wei
 * @property chainId - The chain ID of the network
 * @property tokenAddress - The address of the token. Must be provided together with recipient and uint256.
 * @property recipient - The address of the recipient. Must be provided together with tokenAddress and uint256.
 * @property uint256 - The amount of the token in uint256. Must be provided together with tokenAddress and recipient.
 */
export interface Eip681QrCodeArgs {
  address: string
  value?: string
  chainId?: number
  // For ERC20 token transfers
  tokenAddress?: string
  recipient?: string
  uint256?: string
}

/**
 * Arguments for {@link getQrCode}.
 * @property type - The type of QR code to generate 'BIP-21' | 'EIP-681'
 * @property data - The data for the QR code Bip21QrCodeArgs | Eip681QrCodeArgs
 */
export type GetQrCodeArgs =
  | {
    type: 'BIP-21'
    data: Bip21QrCodeArgs
  }
  | {
    type: 'EIP-681'
    data: Eip681QrCodeArgs
  }

/**
 * Generates a QR code data URL from a payment URI.
 *
 * Supports:
 * - BIP21: Bitcoin payment URIs (e.g., bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.001)
 * - EIP681: Ethereum payment URIs for native tokens or ERC20 transfers
 */
export async function getQrCode (args: GetQrCodeArgs, bitcoinNetwork: Network): Promise<string> {
  let uri: string

  try {
    switch (args.type) {
      case 'BIP-21':
        uri = buildBip21Uri(args.data, bitcoinNetwork)
        break
      case 'EIP-681':
        uri = buildEip681Uri(args.data)
        break
      default:
        throw new Error('Unsupported QR code type')
    }

    const qrCodeUrl = await toDataURL(uri)
    return qrCodeUrl
  } catch (err: unknown) {
    throw new Error('Error generating QR code: ' + (err as Error).message)
  }
}

/**
 * Builds an EIP681 URI for Ethereum/EVM payments
 * For native tokens: ethereum:<address>@<chainId>?value=<value>
 * For ERC20 tokens: ethereum:<tokenAddress>@<chainId>/transfer?address=<recipient>&uint256=<amount>
 */
function buildEip681Uri (args: Eip681QrCodeArgs): string {
  const { address, value, chainId, tokenAddress, recipient, uint256 } = args

  // ERC20 token transfer
  if (tokenAddress !== undefined || recipient !== undefined || uint256 !== undefined) {
    if (!tokenAddress || !recipient || !uint256) {
      throw new Error('Invalid EIP-681 data: tokenAddress, recipient, and uint256 must be provided together for ERC20 transfers')
    }

    const chainIdParam = chainId !== undefined ? `@${chainId}` : ''
    return `ethereum:${encodeURIComponent(tokenAddress)}${chainIdParam}/transfer?address=${encodeURIComponent(recipient)}&uint256=${encodeURIComponent(uint256)}`
  }

  // Native token payment
  const chainIdParam = chainId !== undefined ? `@${chainId}` : ''
  let uri = `ethereum:${encodeURIComponent(address)}${chainIdParam}`
  const params: string[] = []
  if (value) params.push(`value=${encodeURIComponent(value)}`)

  if (params.length > 0) {
    uri += `?${params.join('&')}`
  }

  return uri
}
