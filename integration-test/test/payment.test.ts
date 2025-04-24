import { RskSwapSDK, type CreateSwapArgs } from '@rsksmart/rsk-swap-sdk'
import { describe, test, beforeAll, expect } from '@jest/globals'
import { assertTruthy, BlockchainConnection, ethers } from '@rsksmart/bridges-core-sdk'
import { readFile } from 'fs/promises'
import { EXTENDED_TIMEOUT } from './common/constants'

function assertErc20Transfer (receipt: ethers.ContractReceipt, expectedFrom: string, expectedTo: string, expectedValue: string): void {
  const abi = ['event Transfer(address indexed from, address indexed to, uint256 value)']
  const iface = new ethers.utils.Interface(abi)
  const logs = receipt.logs.map(log => iface.parseLog(log)).filter(log => log !== null)
  expect(receipt.status).toBe(1)
  expect(logs.length).toBe(1)
  const log = logs[0]
  assertTruthy(log)
  expect(log.name).toBe('Transfer')
  expect(log.args.from.toLowerCase()).toBe(expectedFrom)
  expect(log.args.to.toLowerCase()).toBe(expectedTo)
  expect(log.args.value.toString()).toBe(expectedValue)
}

describe('RSK Swap SDK payment execution should', () => {
  let sdk: RskSwapSDK
  let blockchainConnection: BlockchainConnection
  let config: { rskSwap: { ethereumForkRpc: string, bnbForkRpc: string } }
  let credentials: { encryptedJson: any, password: string }

  beforeAll(async () => {
    const credentialsBuffer = await readFile('fake-credentials.json')
    credentials = JSON.parse(credentialsBuffer.toString())
    const configBuffer = await readFile('config.json')
    config = JSON.parse(configBuffer.toString())
    blockchainConnection = await BlockchainConnection.createUsingEncryptedJson(
      credentials.encryptedJson,
      credentials.password,
      config.rskSwap.ethereumForkRpc
    )
    sdk = new RskSwapSDK('Local', blockchainConnection)
  }, EXTENDED_TIMEOUT)

  test('execute an ETH payment to get RBTC', async () => {
    const value = BigInt('250000000000000000')
    const args: CreateSwapArgs = {
      fromAmount: value,
      fromToken: 'ETH',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '1',
      providerId: 'CHANGELLY',
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c'
    }
    const result = await sdk.createNewSwap(args)
    const txHash = await sdk.executeSwap(result.action)
    const receipt = await blockchainConnection.getTransactionReceipt(txHash)
    assertTruthy(receipt)
    const tx = await blockchainConnection.signer.provider?.getTransaction(receipt.transactionHash)
    expect(receipt?.status).toBe(1)
    expect(receipt?.logs.length).toBe(0)
    expect(receipt?.from.toLowerCase()).toBe('0x9d93929a9099be4355fc2389fbf253982f9df47c')
    expect(receipt?.to.toLowerCase()).toBe(result.swap.paymentAddress)
    expect(tx?.value.toString()).toBe(value.toString())
  }, EXTENDED_TIMEOUT)

  test('execute an USDT payment to get RBTC', async () => {
    const value = BigInt('60000000')
    const args: CreateSwapArgs = {
      fromAmount: value,
      fromToken: 'USDT',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '1',
      providerId: 'CHANGELLY',
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c'
    }
    const result = await sdk.createNewSwap(args)
    const txHash = await sdk.executeSwap(result.action)
    const receipt = await blockchainConnection.getTransactionReceipt(txHash)
    assertTruthy(receipt)
    assertErc20Transfer(receipt, '0x9d93929a9099be4355fc2389fbf253982f9df47c', result.swap.paymentAddress, value.toString())
  }, EXTENDED_TIMEOUT)

  test.skip('execute an DAI payment to get RBTC', async () => {
    const value = BigInt('60000000000000000000')
    const args: CreateSwapArgs = {
      fromAmount: value,
      fromToken: 'DAI',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '1',
      providerId: 'CHANGELLY',
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c'
    }
    const result = await sdk.createNewSwap(args)
    const txHash = await sdk.executeSwap(result.action)
    const receipt = await blockchainConnection.getTransactionReceipt(txHash)
    assertTruthy(receipt)
    assertErc20Transfer(receipt, '0x9d93929a9099be4355fc2389fbf253982f9df47c', result.swap.paymentAddress, value.toString())
  }, EXTENDED_TIMEOUT)

  test('execute an USDC payment to get RBTC', async () => {
    const value = BigInt('60000000')
    const args: CreateSwapArgs = {
      fromAmount: value,
      fromToken: 'USDC',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '1',
      providerId: 'CHANGELLY',
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c'
    }
    const result = await sdk.createNewSwap(args)
    const txHash = await sdk.executeSwap(result.action)
    const receipt = await blockchainConnection.getTransactionReceipt(txHash)
    assertTruthy(receipt)
    assertErc20Transfer(receipt, '0x9d93929a9099be4355fc2389fbf253982f9df47c', result.swap.paymentAddress, value.toString())
  }, EXTENDED_TIMEOUT)

  test('execute an WBTC payment to get RBTC', async () => {
    const value = BigInt('500000')
    const args: CreateSwapArgs = {
      fromAmount: value,
      fromToken: 'WBTC',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '1',
      providerId: 'CHANGELLY',
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c'
    }
    const result = await sdk.createNewSwap(args)
    const txHash = await sdk.executeSwap(result.action)
    const receipt = await blockchainConnection.getTransactionReceipt(txHash)
    assertTruthy(receipt)
    assertErc20Transfer(receipt, '0x9d93929a9099be4355fc2389fbf253982f9df47c', result.swap.paymentAddress, value.toString())
  }, EXTENDED_TIMEOUT)

  test('execute an BNB payment to get RBTC', async () => {
    const bnbConnection = await BlockchainConnection.createUsingEncryptedJson(
      credentials.encryptedJson,
      credentials.password,
      config.rskSwap.bnbForkRpc
    )
    sdk.changeConnection(bnbConnection)
    const value = BigInt('1200000000000000000')
    const args: CreateSwapArgs = {
      fromAmount: value,
      fromToken: 'BNB',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '56',
      providerId: 'CHANGELLY',
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c'
    }
    const result = await sdk.createNewSwap(args)
    const txHash = await sdk.executeSwap(result.action)
    const receipt = await bnbConnection.getTransactionReceipt(txHash)
    assertTruthy(receipt)
    const tx = await bnbConnection.signer.provider?.getTransaction(receipt.transactionHash)
    expect(receipt?.status).toBe(1)
    expect(receipt?.logs.length).toBe(0)
    expect(receipt?.from.toLowerCase()).toBe('0x9d93929a9099be4355fc2389fbf253982f9df47c')
    expect(receipt?.to.toLowerCase()).toBe(result.swap.paymentAddress)
    expect(tx?.value.toString()).toBe(value.toString())
    sdk.changeConnection(blockchainConnection)
  }, EXTENDED_TIMEOUT)
})
