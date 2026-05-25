import { describe, expect, test, beforeAll } from '@jest/globals'
import { generateRescueMnemonic, deriveSwapKey, deriveSwapPreimage, deriveXpub } from './rescueKey'
import { createHash } from 'crypto'
import * as bip39 from 'bip39'
import BIP32Factory from 'bip32'
import * as ecpair from 'ecpair'
import { initEccLib } from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'

const KNOWN_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

describe('rescueKey', () => {
  let keyFactory: ecpair.ECPairAPI

  beforeAll(() => {
    initEccLib(ecc)
    keyFactory = ecpair.ECPairFactory(ecc)
  })

  describe('generateRescueMnemonic', () => {
    test('should return a 12-word mnemonic', () => {
      const mnemonic = generateRescueMnemonic()
      expect(mnemonic.split(' ')).toHaveLength(12)
    })

    test('should return a valid BIP39 mnemonic', () => {
      const mnemonic = generateRescueMnemonic()
      expect(bip39.validateMnemonic(mnemonic)).toBe(true)
    })

    test('should return a different mnemonic on each call', () => {
      const m1 = generateRescueMnemonic()
      const m2 = generateRescueMnemonic()
      expect(m1).not.toBe(m2)
    })
  })

  describe('deriveSwapKey', () => {
    test('should return a valid EC key pair', () => {
      const key = deriveSwapKey(KNOWN_MNEMONIC, keyFactory)
      expect(key.publicKey).toHaveLength(33)
      expect(key.privateKey).toHaveLength(32)
    })

    test('should be deterministic — same mnemonic always yields same key', () => {
      const key1 = deriveSwapKey(KNOWN_MNEMONIC, keyFactory)
      const key2 = deriveSwapKey(KNOWN_MNEMONIC, keyFactory)
      expect(Buffer.from(key1.publicKey).toString('hex')).toBe(Buffer.from(key2.publicKey).toString('hex'))
      expect(Buffer.from(key1.privateKey!).toString('hex')).toBe(Buffer.from(key2.privateKey!).toString('hex'))
    })

    test('should return different keys for different mnemonics', () => {
      const otherMnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'
      const key1 = deriveSwapKey(KNOWN_MNEMONIC, keyFactory)
      const key2 = deriveSwapKey(otherMnemonic, keyFactory)
      expect(Buffer.from(key1.publicKey).toString('hex')).not.toBe(Buffer.from(key2.publicKey).toString('hex'))
    })
  })

  describe('deriveSwapPreimage', () => {
    test('should return a 32-byte Buffer', () => {
      const preimage = deriveSwapPreimage(KNOWN_MNEMONIC, keyFactory)
      expect(preimage).toBeInstanceOf(Buffer)
      expect(preimage).toHaveLength(32)
    })

    test('should be deterministic — same mnemonic always yields same preimage', () => {
      const p1 = deriveSwapPreimage(KNOWN_MNEMONIC, keyFactory)
      const p2 = deriveSwapPreimage(KNOWN_MNEMONIC, keyFactory)
      expect(p1.toString('hex')).toBe(p2.toString('hex'))
    })

    test('should equal sha256(privateKey) — Boltz required formula', () => {
      const key = deriveSwapKey(KNOWN_MNEMONIC, keyFactory)
      const expectedPreimage = createHash('sha256').update(key.privateKey!).digest()
      const actualPreimage = deriveSwapPreimage(KNOWN_MNEMONIC, keyFactory)
      expect(actualPreimage.toString('hex')).toBe(Buffer.from(expectedPreimage).toString('hex'))
    })

    test('should return different preimages for different mnemonics', () => {
      const otherMnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'
      const p1 = deriveSwapPreimage(KNOWN_MNEMONIC, keyFactory)
      const p2 = deriveSwapPreimage(otherMnemonic, keyFactory)
      expect(p1.toString('hex')).not.toBe(p2.toString('hex'))
    })
  })

  describe('deriveXpub', () => {
    test('should return a string starting with xpub', () => {
      const xpub = deriveXpub(KNOWN_MNEMONIC)
      expect(xpub).toMatch(/^xpub/)
    })

    test('should be deterministic — same mnemonic always yields same xpub', () => {
      const x1 = deriveXpub(KNOWN_MNEMONIC)
      const x2 = deriveXpub(KNOWN_MNEMONIC)
      expect(x1).toBe(x2)
    })

    test('should return different xpubs for different mnemonics', () => {
      const otherMnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'
      const x1 = deriveXpub(KNOWN_MNEMONIC)
      const x2 = deriveXpub(otherMnemonic)
      expect(x1).not.toBe(x2)
    })

    test('should be consistent with the swap key derivation', () => {
      // The xpub at m/44/0/0/0 should produce the same child[0] public key as deriveSwapKey
      const bip32 = BIP32Factory(ecc)
      const seed = bip39.mnemonicToSeedSync(KNOWN_MNEMONIC)
      const account = bip32.fromSeed(seed).derivePath('m/44/0/0/0')
      const expectedPubKey = account.derive(0).publicKey

      const swapKey = deriveSwapKey(KNOWN_MNEMONIC, keyFactory)
      expect(Buffer.from(swapKey.publicKey).toString('hex')).toBe(Buffer.from(expectedPubKey).toString('hex'))
    })
  })
})
