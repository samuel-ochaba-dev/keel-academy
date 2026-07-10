import { NextResponse, type NextRequest } from 'next/server'

// Next.js 16 renamed `middleware` -> `proxy`. Per AGENTS.md this is COARSE
// request protection only: it checks for the presence of a session cookie and
// redirects anonymous users away from protected routes. The real authorization
// (valid session -> user) happens in the page via `await auth()` against the DB,
// because database-session validation needs DB access, not a cookie glance.
const PROTECTED_PREFIXES = ['/dashboard', '/billing']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
  if (!isProtected) return NextResponse.next()

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
  matcher: ['/dashboard', '/dashboard/:path*', '/billing', '/billing/:path*'],
}
