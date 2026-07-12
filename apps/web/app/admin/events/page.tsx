/**
 * Admin audit event dashboard (M8).
 *
 * Read-only view of the trailing 7 days of `audit_event` rows, paginated.
 * Displays timestamps, user IDs, event types, subject info, and metadata
 * (JSON). No mutation capability — purely observational.
 */

import { db } from '@/lib/db/client'
import { auditEvents } from '@/lib/db/schema'
import { desc, gte } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isAdminUser } from '@/lib/admin/service'
import { AuditEventsClient } from './client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminEventsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in?next=/admin/events')
  if (!(await isAdminUser(session.user.id))) notFound()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const rows = await db
    .select({
      id: auditEvents.id,
      createdAt: auditEvents.createdAt,
      actorUserId: auditEvents.actorUserId,
      type: auditEvents.type,
      subjectType: auditEvents.subjectType,
      subjectId: auditEvents.subjectId,
      metadata: auditEvents.metadata,
    })
    .from(auditEvents)
    .where(gte(auditEvents.createdAt, sevenDaysAgo))
    .orderBy(desc(auditEvents.createdAt))
    .limit(500)

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold">Audit Events</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last 7 days — up to 500 most recent events.
      </p>
      <AuditEventsClient rows={rows} />
    </div>
  )
}
