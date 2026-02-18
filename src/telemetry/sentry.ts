import type { SeverityLevel } from '@sentry/browser'
import type { TelemetryProvider, LogLevel } from './types'

const logLevelToSeverity: Record<LogLevel, SeverityLevel> = {
  info: 'info',
  warn: 'warning',
  error: 'error'
}

interface SentryLike {
  init: (options: Record<string, unknown>) => void
  withScope: (callback: (scope: ScopeLike) => void) => void
  captureException: (error: unknown) => void
  captureMessage: (message: string, options?: { level?: SeverityLevel }) => void
  startSpan: <T>(options: { name: string, op: string }, callback: () => T) => T
}

interface ScopeLike {
  setTag: (key: string, value: string) => void
  setContext: (name: string, context: Record<string, unknown> | null) => void
}

export class SentryTelemetryProvider implements TelemetryProvider {
  private constructor (
    private readonly sentry: SentryLike,
    private readonly tag: string
  ) {}

  /**
   * Creates and initializes a SentryTelemetryProvider.
   * @param dsn - Sentry DSN
   * @param options - Sentry BrowserOptions (optional overrides, excluding 'dsn')
   */
  static async create (
    dsn: string,
    options?: Record<string, unknown>,
    tag = 'rsk-swap-sdk'
  ): Promise<SentryTelemetryProvider> {
    const Sentry = await import('@sentry/browser')
    const userBeforeSend = options?.beforeSend as ((event: unknown, hint?: unknown) => unknown) | undefined
    const beforeSend: (event: unknown, hint?: unknown) => unknown = (event, hint) => {
      const sanitized = sanitizeEvent(event)
      return userBeforeSend ? userBeforeSend(sanitized, hint) ?? sanitized : sanitized
    }
    Sentry.init({
      ...options,
      dsn,
      sendDefaultPii: false,
      integrations: [],
      beforeBreadcrumb: () => null,
      beforeSend
    })
    return new SentryTelemetryProvider(Sentry, tag)
  }

  captureException = (error: Error, context?: Record<string, unknown>): void => {
    this.sentry.withScope((scope) => {
      scope.setTag('source', this.tag)
      if (context) {
        scope.setContext('rsk-swap', context)
      }
      this.sentry.captureException(error)
    })
  }

  log = (level: LogLevel, message: string, data?: Record<string, unknown>): void => {
    this.sentry.withScope((scope) => {
      scope.setTag('source', this.tag)
      if (data) {
        scope.setContext('rsk-swap', data)
      }
      this.sentry.captureMessage(message, {
        level: logLevelToSeverity[level]
      })
    })
  }

  profile: TelemetryProvider['profile'] = (async (name, fn) => {
    return this.sentry.startSpan({ name, op: 'function' }, async () => fn())
  }) as TelemetryProvider['profile']

  static fromInstance (
    sentry: SentryLike,
    tag = 'rsk-swap-sdk'
  ): SentryTelemetryProvider {
    return new SentryTelemetryProvider(sentry, tag)
  }
}

function sanitizeEvent (event: unknown): Record<string, unknown> | null {
  if (!event || typeof event !== 'object') {
    return null
  }

  const safeEvent: Record<string, unknown> = { ...(event as Record<string, unknown>) }
  delete safeEvent.request
  delete safeEvent.user
  delete safeEvent.extra
  delete safeEvent.contexts
  delete safeEvent.breadcrumbs

  return safeEvent
}
