declare module '@sentry/browser' {
  export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'

  export function init (options: Record<string, unknown>): void
  export function withScope (callback: (scope: {
    setTag: (key: string, value: string) => void
    setContext: (name: string, context: Record<string, unknown> | null) => void
  }) => void): void
  export function captureException (error: unknown): void
  export function captureMessage (message: string, options?: { level?: SeverityLevel }): void
  export function startSpan<T> (options: { name: string, op: string }, callback: () => T): T
}
