/**
 *
 * Payment fulfillment workflow (Inngest v4).
 *
 * Triggered by `payment.fulfill` events dispatched from the Paddle webhook
 * handler. This workflow owns the actual fulfillment logic: writing the
 * enrollment row, sending the welcome email, and logging the audit event.
 * The webhook handler itself only verifies signatures, deduplicates, and
 * fires the event — it doesn't touch enrollments directly, so the webhook
 * stays fast (RFC-005).
 */

import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db/client'
import { enrollments, webhookEvents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { logEvent } from '@/lib/events/service'
import { API_ERROR_TYPE } from '@/lib/events/types'

export const paymentFulfillment = inngest.createFunction(
  {
    id: 'payment-fulfillment',
    name: 'Payment fulfillment',
    retries: 3,
    triggers: [{ event: 'payment.fulfill' }],
    onFailure: async ({ event }) => {
      const payload = event.data?.event?.data as { userId?: string } | undefined
      const userId = payload?.userId ?? 'system'
      const errMsg = event.data?.error?.message ?? 'Unknown fulfillment failure'

      await logEvent({
        userId,
        type: API_ERROR_TYPE,
        subjectType: 'inngest.workflow',
        subjectId: 'payment-fulfillment',
        metadata: { workflow: 'payment-fulfillment', error: errMsg },
      })
    },
  },
  async ({ event, step }) => {
    const {
      userId,
      plan,
      paddleCustomerId,
      paddleSubscriptionId,
      paddleTransactionId,
      priceId,
      currentPeriodEndsAt,
      webhookEventId,
    } = event.data as {
      userId: string
      plan: 'monthly' | 'lifetime'
      paddleCustomerId: string
      paddleSubscriptionId?: string
      paddleTransactionId?: string
      priceId: string
      currentPeriodEndsAt?: number
      webhookEventId: string
    }

    // 1. Write the enrollment row (upsert via unique userId index)
    await step.run('upsert-enrollment', async () => {
      await db.transaction(async (tx) => {
        await tx.delete(enrollments).where(eq(enrollments.userId, userId))
        await tx.insert(enrollments).values({
          userId,
          plan,
          status: 'active',
          paddleCustomerId,
          paddleSubscriptionId: paddleSubscriptionId ?? null,
          paddleTransactionId: paddleTransactionId ?? null,
          priceId,
          currentPeriodEndsAt: currentPeriodEndsAt
            ? new Date(currentPeriodEndsAt)
            : null,
        })
      })
    })

    // 2. Mark the webhook event as processed
    await step.run('mark-webhook-processed', async () => {
      await db
        .update(webhookEvents)
        .set({ status: 'processed', processedAt: new Date() })
        .where(eq(webhookEvents.id, webhookEventId))
    })

    // 3. Send welcome email (placeholder — real email infra comes later)
    await step.run('send-welcome-email', async () => {
      // TODO: integrate with packages/email when transactional email is wired
      console.log(`[email:placeholder] Welcome email for user ${userId}`)
    })

    // 4. Trigger session cleanup for this user
    await step.sendEvent('send-event', {
      name: 'session.cleanup',
      data: { userId },
    })

    return { success: true }
  },
)
