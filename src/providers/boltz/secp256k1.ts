import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import * as secp256k1zkp from '@vulpemventures/secp256k1-zkp'

let secp256k1Instance: Awaited<ReturnType<typeof secp256k1zkp.default>> | null = null

// This is being initialized like this to load the WASM module only once.
// We get the module this way because it has different exported structure depending
// on the environment.
export const getSecp256k1: () => Promise<secp256k1zkp.Secp256k1ZKP> = async () => {
  if (!secp256k1Instance) {
    const mod: any = (secp256k1zkp.default as any)?.default ? secp256k1zkp.default : secp256k1zkp
    secp256k1Instance = await mod.default() satisfies secp256k1zkp.Secp256k1ZKP
  }
  assertTruthy(secp256k1Instance, 'EC standard not initialized properly')
  return secp256k1Instance
}
