import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'
// Side-effect import: validates the environment at build time (fails the build
// on a missing/invalid var). See lib/env.ts for the schema.
import './lib/env'

// Content is compiled by Velite inside @keelacademy/content (its `content`/
// `build` script writes .velite there); Turbo runs it before the app via the
// task graph in turbo.json. The app consumes the generated collections through
// the package, so it's transpiled here alongside the other source packages.
const nextConfig: NextConfig = {
  // @t3-oss/env-* are ESM-only; transpile them for the Edge/standalone bundlers.
  transpilePackages: [
    '@keelacademy/content',
    '@keelacademy/ui',
    '@keelacademy/email',
    '@t3-oss/env-nextjs',
    '@t3-oss/env-core',
  ],
}

// Sentry wraps the config with source-map upload and release injection.
// When SENTRY_DSN is unset, Sentry is a silent no-op at runtime; the build
// still uploads source maps if SENTRY_AUTH_TOKEN is set (CI only).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in CI (when auth token is set). Local builds skip it.
  silent: !process.env.SENTRY_AUTH_TOKEN,
})
