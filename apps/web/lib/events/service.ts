import { db as defaultDb } from '@/lib/db/client'
import { auditEvents, type AuditEventRow } from '@/lib/db/schema'
import type { AuditEventTypeString } from './types'

type Db = typeof defaultDb

/**
 * Structured payload for an audit event. All fields beyond userId, type, and
 * subjectType/subjectId are optional and land in the `metadata` JSON column.
 * `metadata` is stored as a JSON-stringified text value in the SQLite column
 * (no native JSON type in libSQL).
 */
export interface EventPayload {
  userId: string
  type: AuditEventTypeString
  subjectType?: string
  subjectId?: string
  metadata?: Record<string, unknown>
}

/**
 * Insert a single typed audit-event row. Returns the inserted row so callers
 * can read back the auto-generated `id` and `occurredAt` timestamp.
 *
 * This is the canonical write path for ALL audit events. Every other service
 * that logs events (auth, progress, references, API wrappers) calls through
 * here so the event catalogue stays uniform and the admin dashboard query
 * works on a single table.
 */
export async function logEvent(
  payload: EventPayload,
  database: Db = defaultDb,
): Promise<AuditEventRow> {
  const metadataString = payload.metadata
    ? JSON.stringify(payload.metadata)
    : null

  const [row] = await database
    .insert(auditEvents)
    .values({
      actorUserId: payload.userId,
      type: payload.type,
      subjectType: payload.subjectType ?? null,
      subjectId: payload.subjectId ?? null,
      metadata: metadataString,
    })
    .returning()
  if (!row) throw new Error('Failed to write audit event')
  return row
}

/**
 * Convenience: log a simple event with no subject or metadata (e.g. auth
 * sign-in/sign-out, page view). Still writes a full audit row — the
 * `actorUserId` and `type` are enough for the admin dashboard.
 */
export async function logSimpleEvent(
  userId: string,
  type: AuditEventTypeString,
  database: Db = defaultDb,
): Promise<AuditEventRow> {
  return logEvent({ userId, type }, database)
}
