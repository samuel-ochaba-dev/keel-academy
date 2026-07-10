import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRightIcon, CheckIcon, MonitorIcon } from 'lucide-react'
import { auth } from '@/auth'
import {
  getBuildAlong,
  getChapter,
  getChapterEntries,
  listChapters,
} from '@keelacademy/content/lookup'
import {
  getAllProgress,
  getChapterProgress,
  recordChapterVisit,
} from '@/lib/progress/service'
import type { ChapterStatus } from '@/lib/db/schema'
import { canAccessChapter } from '@/lib/entitlements/service'
import { completeChapterAction } from './actions'
import { ChapterSidebar, type NavChapter } from '@/components/chapter-sidebar'
import { ContentPaywall } from '@/components/content-paywall'
import { ChapterTopbar } from '@/components/chapter-topbar'
import { ConceptChips } from '@/components/concept-chips'
import { MDXContent } from '@/components/mdx-content'
import { ReadingProgress } from '@/components/reading-progress'
import { SiteHeader } from '@/components/site-header'
import { TermPanelProvider, type TermEntry } from '@/components/term-panel'
import { siteConfig } from '@/lib/site'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
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

  // Whole-chapter paywall: a free-sample chapter is open to everyone, any other
  // needs an active enrollment. Access is derived from DB state, never a
  // redirect. Gated visitors get the header + a paywall instead of the body.
  const hasAccess = await canAccessChapter(chapter, userId)

  // Only count a visit when the reader can actually read — no progress for a
  // paywalled view. Idempotent (the chapter's own theme): reopening keeps one
  // row current.
  if (userId && hasAccess) await recordChapterVisit(userId, slug)

  const [progress, progressRows] = await Promise.all([
    userId ? getChapterProgress(userId, slug) : Promise.resolve(undefined),
    userId ? getAllProgress(userId) : Promise.resolve([]),
  ])

  const chapters = listChapters()
  const entries = getChapterEntries(chapter)
  const buildAlong = getBuildAlong(slug)

  // Trim to the nav shape so the client drawer never serializes MDX bodies.
  const navChapters: NavChapter[] = chapters.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    order: entry.order,
    part: entry.part,
    url: entry.url,
  }))
  const currentIndex = chapters.findIndex((entry) => entry.slug === slug)
  const nextChapter =
    currentIndex >= 0 ? (chapters[currentIndex + 1] ?? null) : null

  const statusBySlug: Record<string, ChapterStatus> = {}
  for (const row of progressRows) statusBySlug[row.chapterSlug] = row.status
  const completedCount = progressRows.filter(
    (row) => row.status === 'complete',
  ).length

  // Term panels render full reference bodies inline, so only build them with
  // access — a gated chapter must not ship its concepts to the client.
  const termEntries: TermEntry[] = hasAccess
    ? entries.map((entry) => ({
        slug: entry.slug,
        title: entry.title,
        summary: entry.summary,
        kind: entry.kind,
        content: <MDXContent code={entry.body} />,
      }))
    : []
  const concepts = hasAccess
    ? entries.map((entry) => ({
        slug: entry.slug,
        title: entry.title,
        kind: entry.kind,
      }))
    : []
  const status: ChapterStatus = progress?.status ?? 'not_started'

  // Paywalled-content structured data (Google Search Central): mark the gated
  // region (.paywalled) as not free so Google indexes the chapter without
  // treating the gate as cloaking. Only emitted when actually gated.
  const paywallJsonLd = !hasAccess
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: chapter.title,
        description: chapter.excerpt,
        isAccessibleForFree: false,
        hasPart: {
          '@type': 'WebPageElement',
          isAccessibleForFree: false,
          cssSelector: '.paywalled',
        },
      }
    : null

  return (
    <div className="min-h-screen">
      <ReadingProgress />
      <SiteHeader />
      <ChapterTopbar
        chapters={navChapters}
        currentSlug={slug}
        statusBySlug={statusBySlug}
        completedCount={completedCount}
        totalPlanned={siteConfig.totalChaptersPlanned}
      />
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-10 md:px-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <ChapterSidebar
              chapters={navChapters}
              currentSlug={slug}
              statusBySlug={statusBySlug}
              totalPlanned={siteConfig.totalChaptersPlanned}
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

            {paywallJsonLd ? (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify(paywallJsonLd),
                }}
              />
            ) : null}

            {!hasAccess ? (
              <div className="paywalled mt-12">
                <ContentPaywall kind="chapter" signedIn={Boolean(userId)} />
              </div>
            ) : (
              <>
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
                      <p className="mt-4 text-center text-sm text-muted-foreground">
                        Here is what the senior asked the junior to produce. Now
                        it&rsquo;s your turn.
                      </p>

                      <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground lg:hidden">
                        <MonitorIcon
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden
                        />
                        <p>
                          This section involves coding. It&rsquo;s best
                          experienced on a larger screen.
                        </p>
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
              </>
            )}

            {hasAccess ? (
            <div className="mx-auto mt-14 max-w-[75ch]">
              <Separator />
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {status === 'complete' ? (
                    <span
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15"
                      aria-hidden
                    >
                      <CheckIcon className="size-4 [color:var(--color-success)]" />
                    </span>
                  ) : null}
                  <div>
                    <p className="font-heading text-lg font-semibold">
                      {status === 'complete'
                        ? 'Chapter complete'
                        : 'Finished reading?'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {status === 'complete'
                        ? 'Nice work — your progress is saved. Keep the momentum going.'
                        : userId
                          ? 'Mark it done to track your progress.'
                          : 'Sign in to save your progress across sessions.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {userId ? (
                    <form
                      action={completeChapterAction.bind(null, chapter.slug)}
                    >
                      <SubmitButton
                        variant={status === 'complete' ? 'outline' : 'default'}
                        pendingText="Saving…"
                      >
                        {status === 'complete' ? 'Completed' : 'Mark complete'}
                      </SubmitButton>
                    </form>
                  ) : (
                    <Link
                      href={`/sign-in?next=/chapters/${chapter.slug}`}
                      className={cn(buttonVariants())}
                    >
                      Sign in to save progress
                    </Link>
                  )}
                  {nextChapter ? (
                    <Link
                      href={nextChapter.url}
                      className={cn(
                        buttonVariants({
                          variant: status === 'complete' ? 'default' : 'outline',
                        }),
                      )}
                    >
                      Next: {nextChapter.title}
                      <ArrowRightIcon className="size-4" aria-hidden />
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard"
                      className={cn(buttonVariants({ variant: 'outline' }))}
                    >
                      Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </div>
            ) : null}
          </main>
        </TermPanelProvider>
      </div>
    </div>
  )
}
