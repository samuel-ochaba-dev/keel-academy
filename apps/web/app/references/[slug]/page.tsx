import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeftIcon, CheckCircleIcon, LockIcon } from 'lucide-react'
import { auth } from '@/auth'
import {
  getChapter,
  getReferenceImplementation,
  listReferenceImplementations,
} from '@keelacademy/content/lookup'
import {
  canAccessReference,
  recordReferenceView,
} from '@/lib/references/service'
import { hasCourseAccess } from '@/lib/entitlements/service'
import { ContentPaywall } from '@/components/content-paywall'
import { MDXContent } from '@/components/mdx-content'
import { SiteHeader } from '@/components/site-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export const runtime = 'nodejs'

export function generateStaticParams() {
  return listReferenceImplementations().map((ref) => ({ slug: ref.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const ref = getReferenceImplementation(slug)
  if (!ref) return {}
  return { title: ref.title, description: ref.summary }
}

export default async function ReferencePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const reference = getReferenceImplementation(slug)
  if (!reference) notFound()

  // The chapter this reference answers to (for the back-link).
  const chapter = getChapter(slug)

  const session = await auth()
  const userId = session?.user?.id ?? null

  // Must be signed in to see references at all.
  if (!userId) {
    redirect(`/sign-in?next=/references/${slug}`)
  }

  // Check the full gate: enrollment + passing submission.
  const hasReference = await canAccessReference(userId, slug)

  if (!hasReference) {
    // Distinguish "not enrolled" from "tests not passed" so the student
    // knows what to do next.
    const hasAccess = await hasCourseAccess(userId)

    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
          <div className="mb-8 flex items-center gap-3">
            {chapter ? (
              <Link
                href={chapter.url}
                className={cn(buttonVariants({ variant: 'ghost' }), 'gap-2')}
              >
                <ArrowLeftIcon className="size-4" aria-hidden />
                Back to chapter
              </Link>
            ) : null}
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {reference.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{reference.summary}</p>

          {hasAccess ? (
            // Enrolled but tests not passed.
            <div className="mt-10 rounded-xl border border-border bg-card/60 p-8 text-center md:p-12">
              <span
                className="flex size-12 items-center justify-center rounded-full bg-muted"
                aria-hidden
              >
                <LockIcon className="size-5 text-muted-foreground" />
              </span>
              <h2 className="mt-4 font-heading text-2xl font-semibold tracking-tight">
                Reference is locked until your tests pass
              </h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                The reference implementation unlocks after you submit a passing
                test result from the CLI. Run{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
                  keel test {chapter?.order ?? slug}
                </code>{' '}
                followed by{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
                  keel submit
                </code>.
              </p>
              {chapter ? (
                <Link href={chapter.url} className={cn(buttonVariants(), 'mt-6')}>
                  Review the build-along
                  <ArrowLeftIcon className="size-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          ) : (
            // Not enrolled — billing paywall.
            <div className="mt-10">
              <ContentPaywall kind="reference" signedIn={Boolean(userId)} />
            </div>
          )}
        </main>
      </div>
    )
  }

  // Access granted: record the view (audit event + mark chapter complete),
  // then render the reference.
  await recordReferenceView(userId, slug)

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
        <div className="mb-6 flex items-center gap-3">
          {chapter ? (
            <Link
              href={chapter.url}
              className={cn(buttonVariants({ variant: 'ghost' }), 'gap-2')}
            >
              <ArrowLeftIcon className="size-4" aria-hidden />
              Back to chapter
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">
            <CheckCircleIcon className="size-3" aria-hidden />
            Unlocked
          </Badge>
          {chapter ? (
            <Badge variant="outline">
              Chapter {chapter.order}: {chapter.title}
            </Badge>
          ) : null}
        </div>

        <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">
          {reference.title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">
          {reference.summary}
        </p>

        <Separator className="my-8" />

        <article>
          <div data-layer="reference" className="mx-auto max-w-[75ch]">
            <MDXContent code={reference.body} />
          </div>
        </article>

        <Separator className="my-8" />

        {chapter ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              This reference is one honest way to solve the build-along. Your
              build may differ — the test suite is the contract.
            </p>
            <Link
              href={chapter.url}
              className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}
            >
              <ArrowLeftIcon className="size-4" aria-hidden />
              Back to chapter {chapter.order}
            </Link>
          </div>
        ) : null}
      </main>
    </div>
  )
}
