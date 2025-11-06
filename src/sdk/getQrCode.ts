import { toDataURL } from 'qrcode'

export interface LightningQrCodeArgs {
  lnPaymentString: string
}
/**
 * Arguments for the BIP21 QR code
 * @param address - The address of the wallet
 * @param amountInDecimal - The amount of the payment in decimal
 * @param label - The label of the payment
 * @param message - The message of the payment
 */
export interface Bip21QrCodeArgs {
  address: string
  amountInDecimal?: string
  label?: string
  message?: string
}

/**
 * Arguments for the EIP681 QR code
 * @param address - The address of the wallet
 * @param value - The value of the payment in wei
 * @param chainId - The chain ID of the network
 * @param tokenAddress - The address of the token
 * @param recipient - The address of the recipient
 * @param uint256 - The amount of the token in uint256
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
 * Arguments for the getQrCode function
 * @param type - The type of QR code to generate 'EIP-681' | 'BIP-21' | 'BOLT11'
 * @param data - The data for the QR code LightningQrCodeArgs | Bip21QrCodeArgs | Eip681QrCodeArgs
 */
export interface GetQrCodeArgs {
  type: 'EIP-681' | 'BIP-21' | 'BOLT11'
  data: LightningQrCodeArgs | Bip21QrCodeArgs | Eip681QrCodeArgs
}

/**
 * Generates a QR code data URL from a payment URI.
 *
 * Supports:
 * - BIP21: Bitcoin payment URIs (e.g., bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.001)
 * - EIP681: Ethereum payment URIs for native tokens or ERC20 transfers
 * - BOLT11: Lightning Network payment requests
 */
export async function getQrCode (args: GetQrCodeArgs): Promise<string> {
  let uri: string

  try {
    switch (args.type) {
      case 'BIP-21':
        uri = buildBip21Uri(args.data as Bip21QrCodeArgs)
        break
      case 'EIP-681':
        uri = buildEip681Uri(args.data as Eip681QrCodeArgs)
        break
      case 'BOLT11':
        uri = (args.data as LightningQrCodeArgs).lnPaymentString
        break
      default:
        throw new Error(`Unsupported QR code type: ${args.type}`)
    }

    const qrCodeUrl = await toDataURL(uri)
    return qrCodeUrl
  } catch (err: unknown) {
    throw new Error('Error generating QR code: ' + (err as Error).message)
  }
}

/**
 * Builds a BIP21 URI for Bitcoin payments
 * Format: bitcoin:<address>?amount=<amount>&label=<label>&message=<message>
 */
function buildBip21Uri (args: Bip21QrCodeArgs): string {
  const { address, amountInDecimal, label, message } = args
  let uri = `bitcoin:${address}`

  const params: string[] = []
  if (amountInDecimal) {
    params.push(`amount=${encodeURIComponent(amountInDecimal)}`)
  }
  if (label) params.push(`label=${encodeURIComponent(label)}`)
  if (message) params.push(`message=${encodeURIComponent(message)}`)

  if (params.length > 0) {
    uri += `?${params.join('&')}`
  }

  return uri
}

/**
 * Builds an EIP681 URI for Ethereum/EVM payments
 * For native tokens: ethereum:<address>?value=<value>
 * For ERC20 tokens: ethereum:<tokenAddress>@<chainId>/transfer?address=<recipient>&uint256=<amount>
 */
function buildEip681Uri (args: Eip681QrCodeArgs): string {
  const { address, value, chainId, tokenAddress, recipient, uint256 } = args

  // ERC20 token transfer
  if (tokenAddress && recipient && uint256) {
    const chainIdParam = chainId ? `@${chainId}` : ''
    return `ethereum:${tokenAddress}${chainIdParam}/transfer?address=${recipient}&uint256=${uint256}`
  }

  // Native token payment
  let uri = `ethereum:${address}`
  const params: string[] = []
  if (value) params.push(`value=${value}`)
  if (chainId && !tokenAddress) params.push(`chainId=${chainId}`)

  if (params.length > 0) {
    uri += `?${params.join('&')}`
  }

  return uri
}
