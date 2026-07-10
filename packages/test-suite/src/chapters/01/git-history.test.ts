import { describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'

const CONVENTIONAL_PREFIX =
  /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\(.+\))?!?:/

describe('Chapter 01 — git history', () => {
  it('git log shows at least one conventional commit', () => {
    let log: string
    try {
      log = execSync('git log --oneline -1', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim()
    } catch {
      throw new Error(
        'No git commits found. Run `git init && git add . && git commit -m "chore: scaffold project"`',
      )
    }
    expect(log).toMatch(CONVENTIONAL_PREFIX)
  })
})
