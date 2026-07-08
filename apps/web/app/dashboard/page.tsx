import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRightIcon } from 'lucide-react'
import { auth } from '@/auth'
import { listChapters } from '@/lib/content'
import { getAllProgress } from '@/lib/progress/service'
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

  const rows = await getAllProgress(session.user.id)
  const bySlug = new Map(rows.map((row) => [row.chapterSlug, row]))

  const chapters = listChapters().map((chapter) => {
    const row = bySlug.get(chapter.slug)
    return {
      ...chapter,
      status: row?.status ?? ('not_started' as ChapterStatus),
      percent: row?.percentComplete ?? 0,
    }
  })

  const completed = chapters.filter((c) => c.status === 'complete').length
  const current =
    chapters.find((c) => c.status === 'reading') ??
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
            {completed} of {siteConfig.totalChaptersPlanned} planned chapters
            complete. M0 ships the first chapter — the rest of the shape is
            real.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Overall progress</CardTitle>
              <CardDescription>
                Persisted from chapter reads and completions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={overall} />
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
              <CardTitle>Continue</CardTitle>
              <CardDescription>Pick up where you left off.</CardDescription>
            </CardHeader>
            <CardContent>
              {current ? (
                <Link
                  href={current.url}
                  className={cn(buttonVariants(), 'w-full')}
                >
                  Open {current.title}
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
                  <Badge variant={statusVariant[chapter.status]}>
                    {statusLabel[chapter.status]}
                  </Badge>
                </div>
                <CardDescription>{chapter.excerpt}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={chapter.percent} />
                <Link
                  href={chapter.url}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full',
                  )}
                >
                  Open chapter
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
