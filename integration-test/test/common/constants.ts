export const TEST_URL = 'http://localhost:4444'
export const EXTENDED_TIMEOUT = 7200 * 1000

export const sleepSeconds: (seconds: number) => Promise<void> = async (seconds: number) => sleepMs(seconds * 1000)
export const sleepMs: (ms: number) => Promise<void> = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
