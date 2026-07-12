import { describe, expect, it } from 'vitest'
import {
  canViewReference,
  isReferenceUnlocked,
  REFERENCE_SUBJECT_TYPE,
  REFERENCE_VIEWED_TYPE,
} from './rules'

const SLUG = 'the-first-commit'

describe('isReferenceUnlocked', () => {
  it('returns true when the chapter slug is in the passing set', () => {
    expect(isReferenceUnlocked(new Set([SLUG]), SLUG)).toBe(true)
  })

  it('returns false when the chapter slug is missing from the passing set', () => {
    expect(isReferenceUnlocked(new Set(['some-other-chapter']), SLUG)).toBe(
      false,
    )
  })

  it('returns false for an empty passing set', () => {
    expect(isReferenceUnlocked(new Set(), SLUG)).toBe(false)
  })

  it('returns false for a passing set that does not include the slug', () => {
    expect(
      isReferenceUnlocked(new Set(['ch-02', 'ch-03', 'ch-04']), SLUG),
    ).toBe(false)
  })

  it('is slug-exact: a different slug is not unlocked even if the target slug appears elsewhere in the set', () => {
    // Guard against a substring- or contains-style implementation.
    expect(isReferenceUnlocked(new Set(['the-first-commit-v2']), SLUG)).toBe(
      false,
    )
  })
})

describe('canViewReference', () => {
  it('returns true only when both course access and a passing submission hold', () => {
    expect(canViewReference(true, new Set([SLUG]), SLUG)).toBe(true)
  })

  it('returns false when the user has course access but no passing submission', () => {
    expect(canViewReference(true, new Set(), SLUG)).toBe(false)
  })

  it('returns false when the user has a passing submission but no course access', () => {
    expect(canViewReference(false, new Set([SLUG]), SLUG)).toBe(false)
  })

  it('returns false when neither course access nor a passing submission hold', () => {
    expect(canViewReference(false, new Set(), SLUG)).toBe(false)
  })
})

describe('audit descriptors', () => {
  it('exposes the canonical audit-event type for reference views', () => {
    expect(REFERENCE_VIEWED_TYPE).toBe('reference.viewed')
  })

  it('exposes the canonical audit-event subject type (the chapter)', () => {
    expect(REFERENCE_SUBJECT_TYPE).toBe('chapter')
  })
})
