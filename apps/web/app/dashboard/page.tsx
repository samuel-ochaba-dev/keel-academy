import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRightIcon, CheckCircleIcon, LockIcon } from 'lucide-react'
import { auth } from '@/auth'
import {
  getReferenceImplementation,
  listChapters,
} from '@keelacademy/content/lookup'
import { getAllProgress } from '@/lib/progress/service'
import { isBillingConfigured } from '@/lib/billing/paddle'
import { hasCourseAccess } from '@/lib/entitlements/service'
import { getPassingChapterSlugs } from '@/lib/references/service'
import { siteConfig } from '@/lib/site'
import type { ChapterStatus } from '@/lib/db/schema'
import { SiteHeader } from '@/components/site-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

const statusVariant: Record<ChapterStatus, 'success' | 'secondary' | 'locked'> =
  {
    complete: 'success',
    reading: 'secondary',
    not_started: 'locked',
  }

const statusLabel: Record<ChapterStatus, string> = {
  complete: 'Complete',
  reading: 'In progress',
  not_started: 'Not started',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in?next=/dashboard')

  const [rows, access, passingSlugs] = await Promise.all([
    getAllProgress(session.user.id),
    hasCourseAccess(session.user.id),
    getPassingChapterSlugs(session.user.id),
  ])
  const bySlug = new Map(rows.map((row) => [row.chapterSlug, row]))
  // Show the paywall affordance only when billing is actually enforced.
  const gatingActive = isBillingConfigured() && !access

  const chapters = listChapters().map((chapter) => {
    const row = bySlug.get(chapter.slug)
    const hasReference = getReferenceImplementation(chapter.slug) !== null
    return {
      ...chapter,
      status: row?.status ?? ('not_started' as ChapterStatus),
      percent: row?.percentComplete ?? 0,
      lastVisitedAt: row?.lastVisitedAt ?? null,
      locked: gatingActive && !chapter.freeSample,
      hasReference,
      referenceUnlocked: hasReference && passingSlugs.has(chapter.slug),
    }
  })

  const completed = chapters.filter((c) => c.status === 'complete').length
  // Resume where they actually were: the most recently visited in-progress
  // chapter wins, then the first unfinished one, then the very first chapter.
  const current =
    chapters
      .filter((c) => c.status === 'reading')
      .sort(
        (a, b) =>
          (b.lastVisitedAt?.getTime() ?? 0) - (a.lastVisitedAt?.getTime() ?? 0),
      )[0] ??
    chapters.find((c) => c.status !== 'complete') ??
    chapters[0]
  const overall = chapters.length
    ? Math.round(
        chapters.reduce((sum, c) => sum + c.percent, 0) / chapters.length,
      )
    : 0

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <div className="space-y-2">
          <Badge variant="secondary">Your progress</Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Welcome back,{' '}
            {session.user.name ?? session.user.email ?? 'engineer'}
          </h1>
          <p className="text-muted-foreground">
            {completed === 0
              ? `You're at the start — chapter one is where it begins.`
              : completed === chapters.length
                ? `Every shipped chapter complete. You're ahead of the curriculum.`
                : `${completed} down, ${chapters.length - completed} to go in the shipped content. Keep the momentum going.`}{' '}
            <span className="text-foreground/70">
              {siteConfig.totalChaptersPlanned} chapters are planned in all.
            </span>
          </p>
        </div>

        {gatingActive ? (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10"
                  aria-hidden
                >
                  <LockIcon className="size-4 text-primary" />
                </span>
                <div>
                  <p className="font-heading font-semibold">
                    Unlock the full apprenticeship
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Chapter one is free. Enroll to open every other chapter,
                    build-along, and reference.
                  </p>
                </div>
              </div>
              <Link href="/billing" className={cn(buttonVariants())}>
                Get full access
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Overall progress</CardTitle>
              <CardDescription>
                Persisted from chapter reads and completions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={overall} aria-label="Overall course progress" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{overall}% through the shipped content</span>
                <span>
                  {completed}/{chapters.length} complete
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{completed > 0 ? 'Continue' : 'Start here'}</CardTitle>
              <CardDescription>
                {current
                  ? `${current.part} · Chapter ${current.order}`
                  : 'Pick up where you left off.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {current ? (
                <Link
                  href={current.url}
                  className={cn(buttonVariants(), 'w-full')}
                >
                  {completed > 0 ? 'Resume' : 'Open'} {current.title}
                  <ArrowRightIcon className="size-4" aria-hidden />
                </Link>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {chapters.map((chapter) => (
            <Card key={chapter.slug}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg">
                    Chapter {chapter.order}: {chapter.title}
                  </CardTitle>
                  {chapter.locked ? (
                    <Badge variant="locked">
                      <LockIcon className="size-3" aria-hidden />
                      Locked
                    </Badge>
                  ) : (
                    <Badge variant={statusVariant[chapter.status]}>
                      {statusLabel[chapter.status]}
                    </Badge>
                  )}
                </div>
                <CardDescription>{chapter.excerpt}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress
                  value={chapter.percent}
                  aria-label={`Progress for chapter ${chapter.order}: ${chapter.title}`}
                />
                {chapter.locked ? (
                  <Link
                    href="/billing"
                    className={cn(buttonVariants(), 'w-full')}
                  >
                    Unlock chapter
                  </Link>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={chapter.url}
                      className={cn(
                        buttonVariants({ variant: 'outline' }),
                        'flex-1',
                      )}
                    >
                      Open chapter
                    </Link>
                    {chapter.hasReference ? (
                      chapter.referenceUnlocked ? (
                        <Link
                          href={`/references/${chapter.slug}`}
                          className={cn(buttonVariants({ variant: 'outline' }))}
                          aria-label={`View reference implementation for chapter ${chapter.order}`}
                        >
                          <CheckCircleIcon className="size-4" aria-hidden />
                          Reference
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            buttonVariants({ variant: 'ghost' }),
                            'cursor-default opacity-60',
                          )}
                          aria-disabled="true"
                          title="Unlocks after your tests pass"
                        >
                          <LockIcon className="size-4" aria-hidden />
                          Reference
                        </span>
                      )
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
