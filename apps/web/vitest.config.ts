import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Domain unit tests. Most are pure TS; the billing suite also spins up a
// hermetic in-memory libSQL database to prove webhook idempotency end to end.
// The `@` alias mirrors the tsconfig path so modules under test import exactly
// as app code does. SKIP_ENV_VALIDATION lets modules that transitively import
// the env schema load without real secrets.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    include: ['lib/**/*.test.ts'],
    env: {
      SKIP_ENV_VALIDATION: '1',
      // With validation skipped, t3-env doesn't apply Zod defaults, so give the
      // shared db client a valid URL to construct with. Tests never query it —
      // they pass their own in-memory database — but importing it must not throw.
      TURSO_DATABASE_URL: ':memory:',
    },
  },
})
