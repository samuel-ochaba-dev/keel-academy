import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { createApiKey, listApiKeys } from '@/lib/api-keys/service'

export const runtime = 'nodejs'

const createKeySchema = z.object({
  name: z.string().min(1).max(64),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const keys = await listApiKeys(session.user.id)
  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    })),
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const parsed = createKeySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { rawKey, row } = await createApiKey(session.user.id, parsed.data.name)
  return NextResponse.json({
    key: rawKey,
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
  })
}
