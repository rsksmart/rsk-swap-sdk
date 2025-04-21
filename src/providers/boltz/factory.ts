import { type Connection } from '@rsksmart/bridges-core-sdk'
import { type RskSwapEnvironmentName } from '../../constants/environment'
import { ReverseSwap } from './reverseSwap'
import { ChainSwapOut } from './chainSwapOut'
import { ChainSwapIn } from './chainSwapIn'
import { SubmarineSwap } from './submarineSwap'
import { type ECPairAPI } from 'ecpair'

export interface BoltzAtomicSwapFactory {
  createReverseSwap: () => ReverseSwap
  createSubmarineSwap: (network: RskSwapEnvironmentName, connection: Connection) => SubmarineSwap
  createChainSwapIn: (network: RskSwapEnvironmentName, keyFactory: ECPairAPI) => ChainSwapIn
  createChainSwapOut: (network: RskSwapEnvironmentName, connection: Connection, keyFactory: ECPairAPI) => ChainSwapOut
}

export class DefaultBoltzAtomicSwapFactory implements BoltzAtomicSwapFactory {
  createReverseSwap (): ReverseSwap {
    return new ReverseSwap()
  }

  createSubmarineSwap (network: RskSwapEnvironmentName, connection: Connection): SubmarineSwap {
    return new SubmarineSwap(network, connection)
  }

  createChainSwapIn (network: RskSwapEnvironmentName, keyFactory: ECPairAPI): ChainSwapIn {
    return new ChainSwapIn(network, keyFactory)
  }

  createChainSwapOut (network: RskSwapEnvironmentName, connection: Connection, keyFactory: ECPairAPI): ChainSwapOut {
    return new ChainSwapOut(network, connection, keyFactory)
  }
}
