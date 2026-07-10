import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { ChildProcess } from 'node:child_process'
import { startApp, stopApp } from '../../helpers/app-runner'

describe('Chapter 01 — API health', () => {
  let proc: ChildProcess | null = null

  beforeAll(async () => {
    proc = await startApp('python', ['-m', 'api.wsgi'], 8000)
  }, 20_000)

  afterAll(() => {
    stopApp(proc)
  })

  it('GET /health returns 200 with {"status": "healthy"}', async () => {
    const res = await fetch('http://localhost:8000/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: 'healthy' })
  })
})
