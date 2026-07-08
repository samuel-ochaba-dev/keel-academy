import Link from 'next/link'
import { CheckIcon, CircleDotIcon, CircleIcon } from 'lucide-react'
import type { Chapter } from '@/lib/content'
import type { ChapterStatus } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

function StateIcon({
  status,
  isCurrent,
}: {
  status: ChapterStatus
  isCurrent: boolean
}) {
  if (status === 'complete') {
    return (
      <CheckIcon
        className="size-4 [color:var(--color-success)]"
        aria-label="complete"
      />
    )
  }
  if (status === 'reading' || isCurrent) {
    return <CircleDotIcon className="size-4 text-primary" aria-label="in progress" />
  }
  return (
    <CircleIcon className="size-4 text-muted-foreground" aria-label="not started" />
  )
}

export function ChapterSidebar({
  chapters,
  currentSlug,
  statusBySlug,
}: {
  chapters: Chapter[]
  currentSlug: string
  statusBySlug: Record<string, ChapterStatus>
}) {
  const parts: { part: string; items: Chapter[] }[] = []
  for (const chapter of chapters) {
    let group = parts.find((entry) => entry.part === chapter.part)
    if (!group) {
      group = { part: chapter.part, items: [] }
      parts.push(group)
    }
    group.items.push(chapter)
  }

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
      <p className="px-3 text-xs leading-5 text-muted-foreground">
        Fifteen more chapters are in development.
      </p>
    </nav>
  )
}
