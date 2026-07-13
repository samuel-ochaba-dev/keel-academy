const productionScriptSources = [
  "'self'",
  "'unsafe-inline'",
  'https://cdn.paddle.com',
  'https://*.sentry-cdn.com',
  'https://va.vercel-scripts.com',
]

// Next.js development tooling (React Fast Refresh and source maps) evaluates
// generated scripts. Keep that exception local to `next dev`; production never
// receives `unsafe-eval`.
const developmentScriptSources = [...productionScriptSources, "'unsafe-eval'"]

function createContentSecurityPolicy(scriptSources: string[]): string {
  const cspDirectives = [
    ['default-src', "'self'"],
    ['script-src', ...scriptSources],
    ['style-src', "'self'", "'unsafe-inline'"],
    ['img-src', "'self'", 'data:', 'blob:', 'https:'],
    ['font-src', "'self'", 'data:'],
    [
      'connect-src',
      "'self'",
      'https://*.paddle.com',
      'https://*.paddle.io',
      'https://*.ingest.sentry.io',
      'https://vitals.vercel-insights.com',
    ],
    ['frame-src', 'https://*.paddle.com', 'https://*.paddle.io'],
    ['worker-src', "'self'", 'blob:'],
    ['object-src', "'none'"],
    ['base-uri', "'self'"],
    ['form-action', "'self'"],
    ['frame-ancestors', "'none'"],
  ]

  return cspDirectives.map((directive) => directive.join(' ')).join('; ')
}

export const contentSecurityPolicy = createContentSecurityPolicy(
  productionScriptSources,
)

export const developmentContentSecurityPolicy = createContentSecurityPolicy(
  developmentScriptSources,
)

function createSecurityHeaders(contentSecurityPolicyValue: string) {
  return [
    {
      key: 'Content-Security-Policy',
      value: contentSecurityPolicyValue,
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-Frame-Options',
      value: 'DENY',
    },
  ] as const
}

export const securityHeaders = createSecurityHeaders(contentSecurityPolicy)

export const developmentSecurityHeaders = createSecurityHeaders(
  developmentContentSecurityPolicy,
)
