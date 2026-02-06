import type { TelemetryProvider } from './types'

export class NoOpTelemetryProvider implements TelemetryProvider {
  captureException = (): void => {}

  log = (): void => {}

  // eslint-disable-next-line @typescript-eslint/promise-function-async
  profile: TelemetryProvider['profile'] = ((_name, fn) => fn()) as TelemetryProvider['profile']
}
