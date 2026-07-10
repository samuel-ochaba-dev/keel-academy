import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..', '..')

export default defineConfig({
  test: {
    root: packageRoot,
    include: ['src/chapters/01/*.test.ts'],
    environment: 'node',
  },
})
