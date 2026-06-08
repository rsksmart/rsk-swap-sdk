import { describe, expect, test, beforeAll } from '@jest/globals'
import { generateRescueMnemonic, deriveSwapKey, deriveSwapKeyAndPreimage } from './rescueKey'
import { sha256 } from '@noble/hashes/sha256'
import { bytesToHex } from '@noble/hashes/utils'
import { ethers } from '@rsksmart/bridges-core-sdk'
import * as bip39 from 'bip39'
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

    test('throws on invalid mnemonic', () => {
      expect(() => deriveSwapKey('not a valid mnemonic', keyFactory)).toThrow('Invalid BIP39 mnemonic')
    })
  })

  describe('deriveSwapKeyAndPreimage', () => {
    test('should return a valid EC key pair and 32-byte preimage', () => {
      const { keys, preimage } = deriveSwapKeyAndPreimage(KNOWN_MNEMONIC, keyFactory)
      expect(keys.publicKey).toHaveLength(33)
      expect(keys.privateKey).toHaveLength(32)
      expect(preimage).toBeInstanceOf(Uint8Array)
      expect(preimage).toHaveLength(32)
    })

    test('should be deterministic — same mnemonic always yields same output', () => {
      const r1 = deriveSwapKeyAndPreimage(KNOWN_MNEMONIC, keyFactory)
      const r2 = deriveSwapKeyAndPreimage(KNOWN_MNEMONIC, keyFactory)
      expect(Buffer.from(r1.keys.publicKey).toString('hex')).toBe(Buffer.from(r2.keys.publicKey).toString('hex'))
      expect(bytesToHex(r1.preimage)).toBe(bytesToHex(r2.preimage))
    })

    test('preimage should equal sha256(privateKey) — Boltz required formula', () => {
      const { keys, preimage } = deriveSwapKeyAndPreimage(KNOWN_MNEMONIC, keyFactory)
      const expected = sha256(keys.privateKey!)
      expect(bytesToHex(preimage)).toBe(bytesToHex(expected))
    })

    test('should return different outputs for different mnemonics', () => {
      const otherMnemonic = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'
      const r1 = deriveSwapKeyAndPreimage(KNOWN_MNEMONIC, keyFactory)
      const r2 = deriveSwapKeyAndPreimage(otherMnemonic, keyFactory)
      expect(Buffer.from(r1.keys.publicKey).toString('hex')).not.toBe(Buffer.from(r2.keys.publicKey).toString('hex'))
      expect(bytesToHex(r1.preimage)).not.toBe(bytesToHex(r2.preimage))
    })

    test('throws on invalid mnemonic', () => {
      expect(() => deriveSwapKeyAndPreimage('not a valid mnemonic', keyFactory)).toThrow('Invalid BIP39 mnemonic')
    })
  })

  describe('known-vector assertions — cross-checked against ethers HDNode (m/44/0/0/0/0)', () => {
    // ethers.utils.HDNode is a completely independent BIP32 implementation.
    // Cross-checking here catches a wrong derivation path, wrong index, or wrong preimage formula.

    test('deriveSwapKey public key matches ethers HDNode at Boltz path', () => {
      const ref = ethers.utils.HDNode.fromMnemonic(KNOWN_MNEMONIC).derivePath('m/44/0/0/0/0')
      const key = deriveSwapKey(KNOWN_MNEMONIC, keyFactory)
      expect(Buffer.from(key.publicKey).toString('hex')).toBe(ref.publicKey.slice(2))
    })

    test('deriveSwapKeyAndPreimage matches ethers-derived sha256(privateKey) at Boltz path', () => {
      const ref = ethers.utils.HDNode.fromMnemonic(KNOWN_MNEMONIC).derivePath('m/44/0/0/0/0')
      const expectedPreimage = ethers.utils.sha256(ref.privateKey).slice(2)
      const { keys, preimage } = deriveSwapKeyAndPreimage(KNOWN_MNEMONIC, keyFactory)
      expect(Buffer.from(keys.publicKey).toString('hex')).toBe(ref.publicKey.slice(2))
      expect(bytesToHex(preimage)).toBe(expectedPreimage)
    })
  })
})
