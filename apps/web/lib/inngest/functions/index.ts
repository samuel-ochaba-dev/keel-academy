/**
 * Inngest functions manifest.
 *
 * Every function exported from this barrel is registered with the Inngest
 * serve handler in `app/api/inngest/route.ts`. Add new functions by
 * exporting them from their module and adding them to the `functions`
 * array below.
 */

import { progressEmails } from './progress-emails'
import { sessionCleanupCron } from './session-cleanup-cron'
import { contentRevalidation } from './content-revalidation'

export const functions = [
  progressEmails,
  sessionCleanupCron,
  contentRevalidation,
] as const
