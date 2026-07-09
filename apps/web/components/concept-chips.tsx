'use client'

import { useTermPanel } from '@/components/term-panel'
import { cn } from '@/lib/utils'

export type ConceptMeta = {
  slug: string
  title: string
  kind: 'lexicon' | 'dsa'
}

// "Concepts in this chapter" — opens the same slide-over the inline terms use.
export function ConceptChips({ concepts }: { concepts: ConceptMeta[] }) {
  const panel = useTermPanel()

  if (concepts.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Concepts in this chapter
      </p>
      <div className="flex flex-wrap gap-2">
        {concepts.map((concept) => (
          <button
            key={concept.slug}
            type="button"
            aria-haspopup="dialog"
            onClick={() => panel?.openTerm(concept.slug)}
            // py-1.5 keeps the hit target >=24px tall (WCAG 2.2 §2.5.8).
            className="inline-flex min-h-6 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span
              aria-hidden
              className={cn(
                'size-2 rounded-full',
                concept.kind === 'lexicon' ? 'bg-primary' : 'bg-chart-2',
              )}
            />
            {concept.title}
          </button>
        ))}
      </div>
    </div>
  )
}
