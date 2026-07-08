'use client'

import { useEffect } from 'react'
// global-error replaces the root layout, so it must render its own <html>/<body>
// and import the global stylesheet to get the design tokens + utilities.
import './globals.css'
import { Button } from '@/components/ui/button'

// Catches errors thrown in the root layout itself. Only renders in production.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="space-y-2">
            <p className="font-heading text-5xl font-semibold text-primary">
              Error
            </p>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              The application hit an unexpected error
            </h1>
            <p className="mx-auto max-w-md text-muted-foreground">
              This one reached the root of the app. Reload to try again.
            </p>
          </div>
          <Button onClick={reset}>Try again</Button>
        </main>
      </body>
    </html>
  )
}
