import { describe, expect, it } from 'vitest'
import type { EnrollmentRow } from '@/lib/db/schema'
import { hasAccessFromEnrollment } from './service'

const NOW = new Date('2026-07-10T00:00:00.000Z')

// Minimal enrollment row builder — only the fields the predicate reads matter.
function enrollment(overrides: Partial<EnrollmentRow>): EnrollmentRow {
  return {
    id: 'enr_1',
    userId: 'user_1',
    plan: 'monthly',
    status: 'active',
    paddleCustomerId: null,
    paddleSubscriptionId: null,
    paddleTransactionId: null,
    priceId: null,
    currentPeriodEndsAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

describe('hasAccessFromEnrollment', () => {
  it('grants a valid lifetime enrollment', () => {
    expect(
      hasAccessFromEnrollment(
        enrollment({ plan: 'lifetime', status: 'active' }),
        NOW,
      ),
    ).toBe(true)
  })

  it('grants an active monthly subscription still in its period', () => {
    expect(
      hasAccessFromEnrollment(
        enrollment({
          plan: 'monthly',
          status: 'active',
          currentPeriodEndsAt: new Date('2026-08-10T00:00:00.000Z'),
        }),
        NOW,
      ),
    ).toBe(true)
  })

  it('grants an active monthly subscription with no explicit period', () => {
    expect(
      hasAccessFromEnrollment(
        enrollment({ plan: 'monthly', status: 'active' }),
        NOW,
      ),
    ).toBe(true)
  })

  it('denies a monthly subscription past its period end', () => {
    expect(
      hasAccessFromEnrollment(
        enrollment({
          plan: 'monthly',
          status: 'active',
          currentPeriodEndsAt: new Date('2026-06-10T00:00:00.000Z'),
        }),
        NOW,
      ),
    ).toBe(false)
  })

  it('denies a canceled enrollment (a failed/ended payment never grants access)', () => {
    expect(
      hasAccessFromEnrollment(enrollment({ status: 'canceled' }), NOW),
    ).toBe(false)
  })

  it('denies a past_due enrollment', () => {
    expect(
      hasAccessFromEnrollment(enrollment({ status: 'past_due' }), NOW),
    ).toBe(false)
  })

  it('denies when there is no enrollment at all', () => {
    expect(hasAccessFromEnrollment(null, NOW)).toBe(false)
    expect(hasAccessFromEnrollment(undefined, NOW)).toBe(false)
  })
})
