import Link from 'next/link'
import { Wordmark } from '@keelacademy/ui/wordmark'
import { auth } from '@/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { signOutAction } from '@/lib/auth-actions'
import { cn } from '@/lib/utils'

export async function SiteHeader() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-10">
        <Link href="/" aria-label="Keelacademy home">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1.5">
          <ThemeToggle />
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                Dashboard
              </Link>
              <form action={signOutAction}>
                <SubmitButton variant="outline" size="sm" pendingText="Signing out…">
                  Sign out
                </SubmitButton>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
