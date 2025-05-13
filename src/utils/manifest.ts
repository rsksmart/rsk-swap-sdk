// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import treeDeserializer from '../../lib/workers/boltz/treeDeserializer.js'
import path from 'path'
import fs from 'fs'

// The content of the manifest is generated during the build process.
// Since the unit test are running over the source code, and not over the bundled code,
// we need to load the worker files from the source code.
function unitTestLoaderFallback (relativePath: string): string {
  const abs = path.resolve(__dirname, relativePath)
  return fs.readFileSync(abs, 'utf8')
}

export const WORKER_MANIFEST: Record<string, string> = Object.freeze({
  'boltz/treeDeserializer': typeof treeDeserializer === 'string' ? treeDeserializer : unitTestLoaderFallback('../../lib/workers/boltz/treeDeserializer.js')
})
