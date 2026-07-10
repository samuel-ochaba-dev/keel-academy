import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '@/lib/db/schema'
import { activateLifetime } from './service'
import {
  claimWebhookEvent,
  classifyClaim,
  markWebhookProcessed,
} from './webhooks'

// A fresh in-memory libSQL database per test, migrated from ./drizzle so the
// real schema (unique indexes and all) backs the assertions.
async function makeTestDb() {
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './drizzle' })
  return db
}

type TestDb = Awaited<ReturnType<typeof makeTestDb>>

describe('classifyClaim', () => {
  it('treats a freshly inserted row (null) as new work', () => {
    expect(classifyClaim(null)).toBe('new')
  })

  it('skips an already-processed event', () => {
    expect(classifyClaim('processed')).toBe('already_processed')
  })

  it('reprocesses a received-but-unfinished or failed event', () => {
    expect(classifyClaim('received')).toBe('retry')
    expect(classifyClaim('failed')).toBe('retry')
  })
})

describe('claimWebhookEvent (idempotency)', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await makeTestDb()
  })

  it('claims a brand-new event as new', async () => {
    const result = await claimWebhookEvent('evt_1', 'transaction.completed', '{}', db)
    expect(result).toBe('new')
  })

  it('reports a replay of an unfinished event as retry, not new', async () => {
    await claimWebhookEvent('evt_1', 'transaction.completed', '{}', db)
    const replay = await claimWebhookEvent('evt_1', 'transaction.completed', '{}', db)
    expect(replay).toBe('retry')
  })

  it('reports a replay of a processed event as a duplicate to skip', async () => {
    await claimWebhookEvent('evt_1', 'transaction.completed', '{}', db)
    await markWebhookProcessed('evt_1', db)
    const replay = await claimWebhookEvent('evt_1', 'transaction.completed', '{}', db)
    expect(replay).toBe('already_processed')
  })

  it('stores exactly one ledger row no matter how many times an event is delivered', async () => {
    await claimWebhookEvent('evt_1', 'transaction.completed', '{}', db)
    await claimWebhookEvent('evt_1', 'transaction.completed', '{}', db)
    await claimWebhookEvent('evt_1', 'transaction.completed', '{}', db)
    const rows = await db.select().from(schema.webhookEvents)
    expect(rows).toHaveLength(1)
  })
})

describe('enrollment fulfillment (idempotency)', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await makeTestDb()
    await db
      .insert(schema.users)
      .values({ id: 'user_1', email: 'ada@example.com' })
  })

  it('converges on a single active enrollment when a purchase is replayed', async () => {
    const input = {
      userId: 'user_1',
      customerId: 'ctm_1',
      transactionId: 'txn_1',
      priceId: 'pri_life',
    }
    await activateLifetime(input, db)
    await activateLifetime(input, db)

    const rows = await db.select().from(schema.enrollments)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.plan).toBe('lifetime')
    expect(rows[0]?.status).toBe('active')
  })
})
