import type { Chapter } from '@keelacademy/content/lookup'
import { getChapterForTerm } from '@keelacademy/content/lookup'
import { isBillingConfigured } from '@/lib/billing/paddle'
import { getEnrollment } from '@/lib/billing/service'
import type { EnrollmentRow } from '@/lib/db/schema'

// Pure entitlement predicate: does this enrollment grant course access right
// now? Kept side-effect-free so every access rule is unit-tested without a DB.
//   - lifetime + active            -> access (no period to expire)
//   - monthly  + active + in-period -> access
//   - anything canceled / past_due  -> no access (a failed payment never grants)
//   - no enrollment                 -> no access
export function hasAccessFromEnrollment(
  enrollment: EnrollmentRow | null | undefined,
  now: Date,
): boolean {
  if (!enrollment || enrollment.status !== 'active') return false
  if (enrollment.plan === 'lifetime') return true
  // Monthly: honor the paid-through date when Paddle provided one.
  if (!enrollment.currentPeriodEndsAt) return true
  return enrollment.currentPeriodEndsAt.getTime() > now.getTime()
}

// The one async gate the app asks. In OPEN MODE (no Paddle secrets) everything
// is accessible, so local dev and CI behave exactly as before billing existed;
// once billing is configured, access is derived purely from the DB enrollment
// row — never from a checkout redirect.
export async function hasCourseAccess(
  userId: string | null | undefined,
  now: Date = new Date(),
): Promise<boolean> {
  if (!isBillingConfigured()) return true
  if (!userId) return false
  const enrollment = await getEnrollment(userId)
  return hasAccessFromEnrollment(enrollment, now)
}

// A free-sample chapter is always open (even to anonymous visitors); every
// other chapter needs course access. This is the whole-chapter paywall.
export async function canAccessChapter(
  chapter: Pick<Chapter, 'freeSample'>,
  userId: string | null | undefined,
): Promise<boolean> {
  if (chapter.freeSample) return true
  return hasCourseAccess(userId)
}

// A standalone lexicon/DSA entry inherits the access of the chapter that
// introduces it: terms first taught in a free-sample chapter stay open, the
// rest follow the paywall. Orphan terms (no introducing chapter) are treated as
// gated so nothing leaks by omission.
export async function canAccessTerm(
  termSlug: string,
  userId: string | null | undefined,
): Promise<boolean> {
  const chapter = getChapterForTerm(termSlug)
  if (chapter?.freeSample) return true
  return hasCourseAccess(userId)
}
