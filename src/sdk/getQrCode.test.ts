import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import { getQrCode, type GetQrCodeArgs, type Bip21QrCodeArgs, type Eip681QrCodeArgs, type LightningQrCodeArgs } from './getQrCode'

// Get the mocked function after jest.mock is called
import { toDataURL } from 'qrcode'

jest.mock('qrcode', () => ({
  toDataURL: jest.fn<any>()
}))
const mockedToDataURL = toDataURL as jest.MockedFunction<any>

describe('getQrCode function', () => {
  const mockQrCodeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  beforeEach(() => {
    jest.clearAllMocks()
    mockedToDataURL.mockResolvedValue(mockQrCodeDataUrl)
  })

  describe('BIP-21 (Bitcoin Payment URIs)', () => {
    test('generates QR code for Bitcoin payment with address only', async () => {
      const data: Bip21QrCodeArgs = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      }
      const args: GetQrCodeArgs = {
        type: 'BIP-21',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
      expect(mockedToDataURL).toHaveBeenCalledTimes(1)
    })

    test('generates QR code for Bitcoin payment with amount', async () => {
      const data: Bip21QrCodeArgs = {
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        amountInDecimal: '0.001'
      }
      const args: GetQrCodeArgs = {
        type: 'BIP-21',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.001')
    })

    test('generates QR code for Bitcoin payment with amount, label, and message', async () => {
      const data: Bip21QrCodeArgs = {
        address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
        amountInDecimal: '0.5',
        label: 'Swap Payment',
        message: 'Payment for RSK swap'
      }
      const args: GetQrCodeArgs = {
        type: 'BIP-21',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=0.5&label=Swap%20Payment&message=Payment%20for%20RSK%20swap')
    })

    test('handles special characters in label and message with proper encoding', async () => {
      const data: Bip21QrCodeArgs = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        label: 'Payment & Swap',
        message: 'Amount: $100 USD'
      }
      const args: GetQrCodeArgs = {
        type: 'BIP-21',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?label=Payment%20%26%20Swap&message=Amount%3A%20%24100%20USD')
    })

    test('handles P2SH address format', async () => {
      const data: Bip21QrCodeArgs = {
        address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        amountInDecimal: '1.5'
      }
      const args: GetQrCodeArgs = {
        type: 'BIP-21',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('bitcoin:3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy?amount=1.5')
    })
  })

  describe('EIP-681 (Ethereum Payment URIs)', () => {
    test('generates QR code for native ETH payment with address only', async () => {
      const data: Eip681QrCodeArgs = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
      }
      const args: GetQrCodeArgs = {
        type: 'EIP-681',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')
    })

    test('generates QR code for native ETH payment with value and chainId (RSK Mainnet)', async () => {
      const data: Eip681QrCodeArgs = {
        address: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
        value: '1000000000000000000', // 1 ETH in wei
        chainId: 30 // RSK Mainnet
      }
      const args: GetQrCodeArgs = {
        type: 'EIP-681',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('ethereum:0x9D93929A9099be4355fC2389FbF253982F9dF47c?value=1000000000000000000&chainId=30')
    })

    test('generates QR code for native ETH payment on RSK Testnet', async () => {
      const data: Eip681QrCodeArgs = {
        address: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        value: '500000000000000000', // 0.5 ETH in wei
        chainId: 31 // RSK Testnet
      }
      const args: GetQrCodeArgs = {
        type: 'EIP-681',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('ethereum:0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db?value=500000000000000000&chainId=31')
    })

    test('generates QR code for ERC20 token transfer on RSK Mainnet', async () => {
      const data: Eip681QrCodeArgs = {
        address: '0x0000000000000000000000000000000000000001', // Token address
        tokenAddress: '0x0000000000000000000000000000000000000001',
        recipient: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
        uint256: '1000000000000000000', // Token amount (18 decimals)
        chainId: 30 // RSK Mainnet
      }
      const args: GetQrCodeArgs = {
        type: 'EIP-681',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('ethereum:0x0000000000000000000000000000000000000001@30/transfer?address=0x9D93929A9099be4355fC2389FbF253982F9dF47c&uint256=1000000000000000000')
    })

    test('generates QR code for ERC20 token transfer without chainId', async () => {
      const data: Eip681QrCodeArgs = {
        address: '0x0000000000000000000000000000000000000002', // USDC token
        tokenAddress: '0x0000000000000000000000000000000000000002',
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        uint256: '1000000' // 1 USDC (6 decimals)
      }
      const args: GetQrCodeArgs = {
        type: 'EIP-681',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('ethereum:0x0000000000000000000000000000000000000002/transfer?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&uint256=1000000')
    })

    test('generates QR code for native ETH payment with value only (no chainId)', async () => {
      const data: Eip681QrCodeArgs = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: '250000000000000000' // 0.25 ETH in wei
      }
      const args: GetQrCodeArgs = {
        type: 'EIP-681',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('ethereum:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb?value=250000000000000000')
    })
  })

  describe('BOLT11 (Lightning Network Payment Requests)', () => {
    test('generates QR code for Lightning payment invoice', async () => {
      const bolt11Invoice = 'lnbc1u1pn6l3w9pp5sqc4rzksna7s9hywvq68dql9dgkezy2v98jy6mp93e2nhp55hemssp5v63fszy4rg07jr9wq3j77jrdlkpukgh7jhpa6s4pnwvm56mpwv4sdqqcqzynxqyz5vq9qlzqqqqqqqqqqqqqqqqqqqqqqqqqq9qsqfppqae00zxdre6mkvc7elsr73pkrn8dm52dqrzjq2gyp9za7vc7vd8m59fvu63pu00u4pak35n4upuv4mhyw5l586dvh7rv45jtam8pusqqqqqpqqqqqzsqqc82cvkfhff3k9n5mz2d9lvkjar3xp3nc26jspjhetpdqan96765pju2qqge8glf3fyycvdw5lc7d3gs6vcpwqtl8qfecztut0r2glslspp8yq3v'
      const data: LightningQrCodeArgs = {
        lnPaymentString: bolt11Invoice
      }
      const args: GetQrCodeArgs = {
        type: 'BOLT11',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith(bolt11Invoice)
      expect(mockedToDataURL).toHaveBeenCalledTimes(1)
    })

    test('generates QR code for a shorter Lightning invoice', async () => {
      const bolt11Invoice = 'lnbc100n1pn6l3w9pp5sqc4rzksna7s9hywvq68dql9dgkezy2v98jy6mp93e2nhp55hemssp5v63fszy4rg07jr9wq3j77jrdlkpukgh7jhpa6s4pnwvm56mpwv4sdqqcqzynxqyz5vq9qlzqqqqqqqqqqqqqqqqqqqqqqqqqq9qsqfppqae00zxdre6mkvc7elsr73pkrn8dm52dqrzjq2gyp9za7vc7vd8m59fvu63pu00u4pak35n4upuv4mhyw5l586dvh7rv45jtam8pusqqqqqpqqqqqzsqqc82cvkfhff3k9n5mz2d9lvkjar3xp3nc26jspjhetpdqan96765pju2qqge8glf3fyycvdw5lc7d3gs6vcpwqtl8qfecztut0r2glslspp8yq3v'
      const data: LightningQrCodeArgs = {
        lnPaymentString: bolt11Invoice
      }
      const args: GetQrCodeArgs = {
        type: 'BOLT11',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith(bolt11Invoice)
    })
  })

  describe('Error handling', () => {
    test('throws error for unsupported QR code type', async () => {
      const args = {
        type: 'UNSUPPORTED' as any,
        data: {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
        }
      }

      await expect(getQrCode(args)).rejects.toThrow('Unsupported QR code type: UNSUPPORTED')
    })

    test('throws error when QR code generation fails', async () => {
      const qrError = new Error('QR code generation failed')
      mockedToDataURL.mockRejectedValueOnce(qrError)

      const data: Bip21QrCodeArgs = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      }
      const args: GetQrCodeArgs = {
        type: 'BIP-21',
        data
      }

      await expect(getQrCode(args)).rejects.toThrow('Error generating QR code: QR code generation failed')
    })

    test('propagates error message from underlying library', async () => {
      const qrError = new Error('Invalid input data')
      mockedToDataURL.mockRejectedValueOnce(qrError)

      const data: Eip681QrCodeArgs = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
      }
      const args: GetQrCodeArgs = {
        type: 'EIP-681',
        data
      }

      await expect(getQrCode(args)).rejects.toThrow('Error generating QR code: Invalid input data')
    })
  })

  describe('Real-world swap scenarios', () => {
    test('Bitcoin to RBTC swap - BIP21 payment', async () => {
      const data: Bip21QrCodeArgs = {
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        amountInDecimal: '0.01',
        label: 'RSK Swap Payment',
        message: 'Swap 0.01 BTC to RBTC'
      }
      const args: GetQrCodeArgs = {
        type: 'BIP-21',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.01&label=RSK%20Swap%20Payment&message=Swap%200.01%20BTC%20to%20RBTC')
    })

    test('ERC20 token payment on RSK - EIP681 transfer', async () => {
      // Example: USDT on RSK Mainnet
      const data: Eip681QrCodeArgs = {
        address: '0x0000000000000000000000000000000000000003', // USDT token address on RSK
        tokenAddress: '0x0000000000000000000000000000000000000003',
        recipient: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
        uint256: '100000000', // 100 USDT (6 decimals)
        chainId: 30 // RSK Mainnet
      }
      const args: GetQrCodeArgs = {
        type: 'EIP-681',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('ethereum:0x0000000000000000000000000000000000000003@30/transfer?address=0x9D93929A9099be4355fC2389FbF253982F9dF47c&uint256=100000000')
    })

    test('Native RBTC payment on RSK Testnet - EIP681', async () => {
      const data: Eip681QrCodeArgs = {
        address: '0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db',
        value: '100000000000000000', // 0.1 RBTC in wei
        chainId: 31 // RSK Testnet
      }
      const args: GetQrCodeArgs = {
        type: 'EIP-681',
        data
      }

      const result = await getQrCode(args)

      expect(result).toBe(mockQrCodeDataUrl)
      expect(mockedToDataURL).toHaveBeenCalledWith('ethereum:0x4217BD283e9Dc9A2cE3d5D20fAE34AA0902C28db?value=100000000000000000&chainId=31')
    })
  })
})
