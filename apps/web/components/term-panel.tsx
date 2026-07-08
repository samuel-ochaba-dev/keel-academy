'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type TermEntry = {
  slug: string
  title: string
  summary: string
  kind: 'lexicon' | 'dsa'
  content: ReactNode
}

type TermPanelContextValue = {
  openTerm: (slug: string) => void
  viewed: ReadonlySet<string>
}

const TermPanelContext = createContext<TermPanelContextValue | null>(null)

export function useTermPanel() {
  return useContext(TermPanelContext)
}

export function TermPanelProvider({
  entries,
  children,
}: {
  entries: TermEntry[]
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [viewed, setViewed] = useState<ReadonlySet<string>>(() => new Set())

  const bySlug = useMemo(
    () => new Map(entries.map((entry) => [entry.slug, entry])),
    [entries],
  )

  const openTerm = useCallback(
    (slug: string) => {
      if (!bySlug.has(slug)) return
      setActiveSlug(slug)
      setViewed((prev) => new Set(prev).add(slug))
      dialogRef.current?.showModal()
    },
    [bySlug],
  )

  const value = useMemo<TermPanelContextValue>(
    () => ({ openTerm, viewed }),
    [openTerm, viewed],
  )

  const active = activeSlug ? (bySlug.get(activeSlug) ?? null) : null

  return (
    <TermPanelContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        data-term-panel
        aria-label={active ? `${active.kind} reference: ${active.title}` : 'Reference'}
        onClose={() => setActiveSlug(null)}
        // Native dialog fires a click on the element itself when the backdrop
        // is clicked; the panel content is a child, so this only closes on
        // backdrop clicks.
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close()
        }}
      >
        {active ? (
          <div
            data-layer={active.kind}
            className={cn(
              'flex h-full flex-col border-l-4',
              active.kind === 'lexicon' ? 'border-l-primary' : 'border-l-chart-2',
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div className="space-y-1.5">
                <Badge variant={active.kind === 'lexicon' ? 'default' : 'success'}>
                  {active.kind === 'lexicon' ? 'Lexicon' : 'Emerging DSA'}
                </Badge>
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {active.title}
                </h2>
                <p className="text-sm text-muted-foreground">{active.summary}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close reference"
                onClick={() => dialogRef.current?.close()}
              >
                <XIcon className="size-5" aria-hidden />
              </Button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {active.content}
            </div>
          </div>
        ) : null}
      </dialog>
    </TermPanelContext.Provider>
  )
}
