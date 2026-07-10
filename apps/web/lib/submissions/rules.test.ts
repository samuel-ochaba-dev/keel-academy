import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  verifyHmacSignature,
  verifyTimestamp,
  verifyAllPassed,
  verifyTestCount,
} from './rules'

describe('verifyHmacSignature', () => {
  const key = 'test-secret'
  const body = JSON.stringify({ chapter: '01', testsTotal: 3, testsPassed: 3 })

  it('validates a correct signature', () => {
    const signature = crypto
      .createHmac('sha256', key)
      .update(body)
      .digest('hex')
    expect(verifyHmacSignature(key, body, signature)).toBe(true)
  })

  it('rejects a signature with wrong key', () => {
    const signature = crypto
      .createHmac('sha256', 'wrong-key')
      .update(body)
      .digest('hex')
    expect(verifyHmacSignature(key, body, signature)).toBe(false)
  })

  it('rejects a signature for different body', () => {
    const signature = crypto
      .createHmac('sha256', key)
      .update('other body')
      .digest('hex')
    expect(verifyHmacSignature(key, body, signature)).toBe(false)
  })

  it('rejects an empty signature', () => {
    expect(verifyHmacSignature(key, body, '')).toBe(false)
  })
})

describe('verifyTimestamp', () => {
  const now = new Date('2026-07-10T12:00:00Z')

  it('accepts a timestamp within the window', () => {
    expect(verifyTimestamp('2026-07-10T11:58:00Z', now)).toBe(true)
  })

  it('rejects a stale timestamp (older than 5 min)', () => {
    expect(verifyTimestamp('2026-07-10T11:54:00Z', now)).toBe(false)
  })

  it('rejects a future timestamp', () => {
    expect(verifyTimestamp('2026-07-10T12:10:00Z', now)).toBe(false)
  })

  it('rejects an unparseable timestamp', () => {
    expect(verifyTimestamp('not-a-date', now)).toBe(false)
  })

  it('accepts exact boundary timestamp (5 min)', () => {
    expect(verifyTimestamp('2026-07-10T11:55:00Z', now)).toBe(true)
  })
})

describe('verifyAllPassed', () => {
  it('returns true when all tests pass', () => {
    expect(verifyAllPassed(3, 3)).toBe(true)
  })

  it('returns true for single test', () => {
    expect(verifyAllPassed(1, 1)).toBe(true)
  })

  it('returns false when some tests fail', () => {
    expect(verifyAllPassed(3, 2)).toBe(false)
  })

  it('returns false when zero tests', () => {
    expect(verifyAllPassed(0, 0)).toBe(false)
  })
})

describe('verifyTestCount', () => {
  it('accepts matching test count', () => {
    expect(verifyTestCount(3, 3)).toEqual({ valid: true })
  })

  it('rejects mismatched test count', () => {
    const result = verifyTestCount(2, 3)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('expected 3')
    expect(result.reason).toContain('got 2')
  })

  it('rejects too many tests', () => {
    const result = verifyTestCount(5, 3)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('expected 3')
    expect(result.reason).toContain('got 5')
  })
})