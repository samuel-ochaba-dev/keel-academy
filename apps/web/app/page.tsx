import Link from 'next/link'
import { ArrowRightIcon } from 'lucide-react'
import { listChapters } from '@/lib/content'
import { SiteHeader } from '@/components/site-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const layers = [
  {
    name: 'The Novel',
    description:
      'A junior engineer ships Kairo and makes every mistake. A senior corrects them — not gently, but clearly. You watch the failure play out before you write a line.',
  },
  {
    name: 'The Build-Along',
    description:
      'A spec and a test suite define "done." No walkthrough. The novel taught the idea; now you implement it until the tests are green.',
  },
  {
    name: 'The Lexicon',
    description:
      'Idempotency. Backpressure. Circuit breakers. Every term a working engineer uses, one click away, with the mistake people make with it.',
  },
  {
    name: 'Emerging DSA',
    description:
      'The algorithms you actually needed to build the thing — topological sort for the workflow engine, token buckets for rate limits — not abstract puzzles.',
  },
]

export default function HomePage() {
  const firstChapter = listChapters()[0]

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 md:px-10">
        <section className="mx-auto max-w-3xl pt-20 pb-16 text-center md:pt-28">
          <Badge variant="outline" className="mb-6">
            An apprenticeship, not a course
          </Badge>
          <h1 className="text-balance font-heading text-4xl font-semibold tracking-tight md:text-6xl">
            You can make things work. Here you learn to make them hold.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Keelacademy is a novel-driven school where you build{' '}
            <span className="text-foreground">Kairo</span> — a ten-service LLM
            platform — one chapter at a time. Read the story, look up what you
            don&apos;t know, then build it against a real test suite.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {firstChapter ? (
              <Link
                href={firstChapter.url}
                className={cn(buttonVariants({ size: 'lg' }))}
              >
                Read the first chapter
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            ) : null}
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              Track your progress
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {layers.map((layer) => (
            <Card key={layer.name}>
              <CardHeader>
                <CardTitle className="text-xl">{layer.name}</CardTitle>
                <CardDescription className="text-[0.95rem] leading-7">
                  {layer.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="mt-16 rounded-xl border border-border bg-card p-8 md:p-10">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              What you leave with
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Not a certificate. A multi-service system you built from commit
              one — tested, documented, and deployable — plus the judgment to
              explain why every boundary is shaped the way it is.
            </p>
          </div>
          {firstChapter ? (
            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-8">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {firstChapter.part}
                </p>
                <p className="font-heading text-lg font-semibold">
                  Chapter {firstChapter.order}: {firstChapter.title}
                </p>
              </div>
              <Link
                href={firstChapter.url}
                className={cn(buttonVariants({ variant: 'secondary' }))}
              >
                Start reading
                <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
