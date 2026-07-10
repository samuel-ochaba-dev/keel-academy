import crypto from 'node:crypto'

// Pure validation rules for CLI test submissions. No DB, env, or React imports,
// so this runs in a plain vitest process without connecting to anything (same
// contract as lib/progress/state-machine.ts).

/** Max acceptable age between the payload timestamp and server time (anti-replay). */
export const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000 // 5 minutes

/** Max submissions per user per hour (anti-abuse, per RFC-002). */
export const MAX_SUBMISSIONS_PER_HOUR = 10

export function verifyHmacSignature(
  key: string,
  body: string,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', key)
    .update(body)
    .digest('hex')
  return expected === signature
}

export function verifyTimestamp(
  timestamp: string,
  now: Date,
  maxAgeMs: number = MAX_TIMESTAMP_AGE_MS,
): boolean {
  const payloadTime = new Date(timestamp).getTime()
  if (Number.isNaN(payloadTime)) return false
  const diff = Math.abs(now.getTime() - payloadTime)
  return diff <= maxAgeMs
}

export function verifyAllPassed(
  testsTotal: number,
  testsPassed: number,
): boolean {
  return testsTotal > 0 && testsPassed === testsTotal
}

export function verifyTestCount(
  testsTotal: number,
  expectedCount: number,
): { valid: boolean; reason?: string } {
  if (testsTotal !== expectedCount) {
    return {
      valid: false,
      reason: `Test count mismatch: expected ${expectedCount} tests but got ${testsTotal}. Update @keelacademy/test-suite.`,
    }
  }
  return { valid: true }
}
