/**
 * Progress email workflow (Inngest v4).
 *
 * Triggered by `chapter.completed` events fired when a student transitions
 * a chapter to `complete` status. Sends a congratulatory email (placeholder
 * until transactional email infra is wired) and logs the event for the ops
 * dashboard.
 */

import { inngest } from '@/lib/inngest/client'

export const progressEmails = inngest.createFunction(
  {
    id: 'progress-emails',
    name: 'Progress emails',
    retries: 2,
    triggers: [{ event: 'chapter.completed' }],
  },
  async ({ event, step }) => {
    const { userId, chapterSlug } = event.data as {
      userId: string
      chapterSlug: string
    }

    // 1. Look up user email (placeholder — will read from DB when user table
    //    has the field)
    const userEmail = await step.run('get-user-email', async () => {
      // TODO: query users table for email
      return `user-${userId}@placeholder.local`
    })

    // 2. Send the congratulatory email
    await step.run('send-progress-email', async () => {
      // TODO: integrate with packages/email when transactional email is wired
      console.log(
        `[email:placeholder] Congrats email for user ${userId} completing ${chapterSlug} (to: ${userEmail})`,
      )
    })

    return { sent: true, chapterSlug }
  },
)
