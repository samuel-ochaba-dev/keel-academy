import { config } from '@keelacademy/eslint-config/base'

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ['.velite/**'] },
  ...config,
]
