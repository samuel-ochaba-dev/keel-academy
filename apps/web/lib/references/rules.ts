// Pure reference-unlock logic — the rules that gate access to reference
// implementations. No DB, env, or React imports, so this runs in a plain
// vitest process without connecting to anything (same contract as
// lib/submissions/rules.ts and lib/progress/state-machine.ts).

/** Audit-event type written when a student views a reference implementation. */
export const REFERENCE_VIEWED_TYPE = 'reference.viewed'

/** Audit-event subject type for reference views (the entity acted on). */
export const REFERENCE_SUBJECT_TYPE = 'chapter'

/**
 * Does this set of passing-submission slugs unlock the reference for the
 * given chapter? A reference is unlocked when the student has at least one
 * passing test submission (status = 'passed') for that exact chapter slug
 * (RFC-002). Pure so the rule is unit-tested without a DB.
 */
export function isReferenceUnlocked(
  passingSlugs: Set<string>,
  chapterSlug: string,
): boolean {
  return passingSlugs.has(chapterSlug)
}

/**
 * The full gate: course access (billing/entitlement) AND a passing submission.
 * Kept pure so both halves can be tested independently of the DB write paths.
 */
export function canViewReference(
  hasCourseAccess: boolean,
  passingSlugs: Set<string>,
  chapterSlug: string,
): boolean {
  return hasCourseAccess && isReferenceUnlocked(passingSlugs, chapterSlug)
}
