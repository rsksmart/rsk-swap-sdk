import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import initSecp256k1Zkp, { type Secp256k1ZKP } from '@vulpemventures/secp256k1-zkp'

let secp256k1Instance: Awaited<ReturnType<typeof initSecp256k1Zkp>> | null = null

// This is being initialized like this to load the WASM module only once
export const getSecp256k1: () => Promise<Secp256k1ZKP> = async () => {
  if (!secp256k1Instance) {
    secp256k1Instance = await initSecp256k1Zkp() satisfies Secp256k1ZKP
  }
  assertTruthy(secp256k1Instance, 'EC standard not initialized properly')
  return secp256k1Instance
}
