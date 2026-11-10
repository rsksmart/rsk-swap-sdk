# Swap providers

The SDK aggregates several third-party swap providers behind a single contract, [`SwapProviderClient`](../src/providers/types.ts), so `RskSwapSDK` can create and pay for a swap the same way regardless of which provider fulfills it.

## The contract

```ts
interface SwapProviderClient {
  createContext: (creationArgs: CreateSwapArgs) => ProviderContext
  validateAddress: (swap: Swap) => Promise<boolean>
  generateAction: (swap: CreateSwapResult) => Promise<SwapAction>
}
```

| Method | Required? | Purpose |
|---|---|---|
| `createContext` | always | Builds the local [`ProviderContext`](../src/providers/types.ts) (public + secret halves) for a swap before it's created. |
| `validateAddress` | always | Confirms the payment address the server returned for the swap can be trusted. |
| `generateAction` | always | Builds the [`SwapAction`](../src/providers/types.ts) the SDK consumer must perform to pay for the swap. |

## Bundled implementations

| Provider | Class | Notes |
|---|---|---|
| Changelly | [`ChangellyClient`](../src/providers/changelly/changelly.ts) | Pays by a BIP21 deposit address (Bitcoin origin) or a native/ERC20 EVM transaction. |
| Symbiosis | [`SymbiosisClient`](../src/providers/symbiosis/symbiosis.ts) | Attaches an ERC20 approval step via `executePreSteps` when the swap context calls for one. |
| LI.FI | [`LiFiClient`](../src/providers/lifi/lifi.ts) | Attaches an ERC20 approval step via `executePreSteps` for `'ERC20-PAYMENT'` actions. |

## Adding a new provider

1. Implement [`SwapProviderClient`](../src/providers/types.ts) in a new `src/providers/<name>/` directory.
2. Register an instance with the SDK's [`ProviderClientResolver`](../src/providers/resolver.ts), keyed by the provider's `providerId` string, the same way `RskSwapSDK`'s constructor registers the four bundled clients today (see [`src/sdk/rskSwap.ts`](../src/sdk/rskSwap.ts)).

There is currently no public API for an SDK consumer to register their own provider at runtime — adding one means adding a client class and wiring it into `RskSwapSDK`'s constructor.
