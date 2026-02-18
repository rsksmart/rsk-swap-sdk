import type { TelemetryProvider, LogLevel } from './types'

export class SafeTelemetryProvider implements TelemetryProvider {
  constructor (
    private readonly wrapped: TelemetryProvider,
    private readonly onError?: (error: Error) => void
  ) {}

  captureException = (error: Error, context?: Record<string, unknown>): void => {
    try {
      this.wrapped.captureException(error, context)
    } catch (telemetryError) {
      // Telemetry failures must never affect SDK behavior.
      this.onError?.(telemetryError instanceof Error ? telemetryError : new Error(String(telemetryError)))
    }
  }

  log = (level: LogLevel, message: string, data?: Record<string, unknown>): void => {
    try {
      this.wrapped.log(level, message, data)
    } catch {
      // Telemetry failures must never affect SDK behavior.
    }
  }

  profile: TelemetryProvider['profile'] = ((name, fn) => {
    let callbackInvoked = false
    let callbackResult: unknown
    let callbackError: unknown

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const wrappedFn: () => unknown = () => {
      callbackInvoked = true
      try {
        const result = fn()
        // Handle async callbacks by capturing eventual result/error.
        if (result && typeof (result as any).then === 'function') {
          return (result as Promise<unknown>)
            .then(value => {
              callbackResult = value
              return value
            })
            .catch(err => {
              callbackError = err
              throw err
            })
        }
        callbackResult = result
        return result
      } catch (error) {
        callbackError = error
        throw error
      }
    }

    try {
      return this.wrapped.profile(name, wrappedFn as () => any)
    } catch {
      // If the original callback threw, rethrow that error.
      if (callbackError !== undefined) {
        throw callbackError
      }
      // If the callback ran successfully, return its result even if telemetry failed.
      if (callbackInvoked) {
        return callbackResult
      }
      // Telemetry failed before the callback ran; fall back to calling the callback directly.
      return fn()
    }
  }) as TelemetryProvider['profile']
}
