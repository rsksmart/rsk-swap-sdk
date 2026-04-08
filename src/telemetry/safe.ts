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

  profile<T> (name: string, fn: () => T): T
  profile<T> (name: string, fn: () => Promise<T>): Promise<T>
  profile<T> (name: string, fn: () => T | Promise<T>): T | Promise<T> {
    let invoked = false
    let callbackThrew = false
    let callbackError: unknown
    let callbackResult: { value: T | Promise<T> } | undefined

    const wrappedFn = (): T | Promise<T> => {
      invoked = true
      try {
        const result = fn()
        callbackResult = { value: result }
        return result
      } catch (error) {
        callbackThrew = true
        callbackError = error
        throw error
      }
    }

    const recoverOriginalOutcome = (): T | Promise<T> => {
      if (!invoked) {
        return wrappedFn()
      }

      if (callbackThrew) {
        throw callbackError
      }

      if (callbackResult !== undefined) {
        return callbackResult.value
      }

      return wrappedFn()
    }

    try {
      const telemetryResult = this.wrapped.profile(name, wrappedFn)

      if (telemetryResult instanceof Promise) {
        return telemetryResult.catch(recoverOriginalOutcome)
      }

      return telemetryResult
    } catch {
      return recoverOriginalOutcome()
    }
  }
}
