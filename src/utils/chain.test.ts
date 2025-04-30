import { describe, test, expect } from '@jest/globals'
import { isBtcChain, isLightningNetwork, isRskChain, isEvmChain } from './chain'

describe('chain utility functions', () => {
  describe('isBtcChain', () => {
    test('should return true for "BTC"', () => {
      expect(isBtcChain('BTC')).toBe(true)
    })

    test('should return false for other values', () => {
      expect(isBtcChain('ETH')).toBe(false)
      expect(isBtcChain('LN')).toBe(false)
      expect(isBtcChain('')).toBe(false)
    })
  })

  describe('isLightningNetwork', () => {
    test('should return true for "LN"', () => {
      expect(isLightningNetwork('LN')).toBe(true)
    })

    test('should return false for other values', () => {
      expect(isLightningNetwork('BTC')).toBe(false)
      expect(isLightningNetwork('ETH')).toBe(false)
      expect(isLightningNetwork('')).toBe(false)
    })
  })

  describe('isRskChain', () => {
    test('should return true for RSK chain IDs', () => {
      expect(isRskChain('30')).toBe(true)
      expect(isRskChain('31')).toBe(true)
      expect(isRskChain('33')).toBe(true)
      expect(isRskChain(30)).toBe(true)
      expect(isRskChain(31)).toBe(true)
      expect(isRskChain(33)).toBe(true)
    })

    test('should return false for non-RSK chain IDs', () => {
      expect(isRskChain('1')).toBe(false)
      expect(isRskChain('')).toBe(false)
      expect(isRskChain(1)).toBe(false)
    })
  })

  describe('isEvmChain', () => {
    test('should return true for non-BTC and non-Lightning Network values', () => {
      expect(isEvmChain('ETH')).toBe(true)
      expect(isEvmChain('30')).toBe(true)
    })

    test('should return false for BTC and Lightning Network values', () => {
      expect(isEvmChain('BTC')).toBe(false)
      expect(isEvmChain('LN')).toBe(false)
    })
  })
})
