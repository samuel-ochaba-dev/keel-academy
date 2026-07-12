const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  'https://cdn.paddle.com',
  'https://*.sentry-cdn.com',
  'https://va.vercel-scripts.com',
]

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

export const contentSecurityPolicy = cspDirectives
  .map((directive) => directive.join(' '))
  .join('; ')

export const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
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
