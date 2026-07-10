import { and, eq } from 'drizzle-orm'
import { db as defaultDb } from '@/lib/db/client'
import { webhookEvents, type WebhookEventRow } from '@/lib/db/schema'

type Db = typeof defaultDb

const PROVIDER = 'paddle'

// What the webhook route should do with an inbound delivery:
//   'new'               — first time seen; process it.
//   'retry'             — seen before but not finished; process it again
//                         (fulfillment is idempotent, so reprocessing is safe).
//   'already_processed' — a prior delivery finished; 200 and skip.
export type ClaimResult = 'new' | 'retry' | 'already_processed'

// Pure decision given the status of an existing ledger row (or null when our
// insert won the unique index and created it). Extracted so the dedupe logic is
// unit-testable without a database.
export function classifyClaim(
  existingStatus: WebhookEventRow['status'] | null,
): ClaimResult {
  if (existingStatus === null) return 'new'
  return existingStatus === 'processed' ? 'already_processed' : 'retry'
}

// Claim an event before fulfilling it. The unique (provider, provider_event_id)
// index makes a redelivery's insert a no-op, so we then read the existing row's
// status to decide. This is the idempotency seam the "replay is idempotent"
// exit criterion rests on.
export async function claimWebhookEvent(
  providerEventId: string,
  eventType: string,
  payload: string,
  database: Db = defaultDb,
): Promise<ClaimResult> {
  const inserted = await database
    .insert(webhookEvents)
    .values({
      provider: PROVIDER,
      providerEventId,
      eventType,
      status: 'received',
      payload,
    })
    .onConflictDoNothing({
      target: [webhookEvents.provider, webhookEvents.providerEventId],
    })
    .returning({ id: webhookEvents.id })

  if (inserted.length > 0) return classifyClaim(null)

  const existing = await database.query.webhookEvents.findFirst({
    where: (table, { and, eq }) =>
      and(
        eq(table.provider, PROVIDER),
        eq(table.providerEventId, providerEventId),
      ),
  })
  return classifyClaim(existing?.status ?? null)
}

export async function markWebhookProcessed(
  providerEventId: string,
  database: Db = defaultDb,
): Promise<void> {
  await database
    .update(webhookEvents)
    .set({ status: 'processed', processedAt: new Date(), errorMessage: null })
    .where(
      and(
        eq(webhookEvents.provider, PROVIDER),
        eq(webhookEvents.providerEventId, providerEventId),
      ),
    )
}

export async function markWebhookFailed(
  providerEventId: string,
  errorMessage: string,
  database: Db = defaultDb,
): Promise<void> {
  await database
    .update(webhookEvents)
    .set({ status: 'failed', errorMessage })
    .where(
      and(
        eq(webhookEvents.provider, PROVIDER),
        eq(webhookEvents.providerEventId, providerEventId),
      ),
    )
}
