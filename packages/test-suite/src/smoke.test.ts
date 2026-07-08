import { describe, expect, it } from 'vitest'
import { renderWelcomeEmail } from '@keelacademy/email/welcome-email'

// M0 smoke test: proves the workspace wires together and a cross-package import
// (test-suite -> email) renders. Real chapter test suites arrive in M6.
describe('M0 workspace smoke test', () => {
  it('renders the welcome email with the provided chapter', async () => {
    const html = await renderWelcomeEmail({
      name: 'Samuel',
      chapterTitle: 'The First Commit',
      chapterUrl: 'http://localhost:3000/chapters/the-first-commit',
    })

    expect(html).toContain('Welcome to Keelacademy')
    expect(html).toContain('The First Commit')
    expect(html).toContain('http://localhost:3000/chapters/the-first-commit')
  })
})
