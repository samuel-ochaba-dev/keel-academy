import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  chapterProgress,
  progressEvents,
  type ChapterProgressRow,
} from '@/lib/db/schema'
import {
  applyEvent,
  percentForStatus,
  type ProgressEvent,
} from './state-machine'

// Every write runs the (userId, chapterSlug) row through the progress state
// machine (state-machine.ts) and, when the status actually changes, appends an
// audit row — both inside one transaction so the row and its history never
// drift. Transitions are monotonic, so replaying an event converges on the same
// row instead of spraying duplicates: the idempotency Chapter 1 teaches.
//
// Reading the current status then writing is a read-modify-write, but the
// transaction plus the monotonic machine make it safe: concurrent writes
// serialize, and a replayed transition is a no-op (from === to → no audit row).
async function applyProgress(
  userId: string,
  chapterSlug: string,
  event: ProgressEvent,
) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.chapterProgress.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.userId, userId), eq(table.chapterSlug, chapterSlug)),
    })

    const fromStatus = existing?.status ?? 'not_started'
    const toStatus = applyEvent(fromStatus, event)
    const now = new Date()

    await tx
      .insert(chapterProgress)
      .values({
        userId,
        chapterSlug,
        status: toStatus,
        percentComplete: percentForStatus(toStatus),
        startedAt: now,
        completedAt: toStatus === 'complete' ? now : null,
        lastVisitedAt: now,
      })
      .onConflictDoUpdate({
        target: [chapterProgress.userId, chapterProgress.chapterSlug],
        set: {
          status: toStatus,
          percentComplete: percentForStatus(toStatus),
          // Set the first-started / first-completed times once, then keep them.
          startedAt: existing?.startedAt ?? now,
          completedAt:
            toStatus === 'complete' ? (existing?.completedAt ?? now) : null,
          lastVisitedAt: now,
        },
      })

    // Audit only real transitions — a re-visit that stays 'reading' writes none.
    if (fromStatus !== toStatus) {
      await tx.insert(progressEvents).values({
        userId,
        chapterSlug,
        event,
        fromStatus,
        toStatus,
        createdAt: now,
      })
    }

    return { fromStatus, toStatus, changed: fromStatus !== toStatus }
  })
}

export function recordChapterVisit(userId: string, chapterSlug: string) {
  return applyProgress(userId, chapterSlug, 'visit')
}

export function markChapterComplete(userId: string, chapterSlug: string) {
  return applyProgress(userId, chapterSlug, 'complete')
}

export function getChapterProgress(userId: string, chapterSlug: string) {
  return db.query.chapterProgress.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.userId, userId), eq(table.chapterSlug, chapterSlug)),
  })
}

export async function getAllProgress(
  userId: string,
): Promise<ChapterProgressRow[]> {
  return db
    .select()
    .from(chapterProgress)
    .where(eq(chapterProgress.userId, userId))
}
