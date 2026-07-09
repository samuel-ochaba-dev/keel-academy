import Link from 'next/link'
import { CheckIcon, CircleDotIcon, CircleIcon } from 'lucide-react'
import type { ChapterStatus } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

// The minimal chapter shape the navigation needs. Deliberately excludes the
// compiled MDX `body`/`raw` so the list can be passed into the client-side
// mobile drawer without serializing every chapter's content into the RSC payload.
export type NavChapter = {
  slug: string
  title: string
  order: number
  part: string
  url: string
}

function StateIcon({
  status,
  isCurrent,
}: {
  status: ChapterStatus
  isCurrent: boolean
}) {
  // lucide only injects aria-hidden when NO a11y prop is set, and never adds a
  // role — so a bare aria-label on the <svg> is dropped by several AT combos.
  // role="img" makes the status name reliably announced (status is conveyed by
  // icon + color, so it must survive to the accessibility tree).
  if (status === 'complete') {
    return (
      <CheckIcon
        role="img"
        className="size-4 [color:var(--color-success)]"
        aria-label="complete"
      />
    )
  }
  if (status === 'reading' || isCurrent) {
    return (
      <CircleDotIcon
        role="img"
        className="size-4 text-primary"
        aria-label="in progress"
      />
    )
  }
  return (
    <CircleIcon
      role="img"
      className="size-4 text-muted-foreground"
      aria-label="not started"
    />
  )
}

export function ChapterSidebar({
  chapters,
  currentSlug,
  statusBySlug,
  totalPlanned,
  onNavigate,
}: {
  chapters: NavChapter[]
  currentSlug: string
  statusBySlug: Record<string, ChapterStatus>
  // Total chapters the curriculum will eventually have, so the "more in
  // development" note stays truthful as fixtures are added. Omit to hide it.
  totalPlanned?: number
  // Supplied only in the mobile drawer, to close it when a chapter is chosen.
  onNavigate?: () => void
}) {
  const parts: { part: string; items: NavChapter[] }[] = []
  for (const chapter of chapters) {
    let group = parts.find((entry) => entry.part === chapter.part)
    if (!group) {
      group = { part: chapter.part, items: [] }
      parts.push(group)
    }
    group.items.push(chapter)
  }

  const remaining = totalPlanned ? Math.max(0, totalPlanned - chapters.length) : 0

  return (
    <nav aria-label="Chapters" className="space-y-6 text-sm">
      {parts.map((group) => (
        <div key={group.part}>
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {group.part}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((chapter) => {
              const isCurrent = chapter.slug === currentSlug
              const status = statusBySlug[chapter.slug] ?? 'not_started'
              return (
                <li key={chapter.slug}>
                  <Link
                    href={chapter.url}
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-start gap-2.5 rounded-lg px-3 py-2 transition-colors',
                      isCurrent
                        ? 'bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <span className="mt-0.5 shrink-0">
                      <StateIcon status={status} isCurrent={isCurrent} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-muted-foreground">
                        Chapter {chapter.order}
                      </span>
                      <span
                        className={cn(
                          'block font-medium',
                          isCurrent && 'text-foreground',
                        )}
                      >
                        {chapter.title}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      {remaining > 0 ? (
        <p className="px-3 text-xs leading-5 text-muted-foreground">
          {remaining} more {remaining === 1 ? 'chapter is' : 'chapters are'} in
          development.
        </p>
      ) : null}
    </nav>
  )
}
