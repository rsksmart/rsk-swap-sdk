import { SwapTreeSerializer } from 'boltz-core'

const isBrowser = typeof Worker !== 'undefined'

interface Tree {
  claimLeaf: SwapTreeSerializer.SerializedLeaf
  refundLeaf: SwapTreeSerializer.SerializedLeaf
}

function deserializeSwapTree (tree: Tree): unknown {
  const { claimLeaf, refundLeaf } = tree
  return SwapTreeSerializer.deserializeSwapTree({ claimLeaf, refundLeaf }).tree
}

if (isBrowser) {
  onmessage = (e: MessageEvent<Tree>) => {
    const swapTree = deserializeSwapTree(e.data)
    postMessage(swapTree)
  }
} else {
  import('worker_threads').then(async ({ parentPort }) => {
    if (!parentPort) {
      throw new Error('No parent port found')
    }
    parentPort.on('message', (e: Tree) => {
      const swapTree = deserializeSwapTree(e)
      parentPort.postMessage(swapTree)
      parentPort.unref()
    })
  })
    .catch((error) => {
      console.error('Error loading worker_threads:', error)
    })
}
