# Rsk Swap SDK
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/rsksmart/rsk-swap-sdk/badge)](https://scorecard.dev/viewer/?uri=github.com/rsksmart/rsk-swap-sdk)
[![CodeQL](https://github.com/rsksmart/rsk-swap-sdk/workflows/CodeQL/badge.svg)](https://github.com/rsksmart/rsk-swap-sdk/actions?query=workflow%3ACodeQL)
[![CI](https://github.com/rsksmart/rsk-swap-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/rsksmart/rsk-swap-sdk/actions/workflows/ci.yml)

Rsk Swap SDK acts eases the integration between client applications and the RSK Swap API. Which is an aggregator that providers several ways to perform swaps to obtain RBTC through different 3rd party providers.

## Installation
    npm install @rsksmart/rsk-swap-sdk

## Quickstart guide (integrating into a dApp)
This section explains how to integrate this SDK into a dApp and start using it. There are two options to achieve this:
* [Build from the source code](#build-from-the-source-code)
* [Install npm package](#install-npm-package)

### Build from the source code
In this case, you're going to build the SDK locally and install it from your own file system. To achieve that you need to clone the repo by running the following commands:

1. `git clone git@github.com:rsksmart/rsk-swap-sdk.git`
2. `npm i`
3. `npm run build:clean`

Then in your application you can install this build by pointing to the SDK repository in the package.json of your project. E.g.: `"@rsksmart/rsk-swap-sdk": "file:../rsk-swap-sdk"`

The advantage of this approach if that you can modify the SDK code without generating a new release. You just need to rebuild the SDK and reinstall in the consumer application.

### Install npm package
In this option there are two scenarios, you might want to install a public version or a private version. The public versions are published in the npm registry, meanwhile the private versions are published in the Github registry under the `rsksmart` organization. This means that if you're not part of the organization you won't be able to user that version of the package.

Both installations are done by running

    npm install @rsksmart/rsk-swap-sdk

However, in the case you're installing a private version, you must authenticate first with by running

    npm login --scope=@rsksmart --auth-type=legacy --registry=https://npm.pkg.github.com

In this case you'll need to provide some credentials which are your GitHub username a personal token generated with read packages permissions.

Now that you have installed the SDK in your project, you can check how to start using it in the [Usage](#usage) section.

## Usage
Create RskSwapSDK client instance. For this SDK, the blockchain connection is mandatory. There are 3 ways to create an RSK connection, you can check them in [BlockchainConnection class](TODO url) documentation.
```javascript
    const blockchainConnection: BlockchainConnection = await BlockchainConnection.createUsingStandard(window.ethereum)
    const sdk: RskSwapSDK = new RskSwapSDK('Local', blockchainConnection)
```

To know which providers can facilitate a specific swap you should perform an estimation. The amount must be in the lowest unit for the origin currency. For example, if you're swapping BTC -> RBTC the amount must be in sats and if you're swapping RBTC -> USDT the amount must be in wei.
```javascript
    const amount = 250_000_000
    const estimations = await sdk.estimateSwap({
        fromChainId: '1',
        toChainId: '30',
        fromToken: 'ETH',
        toToken: 'RBTC',
        fromAmount: amount
    })
```
> 🚧 Important
>
> Notice that to identify the networks we use the Chain ID, currently there are two special cases where we don't use it. These are Bitcoin and the Lightning Network. For Bitcoin it must be passed `BTC` as Chain ID and for the Lightning Network `LN`. The differentiation between testnet and mainnet is done through the token (`BTC` or `tBTC`).

You can also fetch the limits of a specific pair to know what is the minimum and maximum amounts you can swap for a specific pair.
```javascript
    const args: SwapLimitsArgs = {
      fromToken: 'ETH',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '1',
    }
    const limits = await sdk.getSwapLimits(args)
```

Then, once you know which provider to use, you can start doing operations with the client by indicating the `providerId`
```javascript
    const args: CreateSwapArgs = {
      fromAmount: amount,
      fromToken: 'ETH',
      toToken: 'RBTC',
      toNetwork: '30',
      fromNetwork: '1',
      providerId: estimations[1].providerId,
      address: '<your address in the destination network>',
      refundAddress: '<your address in the origin network>'
    }
    const result = await sdk.createNewSwap(args)
```

Finally, the created swap will contain a [SwapAction](TODO url) indicating the SDK the required actions to perform your swap. In some cases, like EVM transactions, the RskSwapSDK executes the transaction by using the connected provider. But in cases like Bitcoin or Lightning the `executeSwap` function will just return the proper BIP21 or BOLT11 string so the consumer application can present it for the user.
```javascript
    const txHash = await sdk.executeSwap(result.action)
    const receipt = await blockchainConnection.getTransactionReceipt(txHash)
```

Depending on your provider, the swap might not arrive automatically to your wallet. In that case a claim transaction is required, this information will be available in the [SwapAction](TODO url) object. This doesn't necessarily mean that a EVM transaction will be produced, as the claim might happen in a non EVM chain, for the current integrations that RskSwap has, there is not action required from the consumer besides executing `claimSwap` when the claim is not in a EVM chain.
```javascript
    if (result.action.requiresClaim) {
        const claimTxHash = await sdk.claimSwap(result)
    }
```

> :warning:
>
> The [swap object](TODO url) contains a context field with all the information specific to the provider performing the swap. It's very important that the SDK consumer stores this object securely as it might contain private information used to claim or refund swaps. E.g. private keys for atomic swaps. It's also important to remark that when this is the case, the private information is always securely generated by the SDK in client side and is **not** sent to the server.

## Configuration
This SDK only requires the [BlockchainConnection class](TODO url) instance and the environment name to be used. Regarding the BlockchainConnection it mustn't be readonly as the SDK will try to broadcast transactions during the execute step.

## Application Programming Interface
To see the full API of this package please refer to the [the docs folder](./docs/) of this project
