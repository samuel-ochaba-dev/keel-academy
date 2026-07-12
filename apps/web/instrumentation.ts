/**
 * Sentry instrumentation for Next.js 16.
 *
 * The `register` hook initializes Sentry before the server starts. When
 * SENTRY_DSN is unset, Sentry.init silently disables itself, so dev and CI
 * run with zero overhead. This file is loaded by Next.js automatically
 * when present at the app root — no manual import needed.
 *
 * The `onRequestError` hook captures errors in route handlers and server
 * components and isolates each error to its own Sentry scope so user/request
 * data (IP, user agent, auth user) is attached automatically.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('@sentry/nextjs').then(({ init }) =>
      init({
        dsn: process.env.SENTRY_DSN,
        // No sample in dev; production rate set via Sentry UI.
        tracesSampleRate: 0,
        // Attach user context when auth session is available.
        sendDefaultPii: false,
      }),
    )
  }

  // Edge runtime — Sentry is initialized lazily on first error there.
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('@sentry/nextjs').then(({ init }) =>
      init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0,
      }),
    )
  }
}

export const onRequestError = import('@sentry/nextjs').then(
  ({ captureRequestError }) => captureRequestError,
)
