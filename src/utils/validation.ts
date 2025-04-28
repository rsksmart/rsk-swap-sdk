import { assertTruthy, ethers, type Connection } from '@rsksmart/bridges-core-sdk'

export async function validateContractCode (blockchainConnection: Connection, address: string, expectedHash: string): Promise<boolean> {
  const connection = blockchainConnection.getAbstraction()
  const provider = isSignerConnection(connection) ? connection.provider : connection
  assertTruthy(provider, 'Unable to get provider from connection')
  const bytecode = await provider.getCode(address)
  assertTruthy(bytecode, `Contract not found at address ${address}`)
  const hash = ethers.utils.sha256(ethers.utils.hexlify(bytecode))
  return hash === expectedHash
}

function isSignerConnection (connection: ethers.providers.Provider | ethers.Signer): connection is ethers.Signer {
  return 'provider' in connection
}
