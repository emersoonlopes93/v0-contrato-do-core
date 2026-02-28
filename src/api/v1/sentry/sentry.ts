type SentryInitOptions = {
  dsn?: string
  environment?: string
}

let initialized = false

export function initSentry(opts?: SentryInitOptions): void {
  if (initialized) return
  const dsn = process.env.SENTRY_DSN ?? opts?.dsn
  const environment = process.env.NODE_ENV ?? opts?.environment
  if (!dsn || environment !== 'production') {
    initialized = true
    return
  }
  initialized = true
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return
  console.error('[Sentry]', { error: err instanceof Error ? err.message : String(err), context })
}
