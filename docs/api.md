# API Reference

Table of everything exported from the package's public entry point ([`src/index.ts`](../src/index.ts)). Descriptions are the first line of each symbol's TSDoc comment, kept accurate by docs-dev alongside the code — see the linked source for the full comment and signature.

## Client

| Export | Kind | Description |
|---|---|---|
| [`RskSwapSDK`](../src/sdk/rskSwap.ts) | class | Class that represents the entrypoint to the RSK Swap SDK. One instance per `(environment, connection)` pair; see [`setup.md`](./setup.md) for the available environments. |

## Method argument types

| Export | Kind | Description |
|---|---|---|
| [`SwapEstimationArgs`](../src/sdk/estimateSwap.ts) | interface | Arguments for `RskSwapSDK.estimateSwap`. |
| [`CreateSwapArgs`](../src/sdk/createSwap.ts) | type | Arguments for `RskSwapSDK.createNewSwap`; the provider-specific `context` is generated internally and can't be passed in. |
| [`SwapId`](../src/sdk/getSwap.ts) | interface | Identifies a swap univocally for `RskSwapSDK.getSwapStatus`. |
| [`SwapLimitsArgs`](../src/sdk/getLimits.ts) | interface | Arguments for `RskSwapSDK.getSwapLimits`. |
| [`GetPricesArgs`](../src/sdk/getPrices.ts) | interface | Arguments for `RskSwapSDK.getPrices`. |
| [`GetQrCodeArgs`](../src/sdk/getQrCode.ts) | type | The QR-code type and payload for `RskSwapSDK.getQrCode` — a discriminated union over `'BIP-21'`, `'EIP-681'`, `'BOLT11'`. |
| [`Bip21QrCodeArgs`](../src/sdk/getQrCode.ts) | interface | Payload for a `'BIP-21'` QR code. |
| [`Eip681QrCodeArgs`](../src/sdk/getQrCode.ts) | interface | Payload for a `'EIP-681'` QR code. |
| [`LightningQrCodeArgs`](../src/sdk/getQrCode.ts) | interface | Payload for a `'BOLT11'` QR code. |

## Swap execution types

| Export | Kind | Description |
|---|---|---|
| [`SwapAction`](../src/providers/types.ts) | interface | The action an SDK consumer must perform to pay for a created swap, returned as part of `SwapWithAction` and consumed by `RskSwapSDK.executeSwap`. |
| [`SwapWithAction`](../src/providers/types.ts) | interface | A swap paired with the action required to pay for it — the return type of `RskSwapSDK.createNewSwap`. |
| [`TxData`](../src/providers/types.ts) | interface | The raw fields needed to submit an EVM transaction (native or contract call). |

## API response types

Re-exported from the generated API bindings ([`src/api/bindings/data-contracts.ts`](../src/api/bindings/data-contracts.ts), synced via `npm run api-sync`); these don't carry a symbol-level TSDoc comment, so descriptions below summarize their fields instead.

| Export | Kind | Description |
|---|---|---|
| [`SwapEstimation`](../src/api/bindings/data-contracts.ts) | interface | A provider's estimation for a swap: total amount, required confirmations, optional estimated time, and fees. |
| [`Swap`](../src/api/bindings/data-contracts.ts) | interface | Full state of a swap: provider, addresses, amounts, status, fees, and provider-specific context. |
| [`SwapProvider`](../src/api/bindings/data-contracts.ts) | interface | An available swap provider's metadata and the token pairs it supports. |
| [`SwapPair`](../src/api/bindings/data-contracts.ts) | interface | An origin/destination token pair a provider supports. |
| [`SwapLimits`](../src/api/bindings/data-contracts.ts) | interface | The minimum and maximum amount that can be swapped for a pair. |
| [`Fee`](../src/api/bindings/data-contracts.ts) | interface | A single fee charged for a swap: its `FeeType` and amount. |
| [`Token`](../src/api/bindings/data-contracts.ts) | interface | A supported token's symbol, type, decimals, and per-network addresses. |
| [`CoinPrice`](../src/api/bindings/data-contracts.ts) | interface | The USD price of a named cryptocurrency, as returned by `RskSwapSDK.getPrices`. |
| [`GetSwapArgs`](../src/api/index.ts) | type | Raw (snake_case) query shape for the swap-status endpoint. **Not** the type accepted by `RskSwapSDK.getSwapStatus` — that method takes `SwapId` instead; this export appears unused by the SDK's own public surface (see report caveat). |

## Fees

| Export | Kind | Description |
|---|---|---|
| [`FeeType`](../src/api/feeType.ts) | type | The possible fee type identifiers a `Fee` can have, as returned by the API. |
| [`isPercentageFee`](../src/api/feeType.ts) | function | Checks whether a fee type is the percentage-based Boltz provider fee. |
| [`isNetworkFee`](../src/api/feeType.ts) | function | Checks whether a fee type represents a fixed network/miner fee (miner fee, destination network fee, or gas fee). |

## Environment

| Export | Kind | Description |
|---|---|---|
| [`RskSwapEnvironmentName`](../src/constants/environment.ts) | type | Available environment for the RskSwapSDK — `'Local' \| 'Development' \| 'Testnet' \| 'Mainnet'`. |
| [`RskSwapEnvironment`](../src/constants/environment.ts) | interface | Configuration for a network environment the SDK can target (currently just its API base URL). |
| [`RskSwapEnvironments`](../src/constants/environment.ts) | const | The concrete `RskSwapEnvironmentName -> RskSwapEnvironment` map — see [`setup.md`](./setup.md) for the base URL table. |

## Extension point

The swap-provider integration contract (`SwapProviderClient`) and its bundled implementations are documented separately in [`providers.md`](./providers.md) — it isn't re-exported from `index.ts` since SDK consumers select a provider by `providerId` string rather than implementing the interface themselves today, but it's the extension point new provider integrations are built against.
