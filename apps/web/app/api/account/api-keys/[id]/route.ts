import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/auth'
import { revokeApiKey } from '@/lib/api-keys/service'

export const runtime = 'nodejs'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await revokeApiKey(session.user.id, id)
  return NextResponse.json({ status: 'revoked' })
}
