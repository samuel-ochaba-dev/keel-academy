/**
 * Session cleanup cron (Inngest v4).
 *
 * Runs periodically (every 6 hours) to purge expired auth sessions from the
 * database. This keeps the session table lean and helps enforce "must
 * re-authenticate every 30 days" semantics (NFR-002).
 */

import { inngest } from '@/lib/inngest/client'
import { db } from '@/lib/db/client'
import { sessions } from '@/lib/db/schema'
import { lt } from 'drizzle-orm'
import { logEvent } from '@/lib/events/service'
import { API_MUTATION_TYPE } from '@/lib/events/types'

export const sessionCleanupCron = inngest.createFunction(
  {
    id: 'session-cleanup-cron',
    name: 'Session cleanup cron (6h)',
    triggers: [{ cron: 'TZ=UTC 0 */6 * * *' }],
  },
  async ({ step }) => {
    const result = await step.run('purge-expired-sessions', async () => {
      const now = new Date()
      const deleted = await db
        .delete(sessions)
        .where(lt(sessions.expires, now))
        .returning({ id: sessions.sessionToken })

      return deleted.length
    })

    // Log a summary audit event
    await step.run('log-cleanup-audit', async () => {
      await logEvent({
        userId: 'system',
        type: API_MUTATION_TYPE,
        subjectType: 'auth.session',
        subjectId: 'cron:session-cleanup',
        metadata: { purgedCount: result },
      })
    })

    return { purged: result }
  },
)
