export function isBtcChain (value: string): boolean {
  return value === 'BTC'
}

export function isLightningNetwork (value: string): boolean {
  return value === 'LN'
}

export function isRskChain (value: string | number): boolean {
  return ['30', '31', '33'].includes(value.toString())
}

export function isEvmChain (value: string): boolean {
  return Boolean(value) && !isBtcChain(value) && !isLightningNetwork(value)
}
