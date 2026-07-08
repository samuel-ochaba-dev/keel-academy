import type { Metadata } from 'next'
import Link from 'next/link'
import { MailIcon } from 'lucide-react'
import { Wordmark } from '@keelacademy/ui/wordmark'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Check your email' }

export default function VerifyRequestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
      <Link href="/" aria-label="Keelacademy home">
        <Wordmark />
      </Link>
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <span className="mb-2 inline-flex size-12 items-center justify-center rounded-full bg-accent text-primary">
            <MailIcon className="size-6" aria-hidden />
          </span>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We sent a sign-in link. Click it to finish signing in — it expires in
            30 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-md border border-border bg-muted/50 p-3 text-left text-sm text-muted-foreground">
            Running locally? The link is printed to your{' '}
            <span className="font-medium text-foreground">terminal</span> (the
            dev server console), not emailed.
          </p>
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
          >
            Use a different email
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
