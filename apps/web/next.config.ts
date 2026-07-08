import type { NextConfig } from 'next'

// Velite runs as an explicit step in the `dev`, `build`, and `check-types`
// scripts (velite before next), which is the deterministic, Turbopack-safe
// approach and avoids a top-level-await / cold-start race in the config loader.
const nextConfig: NextConfig = {
  transpilePackages: ['@keelacademy/ui'],
}

export default nextConfig
