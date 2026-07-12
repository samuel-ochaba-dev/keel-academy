'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Error from 'next/error'

/**
 * Global error boundary — renders when the root layout throws.
 * Captures the error in Sentry and shows a minimal fallback UI.
 * Next.js 16 convention: `global-error.tsx` replaces the root layout
 * on error and must define its own `<html>` and `<body>`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground font-sans">
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
