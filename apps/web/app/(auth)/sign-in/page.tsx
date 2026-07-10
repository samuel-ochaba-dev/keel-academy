import type { Metadata } from 'next'
import type { ComponentProps } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Wordmark } from '@keelacademy/ui/wordmark'
import { auth } from '@/auth'
import { env } from '@/lib/env'
import { requestMagicLink, signInWithGitHub } from '@/lib/auth-actions'
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
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Sign in' }

const errorMessages: Record<string, string> = {
  'missing-email': 'Enter your email address to continue.',
  'send-failed': "We couldn't send your link. Check the address and try again.",
  'oauth-failed': "We couldn't sign you in with GitHub. Please try again.",
  Verification: 'That link expired or was already used. Request a new one.',
}

// lucide-react 1.x dropped brand marks, so the GitHub logo is an inline SVG.
// `currentColor` keeps it token-compliant (inherits the button's text color).
function GitHubIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  const { error, next } = await searchParams
  const message = error
    ? (errorMessages[error] ?? 'Something went wrong. Please try again.')
    : undefined
  const nextTarget = next ?? '/dashboard'
  const githubEnabled = Boolean(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
      <Link href="/" aria-label="Keelacademy home">
        <Wordmark />
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            {githubEnabled
              ? 'No passwords. Continue with GitHub or get a one-time email link.'
              : "No passwords. We'll email you a one-time link to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {githubEnabled ? (
            <>
              <form action={signInWithGitHub}>
                <input type="hidden" name="next" value={nextTarget} />
                <SubmitButton
                  variant="outline"
                  className="w-full"
                  pendingText="Redirecting…"
                >
                  <GitHubIcon className="size-4" />
                  Continue with GitHub
                </SubmitButton>
              </form>
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
            </>
          ) : null}

          <form action={requestMagicLink} className="space-y-4">
            <input type="hidden" name="next" value={nextTarget} />
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
            <SubmitButton className="w-full" pendingText="Sending…">
              Send me a magic link
            </SubmitButton>
          </form>
        </CardContent>
        <CardFooter>
          <p className="w-full text-center text-xs text-muted-foreground">
            In local dev, the link prints to your terminal — no inbox needed.
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
