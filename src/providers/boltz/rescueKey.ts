import { createHash } from 'crypto'
import * as bip39 from 'bip39'
import BIP32Factory from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { type ECPairInterface, type ECPairAPI } from 'ecpair'

// Non-hardened path — strictly required for Boltz Web App rescue tool compatibility.
// Since each swap has its own mnemonic, the swap key is always at index 0.
const BOLTZ_ACCOUNT_PATH = 'm/44/0/0/0'
const SWAP_KEY_INDEX = 0

export function generateRescueMnemonic (): string {
  return bip39.generateMnemonic(128) // 128-bit entropy → 12 words
}

export function deriveSwapKey (mnemonic: string, keyFactory: ECPairAPI): ECPairInterface {
  const bip32 = BIP32Factory(ecc)
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed)
  const child = root.derivePath(`${BOLTZ_ACCOUNT_PATH}/${SWAP_KEY_INDEX}`)
  if (child.privateKey === undefined || child.privateKey === null) {
    throw new Error('Failed to derive swap private key from mnemonic')
  }
  return keyFactory.fromPrivateKey(child.privateKey)
}

export function deriveSwapPreimage (mnemonic: string, keyFactory: ECPairAPI): Buffer {
  const key = deriveSwapKey(mnemonic, keyFactory)
  if (key.privateKey === undefined || key.privateKey === null) {
    throw new Error('Missing private key for preimage derivation')
  }
  // Boltz required formula: preimage = sha256(privateKey)
  return Buffer.from(createHash('sha256').update(key.privateKey).digest())
}

export function deriveXpub (mnemonic: string): string {
  const bip32 = BIP32Factory(ecc)
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed)
  return root.derivePath(BOLTZ_ACCOUNT_PATH).neutered().toBase58()
}
