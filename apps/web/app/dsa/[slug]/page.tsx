import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { dsa } from '@keelacademy/content/collections'
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { getChapterForTerm, getDsaEntry } from '@keelacademy/content/lookup'
import { MDXContent } from '@/components/mdx-content'
import { SiteHeader } from '@/components/site-header'
import { Badge } from '@/components/ui/badge'

export function generateStaticParams() {
  return dsa.map((entry) => ({ slug: entry.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = getDsaEntry(slug)
  if (!entry) return {}
  return { title: entry.title, description: entry.summary }
}

export default async function DsaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getDsaEntry(slug)
  if (!entry) notFound()

  const introChapter = getChapterForTerm(slug)

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
        <div className="max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
            Keelacademy
          </Link>
          <div className="mt-6 space-y-2">
            <Badge variant="success">Emerging DSA</Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {entry.title}
            </h1>
            <p className="text-lg text-muted-foreground">{entry.summary}</p>
          </div>
          {introChapter ? (
            <Link
              href={introChapter.url}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Introduced in Chapter {introChapter.order}: {introChapter.title}
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          ) : null}
          <div data-layer="dsa" className="mt-8">
            <MDXContent code={entry.body} />
          </div>
        </div>
      </main>
    </div>
  )
}
