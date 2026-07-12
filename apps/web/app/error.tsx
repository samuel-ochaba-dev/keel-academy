'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Route-segment error boundary. Must be a Client Component; `reset()` re-renders
// the segment. Sentry captures the error in production; console.error fires
// everywhere so devs see the stack locally.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="font-heading text-5xl font-semibold text-primary">Oops</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          An unexpected error interrupted this page. Try again — if it keeps
          happening, the problem is on our end.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={cn(buttonVariants({ variant: 'outline' }))}>
          Go home
        </Link>
      </div>
    </main>
  )
}
