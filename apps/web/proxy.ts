import { NextResponse, type NextRequest } from 'next/server'
import { isProtectedPath } from '@/lib/auth/protected-routes'

// Next.js 16 renamed `middleware` -> `proxy`. Per AGENTS.md this is COARSE
// request protection only: it checks for the presence of a session cookie and
// redirects anonymous users away from protected routes. The real authorization
// (valid session -> user) happens in the page via `await auth()` against the DB,
// because database-session validation needs DB access, not a cookie glance.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtectedPath(pathname)) return NextResponse.next()

  const hasSession =
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token')

  if (!hasSession) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/billing',
    '/billing/:path*',
    '/account',
    '/account/:path*',
    '/admin',
    '/admin/:path*',
  ],
}
