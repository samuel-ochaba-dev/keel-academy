import type { NextConfig } from 'next'
// Side-effect import: validates the environment at build time (fails the build
// on a missing/invalid var). See lib/env.ts for the schema.
import './lib/env'

// Velite runs as an explicit step in the `dev`, `build`, and `check-types`
// scripts (velite before next), which is the deterministic, Turbopack-safe
// approach and avoids a top-level-await / cold-start race in the config loader.
const nextConfig: NextConfig = {
  // @t3-oss/env-* are ESM-only; transpile them for the Edge/standalone bundlers.
  transpilePackages: ['@keelacademy/ui', '@t3-oss/env-nextjs', '@t3-oss/env-core'],
}

export default nextConfig
