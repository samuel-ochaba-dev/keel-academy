import { describe, expect, it } from 'vitest'
import { contentSecurityPolicy, securityHeaders } from './headers'

describe('securityHeaders', () => {
  it('ships an enforced CSP header', () => {
    expect(securityHeaders).toContainEqual({
      key: 'Content-Security-Policy',
      value: contentSecurityPolicy,
    })
  })

  it('allows the required first-party, Paddle, Sentry, and Vercel endpoints', () => {
    expect(contentSecurityPolicy).toContain("default-src 'self'")
    expect(contentSecurityPolicy).toContain('https://cdn.paddle.com')
    expect(contentSecurityPolicy).toContain('https://*.paddle.com')
    expect(contentSecurityPolicy).toContain('https://*.ingest.sentry.io')
    expect(contentSecurityPolicy).toContain(
      'https://vitals.vercel-insights.com',
    )
  })

  it('denies framing and plugin/object execution', () => {
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'")
    expect(contentSecurityPolicy).toContain("object-src 'none'")
  })
})
