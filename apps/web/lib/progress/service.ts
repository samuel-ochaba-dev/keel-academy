import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { chapterProgress, type ChapterProgressRow } from '@/lib/db/schema'

// All writes are idempotent upserts keyed on (userId, chapterSlug). Opening a
// chapter twice, or double-submitting "complete", converges on the same row
// instead of spraying duplicates — the idempotency Chapter 1 teaches.

export async function recordChapterVisit(userId: string, chapterSlug: string) {
  await db
    .insert(chapterProgress)
    .values({
      userId,
      chapterSlug,
      status: 'reading',
      percentComplete: 25,
      startedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [chapterProgress.userId, chapterProgress.chapterSlug],
      set: {
        lastVisitedAt: new Date(),
        // Never downgrade a completed chapter back to reading.
        status: sql`case when ${chapterProgress.status} = 'not_started' then 'reading' else ${chapterProgress.status} end`,
        percentComplete: sql`case when ${chapterProgress.percentComplete} < 25 then 25 else ${chapterProgress.percentComplete} end`,
        startedAt: sql`coalesce(${chapterProgress.startedAt}, unixepoch() * 1000)`,
      },
    })
}

export async function markChapterComplete(userId: string, chapterSlug: string) {
  await db
    .insert(chapterProgress)
    .values({
      userId,
      chapterSlug,
      status: 'complete',
      percentComplete: 100,
      startedAt: new Date(),
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [chapterProgress.userId, chapterProgress.chapterSlug],
      set: {
        status: 'complete',
        percentComplete: 100,
        completedAt: new Date(),
        lastVisitedAt: new Date(),
        startedAt: sql`coalesce(${chapterProgress.startedAt}, unixepoch() * 1000)`,
      },
    })
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
