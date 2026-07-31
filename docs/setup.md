# Setup

## Prerequisites

- **Node.js**: version pinned in [`.nvmrc`](../.nvmrc) (currently `v24.14.1`). If you use `nvm`, run `nvm use` from the project root.
- **Python 3**: required by the `prepare` npm script, which installs and configures `pre-commit` hooks on `npm i`.
- **GitHub personal access token** (only if installing a private version of the package from the GitHub npm registry): a **classic** token with the `read:packages` scope. Fine-grained tokens aren't supported.

## Install

```bash
npm install @rsksmart/rsk-swap-sdk
```

To install a private version from the GitHub registry instead, authenticate first:

```bash
npm login --scope=@rsksmart --auth-type=legacy --registry=https://npm.pkg.github.com
```

## Build from source

```bash
git clone git@github.com:rsksmart/rsk-swap-sdk.git
cd rsk-swap-sdk
npm i               # also runs the `prepare` script (pre-commit hooks)
npm run build:clean # removes lib/ and node_modules, reinstalls, and builds
```

`npm run build` on its own runs `tsc --noEmit` for type-checking followed by the Rollup bundle (`rollup -c --bundleConfigAsCjs`), producing `lib/cjs`, `lib/esm`, and the `lib/index.d.ts` declaration file referenced by `package.json`'s `main`/`module`/`types` fields.

## Testing

| Command | Purpose |
|---|---|
| `npm test` | Builds the SDK, then runs the Jest unit test suite (`--verbose`) |
| `npm run test:coverage` | Same, with coverage collected from `./src/**` |
| `npm run test:integration` | Runs the suite in [`integration-test/`](../integration-test), a separate npm package that installs this SDK from the local `lib` build and exercises it against a real Boltz submarine swap |

## External dependencies

This SDK is a client library — it has no server or database of its own to stand up. At runtime it depends on:

- **The RSK Swap API** — the aggregator service this SDK talks to. Selected via the `envName` argument passed to the [`RskSwapSDK`](../src/sdk/rskSwap.ts) constructor (see [`api.md`](./api.md)), which maps to one of the base URLs below (see [`src/constants/environment.ts`](../src/constants/environment.ts)):

  | Environment | API base URL |
  |---|---|
  | `Local` | `http://localhost:8080/api` |
  | `Development` | `https://rskswap.dev.flyover.rif.technology/api` |
  | `Testnet` | `https://rskswap.testnet.flyover.rif.technology/api` |
  | `Mainnet` | `https://rskswap.mainnet.flyover.rif.technology/api` |

- **A `BlockchainConnection`** (from [`@rsksmart/bridges-core-sdk`](https://github.com/rsksmart/bridges-core-sdk)) — passed into the `RskSwapSDK` constructor and used to broadcast EVM transactions during `executeSwap`/`claimSwap`. It must not be read-only.
- **Third-party swap providers** (Boltz, Changelly, Symbiosis, LI.FI) — reached indirectly through the RSK Swap API and, for Boltz, directly for cooperative claim signing. See [`providers.md`](./providers.md).
