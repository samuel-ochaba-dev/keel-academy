'use client'

import { useRef, useState } from 'react'
import { MenuIcon, XIcon } from 'lucide-react'
import { ChapterSidebar, type NavChapter } from '@/components/chapter-sidebar'
import type { ChapterStatus } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

// The reading-shell sub-header: a persistent course-progress bar that sits under
// the site header on the chapter page. On < lg it also hosts the "Chapters"
// trigger, which opens the full navigation as a native <dialog> drawer — the
// design's "sidebar collapses to a top bar on mobile" behavior. The drawer reuses
// the same native-dialog approach as the term slide-over (RFC-001): focus trap,
// Escape-to-close, and focus return to the trigger come for free.
export function ChapterTopbar({
  chapters,
  currentSlug,
  statusBySlug,
  completedCount,
  totalPlanned,
}: {
  chapters: NavChapter[]
  currentSlug: string
  statusBySlug: Record<string, ChapterStatus>
  completedCount: number
  totalPlanned: number
}) {
  const drawerRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  const current = chapters.find((chapter) => chapter.slug === currentSlug)
  const percent = totalPlanned
    ? Math.round((completedCount / totalPlanned) * 100)
    : 0

  function openDrawer() {
    if (!drawerRef.current?.open) drawerRef.current?.showModal()
    setOpen(true)
  }

  function closeDrawer() {
    drawerRef.current?.close()
  }

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-2.5 md:px-10">
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={openDrawer}
        >
          <MenuIcon className="size-4" aria-hidden />
          Chapters
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">
              {current
                ? `Chapter ${current.order} · ${current.title}`
                : 'Reading'}
            </span>
            <span className="shrink-0 tabular-nums">
              {completedCount} of {totalPlanned} complete
            </span>
          </div>
          <Progress
            value={percent}
            aria-label="Course progress"
            className="mt-1.5 h-[3px]"
          />
        </div>
      </div>

      <dialog
        ref={drawerRef}
        data-nav-drawer
        aria-label="Chapter navigation"
        onClose={() => setOpen(false)}
        // Native <dialog> fires a click on the element itself for backdrop
        // clicks; the panel content is a child, so this only closes on backdrop.
        onClick={(event) => {
          if (event.target === drawerRef.current) drawerRef.current?.close()
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <p className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Chapters
            </p>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close chapter navigation"
              onClick={closeDrawer}
            >
              <XIcon className="size-5" aria-hidden />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <ChapterSidebar
              chapters={chapters}
              currentSlug={currentSlug}
              statusBySlug={statusBySlug}
              totalPlanned={totalPlanned}
              onNavigate={closeDrawer}
            />
          </div>
        </div>
      </dialog>
    </div>
  )
}
