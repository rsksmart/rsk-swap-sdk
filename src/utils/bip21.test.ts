import { describe, expect, test } from '@jest/globals'
import { networks } from 'bitcoinjs-lib'
import { buildBip21Uri } from './bip21'

describe('buildBip21Uri should', () => {
  test('build a URI with address only', () => {
    expect(buildBip21Uri({ address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' }, networks.bitcoin))
      .toBe('bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
  })

  test('build a URI with amount, label and message', () => {
    const uri = buildBip21Uri({
      address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      amountInDecimal: '0.01',
      label: 'Payment & Swap',
      message: 'Amount: $100 USD'
    }, networks.bitcoin)
    expect(uri).toBe('bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.01&label=Payment%20%26%20Swap&message=Amount%3A%20%24100%20USD')
  })

  test('accept a taproot address', () => {
    expect(buildBip21Uri({ address: 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297', amountInDecimal: '1.0' }, networks.bitcoin))
      .toBe('bitcoin:bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297?amount=1.0')
  })

  test('accept a testnet address on testnet', () => {
    expect(buildBip21Uri({ address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx' }, networks.testnet))
      .toBe('bitcoin:tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')
  })

  test('accept a regtest address on regtest', () => {
    expect(buildBip21Uri({ address: 'bcrt1qqyqszqgpqyqszqgpqyqszqgpqyqszqgpvxat9t' }, networks.regtest))
      .toBe('bitcoin:bcrt1qqyqszqgpqyqszqgpqyqszqgpqyqszqgpvxat9t')
  })

  test.each([
    ['an address with a query string', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.019&x=', networks.bitcoin],
    ['a testnet address on mainnet', 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', networks.bitcoin],
    ['a mainnet address on testnet', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', networks.testnet],
    ['a regtest address on mainnet', 'bcrt1qqyqszqgpqyqszqgpqyqszqgpqyqszqgpvxat9t', networks.bitcoin],
    ['a regtest address on testnet', 'bcrt1qqyqszqgpqyqszqgpqyqszqgpqyqszqgpvxat9t', networks.testnet],
    ['an EVM address', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', networks.bitcoin]
  ])('reject %s', (_, address, network) => {
    expect(() => buildBip21Uri({ address, amountInDecimal: '0.01' }, network)).toThrow(`Invalid Bitcoin address: ${address}`)
  })
})
