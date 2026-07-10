import { NextResponse, type NextRequest } from 'next/server'
import { submissionPayloadSchema } from '@keelacademy/contracts/submission-payload'
import { getApiKeyByHash, hashApiKey } from '@/lib/api-keys/service'
import { validateAndRecordSubmission } from '@/lib/submissions/service'
import { verifyHmacSignature } from '@/lib/submissions/rules'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const apiKey = request.headers.get('x-keel-key')
  const signature = request.headers.get('x-keel-signature')

  if (!apiKey || !signature) {
    return NextResponse.json(
      { error: 'missing authentication headers' },
      { status: 401 },
    )
  }

  // Hash the raw key to look up the user (only the hash is stored).
  const keyRow = await getApiKeyByHash(hashApiKey(apiKey))
  if (!keyRow) {
    return NextResponse.json({ error: 'invalid API key' }, { status: 401 })
  }

  // Verify the HMAC signature against the raw body bytes.
  if (!verifyHmacSignature(apiKey, rawBody, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const parsed = submissionPayloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const result = await validateAndRecordSubmission({
      userId: keyRow.userId,
      keyId: keyRow.id,
      payload: parsed.data,
      signature,
    })

    const statusCode =
      result.status === 'passed'
        ? 200
        : result.status === 'failed'
          ? 422
          : result.status === 'rate_limited'
            ? 429
            : 403

    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return NextResponse.json(
      { error: 'submission failed', message },
      { status: 500 },
    )
  }
}
