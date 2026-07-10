import { NextResponse, type NextRequest } from 'next/server'
import { listChapters } from '@keelacademy/content/lookup'
import { getApiKeyByHash, hashApiKey } from '@/lib/api-keys/service'
import { getLatestSubmissionsByChapter } from '@/lib/submissions/service'
import { db } from '@/lib/db/client'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-keel-key')
  if (!apiKey) {
    return NextResponse.json(
      { error: 'missing API key header' },
      { status: 401 },
    )
  }

  const keyRow = await getApiKeyByHash(hashApiKey(apiKey))
  if (!keyRow) {
    return NextResponse.json({ error: 'invalid API key' }, { status: 401 })
  }

  const user = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.id, keyRow.userId),
  })

  const chapters = listChapters()
  const submissions = await getLatestSubmissionsByChapter(keyRow.userId)

  const chapterSubmissions = chapters
    .filter((c) => submissions.has(c.slug))
    .map((c) => {
      const sub = submissions.get(c.slug)
      if (!sub) return null
      return {
        chapterOrder: c.order,
        chapterTitle: c.title,
        status: sub.status,
        testsPassed: sub.testsPassed,
        testsTotal: sub.testsTotal,
        submittedAt: sub.submittedAt.toISOString(),
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)

  return NextResponse.json({
    email: user?.email ?? '',
    submissions: chapterSubmissions,
  })
}
