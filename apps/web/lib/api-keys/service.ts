import crypto from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db as defaultDb } from '@/lib/db/client'
import { apiKeys, type ApiKeyRow } from '@/lib/db/schema'

// API key management for CLI authentication. Raw keys (`keel_<random>`) are
// shown to the student once and stored only as SHA-256 hashes — the same
// approach GitHub uses for personal access tokens. The CLI sends the raw key
// in the X-Keel-Key header; the server hashes it to find the row (uniqueIndex
// on hashedKey), then uses the raw key to verify the HMAC signature.
//
// Functions accept a `database` so tests can pass a hermetic in-memory libSQL
// instance; app code uses the shared client.
type Db = typeof defaultDb

export function generateRawKey(): string {
  return `keel_${crypto.randomBytes(32).toString('hex')}`
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex')
}

export async function createApiKey(
  userId: string,
  name: string,
  database: Db = defaultDb,
): Promise<{ rawKey: string; row: ApiKeyRow }> {
  const rawKey = generateRawKey()
  const hashedKey = hashApiKey(rawKey)
  const [row] = await database
    .insert(apiKeys)
    .values({ userId, name, hashedKey })
    .returning()
  if (!row) throw new Error('Failed to create API key')
  return { rawKey, row }
}

export async function listApiKeys(
  userId: string,
  database: Db = defaultDb,
): Promise<ApiKeyRow[]> {
  return database.query.apiKeys.findMany({
    where: (table, { and, eq, isNull }) =>
      and(eq(table.userId, userId), isNull(table.revokedAt)),
  })
}

export async function revokeApiKey(
  userId: string,
  keyId: string,
  database: Db = defaultDb,
): Promise<void> {
  await database
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
}

export async function getApiKeyByHash(
  hash: string,
  database: Db = defaultDb,
): Promise<ApiKeyRow | undefined> {
  return database.query.apiKeys.findFirst({
    where: (table, { and, eq, isNull }) =>
      and(eq(table.hashedKey, hash), isNull(table.revokedAt)),
  })
}
