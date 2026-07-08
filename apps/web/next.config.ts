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
    '@t3-oss/env-nextjs',
    '@t3-oss/env-core',
  ],
}

export default nextConfig
