import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Domain unit tests only (pure TS — no Next, no DB). The `@` alias mirrors the
// tsconfig path so modules under test can use the same imports as app code.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    include: ['lib/**/*.test.ts'],
  },
})
