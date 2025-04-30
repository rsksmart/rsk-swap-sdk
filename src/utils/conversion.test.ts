import { arrayToHexKey } from './conversion'
import { describe, expect, test } from '@jest/globals'

describe('arrayToHexKey function should', () => {
  test('convert a Uint8Array to a hexadecimal string', () => {
    const input = new Uint8Array([255, 16, 0])
    const expectedOutput = 'ff1000'
    expect(arrayToHexKey(input)).toBe(expectedOutput)
  })

  test('handle an empty Uint8Array', () => {
    const input = new Uint8Array([])
    const expectedOutput = ''
    expect(arrayToHexKey(input)).toBe(expectedOutput)
  })

  test('handle a single-byte Uint8Array', () => {
    const input = new Uint8Array([128])
    const expectedOutput = '80'
    expect(arrayToHexKey(input)).toBe(expectedOutput)
  })

  test('handle a Uint8Array with leading zeros', () => {
    const input = new Uint8Array([0, 1, 2])
    const expectedOutput = '000102'
    expect(arrayToHexKey(input)).toBe(expectedOutput)
  })
})
