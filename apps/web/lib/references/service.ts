import { db as defaultDb } from '@/lib/db/client'
import { auditEvents, type AuditEventRow } from '@/lib/db/schema'
import { markChapterComplete } from '@/lib/progress/service'
import { hasCourseAccess } from '@/lib/entitlements/service'
import {
  canViewReference,
  REFERENCE_SUBJECT_TYPE,
  REFERENCE_VIEWED_TYPE,
} from './rules'

type Db = typeof defaultDb

/**
 * Returns the set of chapter slugs for which this user has a passing test
 * submission (status = 'passed'). M7 reads this to decide whether a
 * reference implementation is unlocked (RFC-002, design-doc §10.3).
 */
export async function getPassingChapterSlugs(
  userId: string,
  database: Db = defaultDb,
): Promise<Set<string>> {
  const rows = await database.query.testSubmissions.findMany({
    where: (table, { and, eq }) =>
      and(eq(table.userId, userId), eq(table.status, 'passed')),
  })
  return new Set(rows.map((r) => r.chapterSlug))
}

/**
 * Does this user have a passing test submission for this chapter? Convenience
 * wrapper around getPassingChapterSlugs for a single chapter check.
 */
export async function hasPassingSubmission(
  userId: string,
  chapterSlug: string,
  database: Db = defaultDb,
): Promise<boolean> {
  const slugs = await getPassingChapterSlugs(userId, database)
  return slugs.has(chapterSlug)
}

/**
 * The full reference-access gate. Returns true only when:
 *   1. The user has course access (active enrollment, or billing is in open
 *      mode for local dev/CI), AND
 *   2. The user has a passing test submission for this exact chapter slug.
 * Reference implementations are never served without both — the test suite is
 * the contract, and the passing submission is the proof (design-doc §10.3).
 */
export async function canAccessReference(
  userId: string | null | undefined,
  chapterSlug: string,
  now: Date = new Date(),
  database: Db = defaultDb,
): Promise<boolean> {
  if (!userId) return false
  const [access, passingSlugs] = await Promise.all([
    hasCourseAccess(userId, now),
    getPassingChapterSlugs(userId, database),
  ])
  return canViewReference(access, passingSlugs, chapterSlug)
}

/**
 * Record that a student viewed a reference implementation. Writes an audit
 * event and marks the chapter complete in one call so the unlocked → complete
 * transition (RFC-003) happens atomically. Both writes are idempotent:
 *   - markChapterComplete uses the monotonic progress state machine, so a
 *     re-view of an already-complete chapter is a no-op.
 *   - The audit event is append-only, so repeated views write one row each
 *     (deliberate — every view is logged, but progress is not corrupted).
 *     If the caller needs strict one-event-per-chapter, filter on the caller
 *     side; by default every view is recorded for observability.
 */
export async function recordReferenceView(
  userId: string,
  chapterSlug: string,
  database: Db = defaultDb,
): Promise<AuditEventRow> {
  // Mark the chapter complete (idempotent via the monotonic state machine).
  await markChapterComplete(userId, chapterSlug)

  // Log the audit event. Append-only — repeated views each get their own row
  // so the operator can see how many times a reference was accessed.
  const [row] = await database
    .insert(auditEvents)
    .values({
      actorUserId: userId,
      type: REFERENCE_VIEWED_TYPE,
      subjectType: REFERENCE_SUBJECT_TYPE,
      subjectId: chapterSlug,
    })
    .returning()
  if (!row) throw new Error('Failed to record reference view')
  return row
}

/**
 * Has this user ever viewed this chapter's reference? Used by the dashboard
 * to show a "viewed" badge and by tests to verify the audit trail.
 */
export async function hasViewedReference(
  userId: string,
  chapterSlug: string,
  database: Db = defaultDb,
): Promise<boolean> {
  const row = await database.query.auditEvents.findFirst({
    where: (table, { and, eq }) =>
      and(
        eq(table.actorUserId, userId),
        eq(table.type, REFERENCE_VIEWED_TYPE),
        eq(table.subjectId, chapterSlug),
      ),
  })
  return row !== undefined
}
