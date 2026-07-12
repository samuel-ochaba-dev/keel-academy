import { describe, expect, it } from 'vitest'
import { isProtectedPath } from './protected-routes'

describe('isProtectedPath', () => {
  it.each([
    '/dashboard',
    '/dashboard/progress',
    '/billing',
    '/billing/success',
    '/account',
    '/account/api-keys',
    '/admin',
    '/admin/events',
  ])('protects %s', (pathname) => {
    expect(isProtectedPath(pathname)).toBe(true)
  })

  it.each(['/', '/chapters/the-first-commit', '/lexicon/idempotency'])(
    'leaves public path %s alone',
    (pathname) => {
      expect(isProtectedPath(pathname)).toBe(false)
    },
  )
})
