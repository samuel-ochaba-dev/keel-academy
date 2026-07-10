import Link from 'next/link'
import { LockIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Upsell shown in place of gated content (novel body, build-along, or a
// standalone reference entry). The gated markup is never rendered to the
// browser at all — this replaces it — so there's nothing to scrape. Wrapped in
// `.paywalled` by the caller so the paywalled-content JSON-LD can reference it.
type ContentPaywallProps = {
  kind: 'chapter' | 'reference'
  signedIn: boolean
}

export function ContentPaywall({ kind, signedIn }: ContentPaywallProps) {
  const noun = kind === 'chapter' ? 'chapter' : 'reference entry'
  return (
    <div className="mx-auto max-w-[65ch]">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card/60 p-8 text-center md:p-12">
        <span
          className="flex size-12 items-center justify-center rounded-full bg-muted"
          aria-hidden
        >
          <LockIcon className="size-5 text-muted-foreground" />
        </span>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            This {noun} is part of the full course
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Chapter one is free to read in full. Unlock the rest of the
            apprenticeship — every novel, build-along, and reference — with a
            single enrollment.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/billing" className={cn(buttonVariants())}>
            Get full access
          </Link>
          {!signedIn ? (
            <Link
              href="/sign-in?next=/billing"
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
