/**
 * Content revalidation workflow (Inngest v4).
 *
 * Triggered by `content.revalidate` events dispatched from a Vercel
 * deployment webhook (or manually from the admin dashboard). Calls
 * `revalidatePath` to purge Next.js's full-route cache so updated MDX
 * content is served immediately after deploy.
 *
 * Note: Revalidation requires an HTTP context (Route Handler or Server
 * Action), so the workflow proxies through an internal
 * `/api/internal/revalidate` route handler via a `step.run` fetch.
 */

import { inngest } from '@/lib/inngest/client'

export const contentRevalidation = inngest.createFunction(
  {
    id: 'content-revalidation',
    name: 'Content revalidation on deploy',
    triggers: [{ event: 'content.revalidate' }],
  },
  async ({ event, step }) => {
    const { paths } = event.data as { paths?: string[] }

    const targets = paths ?? ['/chapters']

    await step.run('revalidate-paths', async () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const res = await fetch(`${baseUrl}/api/internal/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: targets }),
      })
      if (!res.ok) {
        throw new Error(
          `Revalidation failed (${res.status}): ${await res.text()}`,
        )
      }
    })

    return { revalidated: targets }
  },
)
