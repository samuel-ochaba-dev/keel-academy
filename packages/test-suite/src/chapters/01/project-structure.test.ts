import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'

describe('Chapter 01 — project structure', () => {
  it('api/app_factory.py exists and exports create_app', () => {
    const factoryPath = path.join(process.cwd(), 'api', 'app_factory.py')
    expect(existsSync(factoryPath)).toBe(true)

    expect(() => {
      execSync('python -c "from api.app_factory import create_app"', {
        stdio: 'pipe',
      })
    }).not.toThrow()
  })
})
