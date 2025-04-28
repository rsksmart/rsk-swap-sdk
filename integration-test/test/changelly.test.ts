import { RskSwapSDK, type TxData, type CreateSwapArgs, type Swap } from '@rsksmart/rsk-swap-sdk'
import { describe, test, beforeAll, expect } from '@jest/globals'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { readFile } from 'fs/promises'
import { EXTENDED_TIMEOUT } from './common/constants'

describe('RSK Swap SDK Changelly integration should', () => {
  let sdk: RskSwapSDK
  let btcSwapId: string
  let usdtSwapId: string
  let ethSwapId: string
  let wbtcSwapId: string
  let bnbSwapId: string
  const providerId = 'CHANGELLY'

  beforeAll(async () => {
    const credentialsBuffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(credentialsBuffer.toString())
    const conn = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password)
    sdk = new RskSwapSDK('Local', conn)
  }, EXTENDED_TIMEOUT)

  test('create a swap from BTC to RBTC', async () => {
    const args: CreateSwapArgs = {
      fromAmount: BigInt('500000'),
      fromToken: 'BTC',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: 'BTC',
      providerId,
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: 'bc1q7ejdev04a9mr4yhs2dyckqs5w4hfsdvk8s732z'
    }
    const result = await sdk.createNewSwap(args)
    expect(result).toBeDefined()
    expect(result.swap).toBeDefined()
    expect(result.action).toBeDefined()
    const swap = result.swap
    const action = result.action
    expect(swap.providerSwapId).toBeDefined()
    expect(swap.providerId).toBe(providerId)
    expect(BigInt(swap.fromAmount)).toBe(args.fromAmount)
    expect(swap.fromToken).toBe(args.fromToken)
    expect(swap.toToken).toBe(args.toToken)
    expect(swap.fromNetwork).toBe(args.fromNetwork)
    expect(swap.toNetwork).toBe(args.toNetwork)
    expect(swap.receiverAddress).toBe(args.address)
    expect(swap.paymentAddress).toBeDefined()
    expect(swap.requiredConfirmations).toBeDefined()
    expect(swap.status).toBe('CREATED')
    expect(swap.usedFees).toBeDefined()
    expect(swap.usedFees.length).not.toBe(0)
    expect(swap.usedFees.at(0)?.amount).toBeDefined()
    expect(swap.usedFees.at(0)?.description).toBeDefined()
    expect(swap.usedFees.at(0)?.type).toBeDefined()
    expect(swap.context).toBeDefined()
    expect(action.type).toBe('BIP21')
    expect(action.data).toBeDefined()
    expect(typeof action.data).toBe('string')

    btcSwapId = swap.providerSwapId
  }, EXTENDED_TIMEOUT)
  test('create a swap from USDT to RBTC', async () => {
    const args: CreateSwapArgs = {
      fromAmount: BigInt('60000000'),
      fromToken: 'USDT',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '1',
      providerId,
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c'
    }
    const result = await sdk.createNewSwap(args)
    expect(result).toBeDefined()
    expect(result.swap).toBeDefined()
    expect(result.action).toBeDefined()
    const swap = result.swap
    const action = result.action
    expect(swap.providerSwapId).toBeDefined()
    expect(swap.providerId).toBe(providerId)
    expect(BigInt(swap.fromAmount)).toBe(args.fromAmount)
    expect(swap.fromToken).toBe(args.fromToken)
    expect(swap.toToken).toBe(args.toToken)
    expect(swap.fromNetwork).toBe(args.fromNetwork)
    expect(swap.toNetwork).toBe(args.toNetwork)
    expect(swap.receiverAddress).toBe(args.address)
    expect(swap.paymentAddress).toBeDefined()
    expect(swap.status).toBe('CREATED')
    expect(swap.requiredConfirmations).toBeDefined()
    expect(swap.usedFees).toBeDefined()
    expect(swap.usedFees.length).not.toBe(0)
    expect(swap.usedFees.at(0)?.amount).toBeDefined()
    expect(swap.usedFees.at(0)?.description).toBeDefined()
    expect(swap.usedFees.at(0)?.type).toBeDefined()
    expect(swap.context).toBeDefined()
    expect(action.type).toBe('ERC20-PAYMENT')
    expect(action.data).toBeDefined()
    const data = action.data as TxData
    expect(data.to).toBeDefined()
    expect(data.data.length).not.toBe(0)
    expect(data.value.length).toBe(3) // 0x0

    usdtSwapId = swap.providerSwapId
  }, EXTENDED_TIMEOUT)
  test('create a swap from ETH to RBTC', async () => {
    const args: CreateSwapArgs = {
      fromAmount: BigInt('250000000000000000'),
      fromToken: 'ETH',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '1',
      providerId,
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c'
    }
    const result = await sdk.createNewSwap(args)
    expect(result).toBeDefined()
    expect(result.swap).toBeDefined()
    expect(result.action).toBeDefined()
    const swap = result.swap
    const action = result.action
    expect(swap.providerSwapId).toBeDefined()
    expect(swap.providerId).toBe(providerId)
    expect(BigInt(swap.fromAmount)).toBe(args.fromAmount)
    expect(swap.fromToken).toBe(args.fromToken)
    expect(swap.toToken).toBe(args.toToken)
    expect(swap.fromNetwork).toBe(args.fromNetwork)
    expect(swap.toNetwork).toBe(args.toNetwork)
    expect(swap.receiverAddress).toBe(args.address)
    expect(swap.paymentAddress).toBeDefined()
    expect(swap.status).toBe('CREATED')
    expect(swap.requiredConfirmations).toBeDefined()
    expect(swap.usedFees).toBeDefined()
    expect(swap.usedFees.length).not.toBe(0)
    expect(swap.usedFees.at(0)?.amount).toBeDefined()
    expect(swap.usedFees.at(0)?.description).toBeDefined()
    expect(swap.usedFees.at(0)?.type).toBeDefined()
    expect(swap.context).toBeDefined()
    expect(action.type).toBe('EVM-NATIVE-PAYMENT')
    expect(action.data).toBeDefined()
    const data = action.data as TxData
    expect(data.to).toBeDefined()
    expect(data.data.length).toBe(2) // 0x
    expect(data.value.length).not.toBe(0)

    ethSwapId = swap.providerSwapId
  }, EXTENDED_TIMEOUT)
  test('create a swap from WBTC to RBTC', async () => {
    const args: CreateSwapArgs = {
      fromAmount: BigInt('500000'),
      fromToken: 'WBTC',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '1',
      providerId,
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c'
    }
    const result = await sdk.createNewSwap(args)
    expect(result).toBeDefined()
    expect(result.swap).toBeDefined()
    expect(result.action).toBeDefined()
    const swap = result.swap
    const action = result.action
    expect(swap.providerSwapId).toBeDefined()
    expect(swap.providerId).toBe(providerId)
    expect(BigInt(swap.fromAmount)).toBe(args.fromAmount)
    expect(swap.fromToken).toBe(args.fromToken)
    expect(swap.toToken).toBe(args.toToken)
    expect(swap.fromNetwork).toBe(args.fromNetwork)
    expect(swap.toNetwork).toBe(args.toNetwork)
    expect(swap.receiverAddress).toBe(args.address)
    expect(swap.paymentAddress).toBeDefined()
    expect(swap.status).toBe('CREATED')
    expect(swap.requiredConfirmations).toBeDefined()
    expect(swap.usedFees).toBeDefined()
    expect(swap.usedFees.length).not.toBe(0)
    expect(swap.usedFees.at(0)?.amount).toBeDefined()
    expect(swap.usedFees.at(0)?.description).toBeDefined()
    expect(swap.usedFees.at(0)?.type).toBeDefined()
    expect(swap.context).toBeDefined()
    expect(action.type).toBe('ERC20-PAYMENT')
    expect(action.data).toBeDefined()
    const data = action.data as TxData
    expect(data.to).toBeDefined()
    expect(data.data.length).not.toBe(0)
    expect(data.value.length).toBe(3) // 0x0

    wbtcSwapId = swap.providerSwapId
  }, EXTENDED_TIMEOUT)
  test('create a swap from BNB to RBTC', async () => {
    const args: CreateSwapArgs = {
      fromAmount: BigInt('1200000000000000000'),
      fromToken: 'BNB',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '56',
      providerId,
      address: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      refundAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c'
    }
    const result = await sdk.createNewSwap(args)
    expect(result).toBeDefined()
    expect(result.swap).toBeDefined()
    expect(result.action).toBeDefined()
    const swap = result.swap
    const action = result.action
    expect(swap.providerSwapId).toBeDefined()
    expect(swap.providerId).toBe(providerId)
    expect(BigInt(swap.fromAmount)).toBe(args.fromAmount)
    expect(swap.fromToken).toBe(args.fromToken)
    expect(swap.toToken).toBe(args.toToken)
    expect(swap.fromNetwork).toBe(args.fromNetwork)
    expect(swap.toNetwork).toBe(args.toNetwork)
    expect(swap.receiverAddress).toBe(args.address)
    expect(swap.paymentAddress).toBeDefined()
    expect(swap.status).toBe('CREATED')
    expect(swap.requiredConfirmations).toBeDefined()
    expect(swap.usedFees).toBeDefined()
    expect(swap.usedFees.length).not.toBe(0)
    expect(swap.usedFees.at(0)?.amount).toBeDefined()
    expect(swap.usedFees.at(0)?.description).toBeDefined()
    expect(swap.usedFees.at(0)?.type).toBeDefined()
    expect(swap.context).toBeDefined()
    expect(action.type).toBe('EVM-NATIVE-PAYMENT')
    expect(action.data).toBeDefined()
    const data = action.data as TxData
    expect(data.to).toBeDefined()
    expect(data.data.length).toBe(2) // 0x
    expect(data.value.length).not.toBe(0)

    bnbSwapId = swap.providerSwapId
  }, EXTENDED_TIMEOUT)

  test('get BTC to RBTC Swap status', async () => {
    const swap: Swap = await sdk.getSwapStatus({
      id: btcSwapId,
      providerId
    })
    expect(swap.providerSwapId).toBeDefined()
    expect(swap.providerId).toBe(providerId)
    expect(swap.fromAmount).toBeDefined()
    expect(swap.fromToken).toBeDefined()
    expect(swap.toToken).toBeDefined()
    expect(swap.fromNetwork).toBeDefined()
    expect(swap.toNetwork).toBeDefined()
    expect(swap.receiverAddress).toBeDefined()
    expect(swap.paymentAddress).toBeDefined()
    expect(swap.status).toBe('PENDING')
    expect(swap.requiredConfirmations).toBeDefined()
    expect(swap.usedFees).toBeDefined()
    expect(swap.usedFees.length).not.toBe(0)
    expect(swap.usedFees.at(0)?.amount).toBeDefined()
    expect(swap.usedFees.at(0)?.description).toBeDefined()
    expect(swap.usedFees.at(0)?.type).toBeDefined()
    expect(swap.context).toBeDefined()
  })
  test('get USDT to RBTC Swap status', async () => {
    const swap: Swap = await sdk.getSwapStatus({
      id: usdtSwapId,
      providerId
    })
    expect(swap.providerSwapId).toBeDefined()
    expect(swap.providerId).toBe(providerId)
    expect(swap.fromAmount).toBeDefined()
    expect(swap.fromToken).toBeDefined()
    expect(swap.toToken).toBeDefined()
    expect(swap.fromNetwork).toBeDefined()
    expect(swap.toNetwork).toBeDefined()
    expect(swap.receiverAddress).toBeDefined()
    expect(swap.paymentAddress).toBeDefined()
    expect(swap.status).toBe('PENDING')
    expect(swap.requiredConfirmations).toBeDefined()
    expect(swap.usedFees).toBeDefined()
    expect(swap.usedFees.length).not.toBe(0)
    expect(swap.usedFees.at(0)?.amount).toBeDefined()
    expect(swap.usedFees.at(0)?.description).toBeDefined()
    expect(swap.usedFees.at(0)?.type).toBeDefined()
    expect(swap.context).toBeDefined()
  })
  test('get ETH to RBTC Swap status', async () => {
    const swap: Swap = await sdk.getSwapStatus({
      id: ethSwapId,
      providerId
    })
    expect(swap.providerSwapId).toBeDefined()
    expect(swap.providerId).toBe(providerId)
    expect(swap.fromAmount).toBeDefined()
    expect(swap.fromToken).toBeDefined()
    expect(swap.toToken).toBeDefined()
    expect(swap.fromNetwork).toBeDefined()
    expect(swap.toNetwork).toBeDefined()
    expect(swap.receiverAddress).toBeDefined()
    expect(swap.paymentAddress).toBeDefined()
    expect(swap.status).toBe('PENDING')
    expect(swap.requiredConfirmations).toBeDefined()
    expect(swap.usedFees).toBeDefined()
    expect(swap.usedFees.length).not.toBe(0)
    expect(swap.usedFees.at(0)?.amount).toBeDefined()
    expect(swap.usedFees.at(0)?.description).toBeDefined()
    expect(swap.usedFees.at(0)?.type).toBeDefined()
    expect(swap.context).toBeDefined()
  })
  test('get WBTC to RBTC Swap status', async () => {
    const swap: Swap = await sdk.getSwapStatus({
      id: wbtcSwapId,
      providerId
    })
    expect(swap.providerSwapId).toBeDefined()
    expect(swap.providerId).toBe(providerId)
    expect(swap.fromAmount).toBeDefined()
    expect(swap.fromToken).toBeDefined()
    expect(swap.toToken).toBeDefined()
    expect(swap.fromNetwork).toBeDefined()
    expect(swap.toNetwork).toBeDefined()
    expect(swap.receiverAddress).toBeDefined()
    expect(swap.paymentAddress).toBeDefined()
    expect(swap.status).toBe('PENDING')
    expect(swap.requiredConfirmations).toBeDefined()
    expect(swap.usedFees).toBeDefined()
    expect(swap.usedFees.length).not.toBe(0)
    expect(swap.usedFees.at(0)?.amount).toBeDefined()
    expect(swap.usedFees.at(0)?.description).toBeDefined()
    expect(swap.usedFees.at(0)?.type).toBeDefined()
    expect(swap.context).toBeDefined()
  })
  test('get BNB to RBTC Swap status', async () => {
    const swap: Swap = await sdk.getSwapStatus({
      id: bnbSwapId,
      providerId
    })
    expect(swap.providerSwapId).toBeDefined()
    expect(swap.providerId).toBe(providerId)
    expect(swap.fromAmount).toBeDefined()
    expect(swap.fromToken).toBeDefined()
    expect(swap.toToken).toBeDefined()
    expect(swap.fromNetwork).toBeDefined()
    expect(swap.toNetwork).toBeDefined()
    expect(swap.receiverAddress).toBeDefined()
    expect(swap.paymentAddress).toBeDefined()
    expect(swap.status).toBe('PENDING')
    expect(swap.requiredConfirmations).toBeDefined()
    expect(swap.usedFees).toBeDefined()
    expect(swap.usedFees.length).not.toBe(0)
    expect(swap.usedFees.at(0)?.amount).toBeDefined()
    expect(swap.usedFees.at(0)?.description).toBeDefined()
    expect(swap.usedFees.at(0)?.type).toBeDefined()
    expect(swap.context).toBeDefined()
  })
})
