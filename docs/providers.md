# Swap providers

The SDK aggregates several third-party swap providers behind a single contract, [`SwapProviderClient`](../src/providers/types.ts), so `RskSwapSDK` can create, pay for, and (when needed) claim a swap the same way regardless of which provider fulfills it.

## The contract

```ts
interface SwapProviderClient {
  createContext: (creationArgs: CreateSwapArgs) => ProviderContext
  validateAddress: (swap: Swap) => Promise<boolean>
  generateAction: (swap: CreateSwapResult) => Promise<SwapAction>
  buildClaimTransaction?: (swap: Swap) => Promise<TxData>
  executeExternalClaim?: (swap: Swap) => Promise<string>
  finalizeContext?: (localContext: ProviderContext, swap: Swap) => ProviderContext
}
```

| Method | Required? | Purpose |
|---|---|---|
| `createContext` | always | Builds the local [`ProviderContext`](../src/providers/types.ts) (public + secret halves) for a swap before it's created. |
| `validateAddress` | always | Confirms the payment address the server returned for the swap can be trusted. |
| `generateAction` | always | Builds the [`SwapAction`](../src/providers/types.ts) the SDK consumer must perform to pay for the swap. |
| `buildClaimTransaction` | only if the provider can produce swaps with `requiresClaim: true` that settle on an EVM chain | Builds the on-chain claim transaction. |
| `executeExternalClaim` | only if the provider can produce swaps with `requiresClaim: true` that settle off-chain (e.g. Bitcoin) | Executes the claim itself, without going through the connected EVM blockchain. |
| `finalizeContext` | only if the provider needs to merge server-returned data into the local context after creation | Reconciles local and server context; providers that don't implement it keep the local context unchanged. |

**Note:** `buildClaimTransaction` and `executeExternalClaim` are typed optional on the interface (since most providers never require a claim), but `RskSwapSDK.claimSwap` calls whichever one applies via optional chaining and throws if it's missing — so for a provider whose swaps can set `requiresClaim: true`, the relevant method is effectively required in practice, not truly optional. Today only `BoltzClient` produces claimable swaps.

## Bundled implementations

| Provider | Class | Claim methods implemented | Notes |
|---|---|---|---|
| Boltz | [`BoltzClient`](../src/providers/boltz/boltz.ts) | `finalizeContext`, `buildClaimTransaction`, `executeExternalClaim` | Routes each swap to a reverse swap, submarine swap, chain-swap-in, or chain-swap-out strategy depending on origin/destination network (BTC, Lightning, or Rootstock); the only bundled provider whose swaps can require a claim. |
| Changelly | [`ChangellyClient`](../src/providers/changelly/changelly.ts) | none | Swaps never require a claim. |
| Symbiosis | [`SymbiosisClient`](../src/providers/symbiosis/symbiosis.ts) | none | Swaps never require a claim; attaches an ERC20 approval step via `executePreSteps` when the swap context calls for one. |
| LI.FI | [`LiFiClient`](../src/providers/lifi/lifi.ts) | none | Swaps never require a claim; attaches an ERC20 approval step via `executePreSteps` for `'ERC20-PAYMENT'` actions. |

## Adding a new provider

1. Implement [`SwapProviderClient`](../src/providers/types.ts) in a new `src/providers/<name>/` directory.
2. Register an instance with the SDK's [`ProviderClientResolver`](../src/providers/resolver.ts), keyed by the provider's `providerId` string, the same way `RskSwapSDK`'s constructor registers the four bundled clients today (see [`src/sdk/rskSwap.ts`](../src/sdk/rskSwap.ts)).

There is currently no public API for an SDK consumer to register their own provider at runtime — adding one means adding a client class and wiring it into `RskSwapSDK`'s constructor.
