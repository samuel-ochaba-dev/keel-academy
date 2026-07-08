import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { dsa } from '#velite'
import { ArrowLeftIcon } from 'lucide-react'
import { getDsaEntry } from '@/lib/content'
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

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-6 py-12 md:px-10">
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
        <div data-layer="dsa" className="mt-8">
          <MDXContent code={entry.body} />
        </div>
      </main>
    </div>
  )
}
