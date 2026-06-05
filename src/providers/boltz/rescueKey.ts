import { sha256 } from '@noble/hashes/sha256'
import * as bip39 from 'bip39'
import BIP32Factory from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { type ECPairInterface, type ECPairAPI } from 'ecpair'

// Non-hardened path — strictly required for Boltz Web App rescue tool compatibility.
// Since each swap has its own mnemonic, the swap key is always at index 0.
const BOLTZ_ACCOUNT_PATH = 'm/44/0/0/0'
const SWAP_KEY_INDEX = 0

const bip32 = BIP32Factory(ecc)

function assertValidMnemonic (mnemonic: string): void {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid BIP39 mnemonic')
  }
}

export function generateRescueMnemonic (): string {
  return bip39.generateMnemonic(128) // 128-bit entropy → 12 words
}

export function deriveSwapKey (mnemonic: string, keyFactory: ECPairAPI): ECPairInterface {
  assertValidMnemonic(mnemonic)
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const root = bip32.fromSeed(seed)
  const child = root.derivePath(`${BOLTZ_ACCOUNT_PATH}/${SWAP_KEY_INDEX}`)
  if (child.privateKey === undefined || child.privateKey === null) {
    throw new Error('Failed to derive swap private key from mnemonic')
  }
  return keyFactory.fromPrivateKey(child.privateKey)
}

export function deriveSwapKeyAndPreimage (mnemonic: string, keyFactory: ECPairAPI): { keys: ECPairInterface, preimage: Buffer } {
  const keys = deriveSwapKey(mnemonic, keyFactory)
  if (keys.privateKey === undefined || keys.privateKey === null) {
    throw new Error('Missing private key for preimage derivation')
  }
  // Boltz required formula: preimage = sha256(privateKey)
  const preimage = Buffer.from(sha256(keys.privateKey))
  return { keys, preimage }
}
