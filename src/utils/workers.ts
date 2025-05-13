import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { WORKER_MANIFEST } from './manifest'

/**
 * The purpose of this function is to ease the worker creation process in both browser and node environments.
 * The reason why we need to create a worker is to avoid loading swap providers libraries in the main thread.
 */
export async function createWorkers<WorkerParams, CallbackParams, Result> (
  worker: { provider: string, workerName: string },
  params: WorkerParams,
  msgCallback: (msg: CallbackParams) => Result
): Promise<Result> {
  const isWebWorker = typeof Worker !== 'undefined'
  const { provider, workerName } = worker
  const workerSource = WORKER_MANIFEST[`${provider}/${workerName}`]
  assertTruthy(workerSource, 'Worker not found')
  if (isWebWorker) {
    const blob = new Blob([workerSource], { type: 'application/javascript' })
    const blobUrl = URL.createObjectURL(blob)
    const worker = new Worker(blobUrl)
    return new Promise((resolve, reject) => {
      worker.onmessage = (e: MessageEvent) => {
        const msg = e.data
        const result = msgCallback(msg)
        URL.revokeObjectURL(blobUrl)
        resolve(result)
      }
      worker.onerror = (e: ErrorEvent) => {
        URL.revokeObjectURL(blobUrl)
        reject(e)
      }
      worker.postMessage(params)
    })
  } else {
    const wt = await import('node:worker_threads')
    const worker = new wt.Worker(workerSource, { eval: true })
    return new Promise((resolve, reject) => {
      worker.on('message', (data) => {
        const result = msgCallback(data)
        resolve(result)
      })
      worker.on('error', (e) => {
        reject(e)
      })
      worker.postMessage(params)
    })
  }
}
