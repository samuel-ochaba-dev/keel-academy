import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db as defaultDb } from '@/lib/db/client'
import {
  apiKeys,
  testSubmissions,
  type TestSubmissionRow,
} from '@/lib/db/schema'
import { listChapters } from '@keelacademy/content/lookup'
import {
  CHAPTER_TEST_SPECS,
  getChapterSpec,
} from '@keelacademy/contracts/chapter-spec'
import type { SubmissionPayload } from '@keelacademy/contracts/submission-payload'
import {
  MAX_SUBMISSIONS_PER_HOUR,
  verifyAllPassed,
  verifyTestCount,
  verifyTimestamp,
} from './rules'

type Db = typeof defaultDb

type ChapterRef = {
  order: number
  slug: string
  title: string
}

export type SubmissionResult = {
  status: 'passed' | 'failed' | 'rejected' | 'rate_limited'
  message: string
  chapterSlug?: string
}

type ValidateSubmissionInput = {
  userId: string
  keyId: string
  payload: SubmissionPayload
  signature: string
  now?: Date
  chapters?: ChapterRef[]
}

// Full validation pipeline (RFC-002): timestamp freshness, all tests passed,
// expected test count, prerequisite chapters, rate limit, then record. The
// HMAC signature verification happens in the route handler (an auth concern);
// this function owns the business rules and the durable write.
export async function validateAndRecordSubmission(
  input: ValidateSubmissionInput,
  database: Db = defaultDb,
): Promise<SubmissionResult> {
  const { userId, keyId, payload, signature } = input
  const now = input.now ?? new Date()
  const chapters = input.chapters ?? listChapters()

  // 1. Timestamp freshness (anti-replay)
  if (!verifyTimestamp(payload.timestamp, now)) {
    return {
      status: 'rejected',
      message: 'Timestamp is stale or invalid. Re-run `keel submit`.',
    }
  }

  // 2. All tests passed
  if (!verifyAllPassed(payload.testsTotal, payload.testsPassed)) {
    const failing = payload.testsTotal - payload.testsPassed
    return {
      status: 'failed',
      message: `${failing} test${failing === 1 ? '' : 's'} still failing.`,
    }
  }

  // 3. Expected test count matches chapter spec
  const spec = getChapterSpec(payload.chapter)
  if (!spec) {
    return {
      status: 'rejected',
      message: `No test spec found for chapter ${payload.chapter}.`,
    }
  }
  const countCheck = verifyTestCount(payload.testsTotal, spec.expectedTestCount)
  if (!countCheck.valid) {
    return {
      status: 'rejected',
      message: countCheck.reason ?? 'Test count mismatch.',
    }
  }

  // 4. Resolve chapter slug from chapter number
  const chapterNumber = parseInt(payload.chapter, 10)
  const chapter = chapters.find((c) => c.order === chapterNumber)
  if (!chapter) {
    return {
      status: 'rejected',
      message: `Unknown chapter ${payload.chapter}.`,
    }
  }

  // 5. Prerequisites — all prior chapters with test specs must have a passing
  //    submission (linear progression)
  const passingSlugs = await getPassingSubmissionSlugs(userId, database)
  const priorSpecChapters = Object.keys(CHAPTER_TEST_SPECS)
    .map((num) => parseInt(num, 10))
    .filter((num) => num < chapterNumber)

  for (const priorNum of priorSpecChapters) {
    const priorChapter = chapters.find((c) => c.order === priorNum)
    if (priorChapter && !passingSlugs.has(priorChapter.slug)) {
      return {
        status: 'rejected',
        message: `Complete chapter ${priorChapter.order} (${priorChapter.title}) first.`,
      }
    }
  }

  // 6. Rate limit — max submissions per hour
  const recentCount = await getRecentSubmissionCount(userId, now, database)
  if (recentCount >= MAX_SUBMISSIONS_PER_HOUR) {
    return {
      status: 'rate_limited',
      message: `Rate limit exceeded: max ${MAX_SUBMISSIONS_PER_HOUR} submissions per hour.`,
    }
  }

  // 7. Record the submission + update key lastUsedAt
  const signatureHash = crypto
    .createHash('sha256')
    .update(signature)
    .digest('hex')

  await database
    .insert(testSubmissions)
    .values({
      userId,
      chapterSlug: chapter.slug,
      status: 'passed',
      testsTotal: payload.testsTotal,
      testsPassed: payload.testsPassed,
      testSuiteVersion: payload.testSuiteVersion,
      cliVersion: payload.cliVersion,
      commitSha: payload.commitSha ?? null,
      signatureHash,
    })

  await database
    .update(apiKeys)
    .set({ lastUsedAt: now })
    .where(eq(apiKeys.id, keyId))

  return {
    status: 'passed',
    message: `Chapter ${payload.chapter} complete! Tests passed (${payload.testsPassed}/${payload.testsTotal}).`,
    chapterSlug: chapter.slug,
  }
}

async function getPassingSubmissionSlugs(
  userId: string,
  database: Db,
): Promise<Set<string>> {
  const rows = await database.query.testSubmissions.findMany({
    where: (table, { and, eq }) =>
      and(eq(table.userId, userId), eq(table.status, 'passed')),
  })
  return new Set(rows.map((r) => r.chapterSlug))
}

async function getRecentSubmissionCount(
  userId: string,
  now: Date,
  database: Db,
): Promise<number> {
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const rows = await database.query.testSubmissions.findMany({
    where: (table, { and, eq, gt }) =>
      and(eq(table.userId, userId), gt(table.submittedAt, oneHourAgo)),
  })
  return rows.length
}

// Latest submission per chapter — used by the status endpoint to show the
// student which chapters they've passed.
export async function getLatestSubmissionsByChapter(
  userId: string,
  database: Db = defaultDb,
): Promise<Map<string, TestSubmissionRow>> {
  const rows = await database.query.testSubmissions.findMany({
    where: (table, { eq }) => eq(table.userId, userId),
    orderBy: (table, { desc }) => [desc(table.submittedAt)],
  })
  const byChapter = new Map<string, TestSubmissionRow>()
  for (const row of rows) {
    if (!byChapter.has(row.chapterSlug)) {
      byChapter.set(row.chapterSlug, row)
    }
  }
  return byChapter
}
