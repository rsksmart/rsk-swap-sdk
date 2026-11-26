import { networks, type Network } from 'bitcoinjs-lib'
import { type RskSwapEnvironment } from '../constants/environment'

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

const BITCOIN_NETWORKS: Record<RskSwapEnvironment['bitcoinNetwork'], Network> = {
  mainnet: networks.bitcoin,
  testnet: networks.testnet,
  regtest: networks.regtest
}

export function getBitcoinNetwork (environment: RskSwapEnvironment): Network {
  return BITCOIN_NETWORKS[environment.bitcoinNetwork]
}
