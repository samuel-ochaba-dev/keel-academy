import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/chapter-spec.ts', 'src/submission-payload.ts'],
  format: ['esm'],
  target: 'node20',
  dts: true,
  clean: true,
})