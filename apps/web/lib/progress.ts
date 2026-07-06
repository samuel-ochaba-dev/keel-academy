import { and, eq } from "drizzle-orm";
import { listChapters } from "@repo/content";
import { db } from "@/lib/db";
import { chapterProgress } from "@/lib/schema";

export async function recordChapterVisit(userId: string, chapterSlug: string) {
  const existing = await db.query.chapterProgress.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.userId, userId), eq(table.chapterSlug, chapterSlug)),
  });

  if (!existing) {
    await db.insert(chapterProgress).values({
      userId,
      chapterSlug,
      status: "reading",
      percentComplete: 25,
    });

    return;
  }

  await db
    .update(chapterProgress)
    .set({
      status: existing.status === "not_started" ? "reading" : existing.status,
      percentComplete:
        existing.percentComplete === 0 ? 25 : existing.percentComplete,
      lastVisitedAt: new Date(),
    })
    .where(
      and(
        eq(chapterProgress.userId, userId),
        eq(chapterProgress.chapterSlug, chapterSlug),
      ),
    );
}

export async function markChapterAsComplete(
  userId: string,
  chapterSlug: string,
) {
  const existing = await db.query.chapterProgress.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.userId, userId), eq(table.chapterSlug, chapterSlug)),
  });

  if (!existing) {
    await db.insert(chapterProgress).values({
      userId,
      chapterSlug,
      status: "complete",
      percentComplete: 100,
      completedAt: new Date(),
    });

    return;
  }

  await db
    .update(chapterProgress)
    .set({
      status: "complete",
      percentComplete: 100,
      completedAt: new Date(),
      lastVisitedAt: new Date(),
    })
    .where(
      and(
        eq(chapterProgress.userId, userId),
        eq(chapterProgress.chapterSlug, chapterSlug),
      ),
    );
}

export async function getProgressForChapter(
  userId: string,
  chapterSlug: string,
) {
  return db.query.chapterProgress.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.userId, userId), eq(table.chapterSlug, chapterSlug)),
  });
}

export async function getDashboardProgress(userId: string) {
  const [chapters, rows] = await Promise.all([
    listChapters(),
    db.select().from(chapterProgress).where(eq(chapterProgress.userId, userId)),
  ]);

  return chapters.map((chapter) => {
    const row = rows.find((item) => item.chapterSlug === chapter.slug);

    return {
      ...chapter,
      status: row?.status ?? "not_started",
      percentComplete: row?.percentComplete ?? 0,
      lastVisitedAt: row?.lastVisitedAt ?? null,
    };
  });
}
