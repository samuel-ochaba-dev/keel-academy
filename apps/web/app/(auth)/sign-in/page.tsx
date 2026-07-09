import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wordmark } from '@keelacademy/ui/wordmark'
import { auth } from '@/auth'
import { requestMagicLink } from '@/lib/auth-actions'
import { SubmitButton } from '@/components/ui/submit-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata: Metadata = { title: 'Sign in' }

const errorMessages: Record<string, string> = {
  'missing-email': 'Enter your email address to continue.',
  'send-failed': "We couldn't send your link. Check the address and try again.",
  Verification: 'That link expired or was already used. Request a new one.',
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  const { error, next } = await searchParams
  const message = error ? errorMessages[error] : undefined

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
      <Link href="/" aria-label="Keelacademy home">
        <Wordmark />
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            No passwords. We&apos;ll email you a one-time link to continue.
          </CardDescription>
        </CardHeader>
        <form action={requestMagicLink}>
          <CardContent className="space-y-4">
            <input type="hidden" name="next" value={next ?? '/dashboard'} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
            {message ? (
              <p className="text-sm text-destructive">{message}</p>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-3">
            <SubmitButton className="w-full" pendingText="Sending…">
              Send me a magic link
            </SubmitButton>
            <p className="text-center text-xs text-muted-foreground">
              In local dev, the link prints to your terminal — no inbox needed.
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
