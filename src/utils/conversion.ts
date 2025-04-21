export const satToWei: (value: bigint | number) => bigint = (value: bigint | number) => BigInt(value) * BigInt(10 ** 10)

export const arrayToHexKey: (key: Uint8Array) => string = (key: Uint8Array) => {
  if (key.length === 0) {
    return ''
  }
  return key.toString()
    .split(',')
    .map((byte) => parseInt(byte).toString(16).padStart(2, '0'))
    .join('')
}
