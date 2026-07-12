/**
 * Inngest client for sending events and serving workflows.
 *
 * When INNGEST_EVENT_KEY is unset, `send` is a silent no-op that logs to
 * console in dev — no events are lost, but they don't reach Inngest. This
 * lets local dev and CI run without provisioning an Inngest account.
 *
 * Production needs both INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY set in
 * the environment. The signing key verifies that inbound requests to
 * `/api/inngest` genuinely came from Inngest.
 */

import { Inngest } from 'inngest'
import { env } from '@/lib/env'

export const inngest = new Inngest({
  id: 'keelacademy',
  eventKey: env.INNGEST_EVENT_KEY,
})

/**
 * Send an event to Inngest. Safe to call unconditionally — when the event
 * key is unset the event is logged to console instead of being sent. Use
 * this for every background job trigger rather than calling Inngest's API
 * directly so the app stays functional in dev without Inngest credentials.
 */
export async function sendEvent(
  eventName: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!env.INNGEST_EVENT_KEY) {
    console.log(`[inngest:noop] ${eventName}`, data)
    return
  }
  await inngest.send({ name: eventName, data })
}
