import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import {
  getBuildAlong,
  getChapter,
  getChapterEntries,
  listChapters,
} from '@/lib/content'
import {
  getAllProgress,
  getChapterProgress,
  recordChapterVisit,
} from '@/lib/progress/service'
import type { ChapterStatus } from '@/lib/db/schema'
import { completeChapterAction } from './actions'
import { ChapterSidebar } from '@/components/chapter-sidebar'
import { ConceptChips } from '@/components/concept-chips'
import { MDXContent } from '@/components/mdx-content'
import { SiteHeader } from '@/components/site-header'
import { TermPanelProvider, type TermEntry } from '@/components/term-panel'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function generateStaticParams() {
  return listChapters().map((chapter) => ({ slug: chapter.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const chapter = getChapter(slug)
  if (!chapter) return {}
  return { title: chapter.title, description: chapter.excerpt }
}

const statusLabels: Record<ChapterStatus, string> = {
  not_started: 'Not started',
  reading: 'In progress',
  complete: 'Complete',
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const chapter = getChapter(slug)
  if (!chapter) notFound()

  const session = await auth()
  const userId = session?.user?.id ?? null

  // Idempotent (the chapter's own theme): reopening keeps one row current.
  if (userId) await recordChapterVisit(userId, slug)

  const [progress, progressRows] = await Promise.all([
    userId ? getChapterProgress(userId, slug) : Promise.resolve(undefined),
    userId ? getAllProgress(userId) : Promise.resolve([]),
  ])

  const chapters = listChapters()
  const entries = getChapterEntries(chapter)
  const buildAlong = getBuildAlong(slug)

  const statusBySlug: Record<string, ChapterStatus> = {}
  for (const row of progressRows) statusBySlug[row.chapterSlug] = row.status

  const termEntries: TermEntry[] = entries.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    kind: entry.kind,
    content: <MDXContent code={entry.body} />,
  }))
  const concepts = entries.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    kind: entry.kind,
  }))
  const status: ChapterStatus = progress?.status ?? 'not_started'

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-10 md:px-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <ChapterSidebar
              chapters={chapters}
              currentSlug={slug}
              statusBySlug={statusBySlug}
            />
          </div>
        </aside>

        <TermPanelProvider entries={termEntries}>
          <main className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{chapter.part}</Badge>
              <Badge variant="outline">{chapter.estReadMinutes} min read</Badge>
              <Badge variant={status === 'complete' ? 'success' : 'secondary'}>
                {statusLabels[status]}
              </Badge>
            </div>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">
              {chapter.title}
            </h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
              {chapter.excerpt}
            </p>

            {concepts.length > 0 ? (
              <div className="mt-8 rounded-xl border border-border bg-card/60 p-5">
                <ConceptChips concepts={concepts} />
              </div>
            ) : null}

            <article className="mt-12">
              <div data-layer="novel" className="mx-auto max-w-[65ch]">
                <MDXContent code={chapter.body} />
              </div>
            </article>

            {buildAlong ? (
              <section className="mt-16">
                <div className="mx-auto max-w-[75ch]">
                  <div className="flex items-center gap-4">
                    <Separator className="flex-1" />
                    <span className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                      Now build it
                    </span>
                    <Separator className="flex-1" />
                  </div>
                  <div
                    data-layer="build-along"
                    className="mt-8 rounded-xl border border-border bg-card p-6 md:p-8"
                  >
                    <MDXContent code={buildAlong.body} />
                  </div>
                </div>
              </section>
            ) : null}

            <div className="mx-auto mt-14 max-w-[75ch]">
              <Separator />
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-heading text-lg font-semibold">
                    {status === 'complete'
                      ? 'Chapter complete'
                      : 'Finished reading?'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userId
                      ? 'Your progress is saved to your account.'
                      : 'Sign in to save your progress across sessions.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  {userId ? (
                    <form
                      action={completeChapterAction.bind(null, chapter.slug)}
                    >
                      <Button
                        type="submit"
                        variant={status === 'complete' ? 'outline' : 'default'}
                      >
                        {status === 'complete' ? 'Completed' : 'Mark complete'}
                      </Button>
                    </form>
                  ) : (
                    <Link
                      href={`/sign-in?next=/chapters/${chapter.slug}`}
                      className={cn(buttonVariants())}
                    >
                      Sign in to save progress
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className={cn(buttonVariants({ variant: 'outline' }))}
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </TermPanelProvider>
      </div>
    </div>
  )
}
