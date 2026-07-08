import { nextJsConfig } from '@keelacademy/eslint-config/next'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    ignores: ['.next/**', '.velite/**', 'node_modules/**'],
  },
]
