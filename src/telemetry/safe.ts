import type { TelemetryProvider, LogLevel } from './types'

export class SafeTelemetryProvider implements TelemetryProvider {
  constructor (private readonly wrapped: TelemetryProvider) {}

  captureException = (error: Error, context?: Record<string, unknown>): void => {
    try {
      this.wrapped.captureException(error, context)
    } catch {
      // Telemetry failures must never affect SDK behavior.
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
    let invoked = false
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const wrappedFn: () => unknown = () => {
      invoked = true
      return fn()
    }

    try {
      return this.wrapped.profile(name, wrappedFn as () => any)
    } catch (error) {
      if (invoked) {
        throw error
      }
      return wrappedFn()
    }
  }) as TelemetryProvider['profile']
}
