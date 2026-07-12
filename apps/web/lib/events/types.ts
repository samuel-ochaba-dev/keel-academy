/**
 * Centralized audit event type catalogue for M8 observability.
 *
 * Every event written to the `audit_event` table uses a dot-namespaced type
 * string. Define new types here (rather than scattering magic strings across
 * services) so the admin dashboard, Inngest triggers, and alerting all agree
 * on the same vocabulary.
 *
 * Convention: `<domain>.<verb>` (e.g. `auth.sign_in`, `chapter.progress`).
 * The `auditEvents.type` column is just a SQLite `text` field — there is no
 * database-level enum constraint. The catalogue here is the application-level
 * contract.
 */

// --- Auth events ---
export const AUTH_SIGN_IN_TYPE = 'auth.sign_in'
export const AUTH_SIGN_OUT_TYPE = 'auth.sign_out'
export const AUTH_TOKEN_REFRESH_TYPE = 'auth.token_refresh'

// --- Chapter / progress events ---
export const CHAPTER_PROGRESS_TYPE = 'chapter.progress'
/** Reference-implementation viewed (also defined in lib/references/rules.ts). */
export const REFERENCE_VIEWED_TYPE = 'reference.viewed'

// --- Page view events (client-side via route handler POST) ---
export const PAGE_VIEW_TYPE = 'page.view'

// --- API-level events ---
export const API_ERROR_TYPE = 'api.error'
export const API_MUTATION_TYPE = 'api.mutation'

/** All known audit event types as a const array (for iteration/validation). */
export const ALL_AUDIT_EVENT_TYPES = [
  AUTH_SIGN_IN_TYPE,
  AUTH_SIGN_OUT_TYPE,
  AUTH_TOKEN_REFRESH_TYPE,
  CHAPTER_PROGRESS_TYPE,
  REFERENCE_VIEWED_TYPE,
  PAGE_VIEW_TYPE,
  API_ERROR_TYPE,
  API_MUTATION_TYPE,
] as const

export type AuditEventTypeString = (typeof ALL_AUDIT_EVENT_TYPES)[number]
