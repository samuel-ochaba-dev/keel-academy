import { db as defaultDb } from '@/lib/db/client'
import {
  enrollments,
  type EnrollmentRow,
  type EnrollmentStatus,
} from '@/lib/db/schema'

// The enrollment domain service. Every mutation is an upsert keyed on the
// unique userId index, so replaying a Paddle webhook converges on one row
// instead of duplicating access (the idempotency Chapter 1 teaches). Written
// only from the signature-verified webhook route; nothing here trusts a
// checkout redirect.
//
// Functions accept a `database` so tests can pass a hermetic in-memory libSQL
// instance; app code uses the shared client.
type Db = typeof defaultDb

export function getEnrollment(
  userId: string,
  database: Db = defaultDb,
): Promise<EnrollmentRow | undefined> {
  return database.query.enrollments.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
  })
}

// Best-effort fallback when a webhook lacks customData.userId: match the
// Paddle customer's email to a known user. Primary resolution is always the
// customData.userId the checkout attached (see components/checkout-button.tsx).
export async function findUserIdByEmail(
  email: string,
  database: Db = defaultDb,
): Promise<string | null> {
  const row = await database.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email.toLowerCase()),
  })
  return row?.id ?? null
}

type ActivateLifetimeInput = {
  userId: string
  customerId: string | null
  transactionId: string
  priceId: string | null
}

// One-time lifetime purchase: access forever, no billing period. Lifetime is
// the strongest grant, so it always wins an upsert.
export async function activateLifetime(
  input: ActivateLifetimeInput,
  database: Db = defaultDb,
): Promise<void> {
  const now = new Date()
  await database
    .insert(enrollments)
    .values({
      userId: input.userId,
      plan: 'lifetime',
      status: 'active',
      paddleCustomerId: input.customerId,
      paddleTransactionId: input.transactionId,
      priceId: input.priceId,
      currentPeriodEndsAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: enrollments.userId,
      set: {
        plan: 'lifetime',
        status: 'active',
        paddleCustomerId: input.customerId,
        paddleTransactionId: input.transactionId,
        priceId: input.priceId,
        currentPeriodEndsAt: null,
        updatedAt: now,
      },
    })
}

type UpsertSubscriptionInput = {
  userId: string
  customerId: string | null
  subscriptionId: string
  priceId: string | null
  status: EnrollmentStatus
  currentPeriodEndsAt: Date | null
}

// Monthly subscription lifecycle. Runs in a transaction that reads first so a
// subscription event never clobbers an existing active lifetime enrollment
// (a lifetime buyer who later starts a subscription keeps the stronger grant).
export async function upsertSubscription(
  input: UpsertSubscriptionInput,
  database: Db = defaultDb,
): Promise<void> {
  const now = new Date()
  await database.transaction(async (tx) => {
    const existing = await tx.query.enrollments.findFirst({
      where: (table, { eq }) => eq(table.userId, input.userId),
    })
    if (existing?.plan === 'lifetime' && existing.status === 'active') return

    await tx
      .insert(enrollments)
      .values({
        userId: input.userId,
        plan: 'monthly',
        status: input.status,
        paddleCustomerId: input.customerId,
        paddleSubscriptionId: input.subscriptionId,
        priceId: input.priceId,
        currentPeriodEndsAt: input.currentPeriodEndsAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: enrollments.userId,
        set: {
          plan: 'monthly',
          status: input.status,
          paddleCustomerId: input.customerId,
          paddleSubscriptionId: input.subscriptionId,
          priceId: input.priceId,
          currentPeriodEndsAt: input.currentPeriodEndsAt,
          updatedAt: now,
        },
      })
  })
}
