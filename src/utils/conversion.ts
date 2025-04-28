export const satToWei: (value: bigint | number) => bigint = (value: bigint | number) => BigInt(value) * BigInt(10 ** 10)
