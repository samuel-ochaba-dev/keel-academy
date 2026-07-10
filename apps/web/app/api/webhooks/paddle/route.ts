import { EventName, type EventEntity } from '@paddle/paddle-node-sdk'
import { NextResponse, type NextRequest } from 'next/server'
import { getPaddle, isBillingConfigured } from '@/lib/billing/paddle'
import {
  activateLifetime,
  findUserIdByEmail,
  upsertSubscription,
} from '@/lib/billing/service'
import {
  claimWebhookEvent,
  markWebhookFailed,
  markWebhookProcessed,
} from '@/lib/billing/webhooks'
import { env } from '@/lib/env'
import type { EnrollmentStatus } from '@/lib/db/schema'

// The Paddle SDK verifies the signature against the exact bytes Paddle sent, so
// the body must be read raw — Next's JSON parsing would break it. Node runtime
// (not Edge): the SDK and DB client need Node APIs.
export const runtime = 'nodejs'

// Paddle subscription statuses we don't map 1:1 to an entitlement:
//   trialing -> active (grant access during the trial)
//   paused   -> past_due (no access, but keep the row for resume)
// Everything else falls through to no-access.
function toEnrollmentStatus(paddleStatus: string): EnrollmentStatus {
  switch (paddleStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'paused':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    default:
      return 'canceled'
  }
}

// Pull our own app user id off the event. Primary source is the customData the
// checkout attached; falls back to matching the Paddle customer email to a user
// so a purchase started outside our checkout (or with stripped customData)
// still fulfills. Returns null when neither resolves — the route treats that as
// a non-retryable skip.
async function resolveUserId(
  customData: Record<string, unknown> | null | undefined,
  email: string | null | undefined,
): Promise<string | null> {
  const fromCustom = customData?.userId
  if (typeof fromCustom === 'string' && fromCustom.length > 0) return fromCustom
  if (email) return findUserIdByEmail(email)
  return null
}

// Fulfill one verified event by writing enrollment state. Idempotent: each
// branch is an upsert keyed on userId, so reprocessing a redelivered event
// converges rather than duplicating. Returns false when the event is one we
// intentionally ignore (so the route can mark it processed and 200).
async function fulfill(event: EventEntity): Promise<boolean> {
  switch (event.eventType) {
    case EventName.TransactionCompleted: {
      const tx = event.data
      // A subscription's first transaction also completes; the subscription
      // events own that grant, so only a one-off (no subscriptionId) is treated
      // as a lifetime purchase here.
      if (tx.subscriptionId) return true
      // Our checkout always attaches customData.userId; the email fallback needs
      // a lookup we skip here since the transaction payload carries no email.
      const userId = await resolveUserId(
        tx.customData as Record<string, unknown> | null,
        undefined,
      )
      if (!userId) return true
      await activateLifetime({
        userId,
        customerId: tx.customerId,
        transactionId: tx.id,
        priceId: tx.items[0]?.price?.id ?? null,
      })
      return true
    }
    case EventName.SubscriptionActivated:
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionCanceled:
    case EventName.SubscriptionPastDue: {
      const sub = event.data
      const userId = await resolveUserId(
        sub.customData as Record<string, unknown> | null,
        undefined,
      )
      if (!userId) return true
      await upsertSubscription({
        userId,
        customerId: sub.customerId,
        subscriptionId: sub.id,
        priceId: sub.items[0]?.price?.id ?? null,
        status: toEnrollmentStatus(sub.status),
        currentPeriodEndsAt: sub.currentBillingPeriod?.endsAt
          ? new Date(sub.currentBillingPeriod.endsAt)
          : null,
      })
      return true
    }
    default:
      // Event we don't act on (e.g. product.updated). Record and move on.
      return true
  }
}

export async function POST(request: NextRequest) {
  // Open mode: no way to verify signatures, so refuse rather than trust
  // unverified payloads. Nothing writes enrollment state in this mode.
  if (!isBillingConfigured() || !env.PADDLE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'billing not configured' }, { status: 503 })
  }

  const signature = request.headers.get('paddle-signature') ?? ''
  const rawBody = await request.text()

  let event: EventEntity
  try {
    event = await getPaddle().webhooks.unmarshal(
      rawBody,
      env.PADDLE_WEBHOOK_SECRET,
      signature,
    )
  } catch {
    // Bad/missing signature or tampered body — never process it.
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  const claim = await claimWebhookEvent(event.eventId, event.eventType, rawBody)
  if (claim === 'already_processed') {
    // Idempotent replay: a prior delivery already fulfilled this event.
    return NextResponse.json({ status: 'duplicate' })
  }

  try {
    await fulfill(event)
    await markWebhookProcessed(event.eventId)
    return NextResponse.json({ status: 'processed' })
  } catch (error) {
    // Leave the ledger row un-processed and 500 so Paddle retries; the
    // idempotent upserts make reprocessing safe.
    const message = error instanceof Error ? error.message : 'unknown error'
    await markWebhookFailed(event.eventId, message)
    return NextResponse.json({ error: 'fulfillment failed' }, { status: 500 })
  }
}
