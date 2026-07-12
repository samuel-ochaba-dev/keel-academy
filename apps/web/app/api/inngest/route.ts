/**
 * Inngest serve endpoint — handles `GET /api/inngest` (introspect) and
 * `POST /api/inngest` (execute). The `serve` call scans all registered
 * functions exported from `lib/inngest/functions/` (see that directory's
 * manifest for the full list).
 *
 * M8 workflows registered here: payment fulfillment, progress email,
 * session cleanup cron, and content revalidation.
 */

import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { functions } from '@/lib/inngest/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
})
