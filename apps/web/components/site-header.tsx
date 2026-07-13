import Link from 'next/link'
import { ChevronDownIcon } from 'lucide-react'
import { Wordmark } from '@keelacademy/ui/wordmark'
import { auth } from '@/auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { isAdminUser } from '@/lib/admin/service'
import { signOutAction } from '@/lib/auth-actions'
import { getAccountNavigation } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export async function SiteHeader() {
  const session = await auth()
  const isAdmin = session?.user?.id
    ? await isAdminUser(session.user.id)
    : false

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 md:px-10">
        <Link href="/" aria-label="Keelacademy home">
          <Wordmark />
        </Link>
        <nav
          className="flex items-center gap-1.5"
          aria-label="Primary navigation"
        >
          <ThemeToggle />
          {session?.user ? (
            <details className="group relative">
              <summary
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'cursor-pointer list-none [&::-webkit-details-marker]:hidden',
                )}
              >
                <span className="max-w-24 truncate sm:max-w-40">
                  {session.user.name ?? session.user.email ?? 'Account'}
                </span>
                <ChevronDownIcon
                  className="size-4 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="absolute right-0 mt-2 w-52 rounded-md border border-border bg-background p-1.5 shadow-lg">
                {getAccountNavigation(isAdmin).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-sm px-3 py-2 text-sm text-foreground hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-1 border-t border-border" />
                <form action={signOutAction}>
                  <SubmitButton
                    variant="ghost"
                    size="sm"
                    pendingText="Signing out…"
                    className="w-full justify-start"
                  >
                    Sign out
                  </SubmitButton>
                </form>
              </div>
            </details>
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
