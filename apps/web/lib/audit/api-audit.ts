/**
 * API mutation audit wrapper for M8 observability.
 *
 * Wraps any API mutation (route handler body parsing, DB writes, etc.) so
 * every mutation that succeeds/fails is logged as an `api.mutation` audit
 * event. Sensitive fields (passwords, tokens, keys) are masked before they
 * land in the `metadata` column — the raw values are never stored.
 *
 * Usage in a route handler:
 *   const result = await withMutationAudit(userId, 'POST /api/keys', body, async () => {
 *     return await createKey(userId, body.name)
 *   })
 *
 * The `body` is a record of input fields. Sensitive keys listed in
 * SENSITIVE_FIELDS are replaced with `'[REDACTED]'` before they're stored.
 */

import { logEvent } from '@/lib/events/service'
import { API_MUTATION_TYPE } from '@/lib/events/types'

/** Field names whose values are replaced with `'[REDACTED]'` in audit logs. */
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'secret',
  'key',
  'apiKey',
  'api_key',
  'signature',
  'credential',
  'accessToken',
  'refreshToken',
  'authorization',
])

/**
 * Recursively mask sensitive field values in an object. Returns a new object
 * — the original is never mutated. Only top-level keys are checked; nested
 * objects are recursed into but their keys aren't matched against the
 * sensitive list (a field named `key` inside a nested config is masked too).
 */
function maskSensitive(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const masked: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_FIELDS.has(key)) {
      masked[key] = '[REDACTED]'
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      masked[key] = maskSensitive(value as Record<string, unknown>)
    } else {
      masked[key] = value
    }
  }
  return masked
}

/**
 * Execute a mutation and log an `api.mutation` audit event regardless of
 * outcome. On success the metadata includes `{ outcome: 'success' }`; on
 * failure it includes `{ outcome: 'error', error: message }`. The input body
 * is masked before storage so secrets never leak into the audit trail.
 *
 * Returns the mutation's return value on success. Re-throws on failure after
 * logging, so the caller's error handling (Sentry, response) still fires.
 */
export async function withMutationAudit<T>(
  userId: string,
  route: string,
  body: Record<string, unknown> | null,
  mutation: () => Promise<T>,
): Promise<T> {
  const start = Date.now()
  try {
    const result = await mutation()
    const durationMs = Date.now() - start

    await logEvent({
      userId,
      type: API_MUTATION_TYPE,
      subjectType: 'api.route',
      subjectId: route,
      metadata: {
        outcome: 'success',
        durationMs,
        input: body ? maskSensitive(body) : null,
      },
    })

    return result
  } catch (error: unknown) {
    const durationMs = Date.now() - start
    const message = error instanceof Error ? error.message : 'Unknown error'

    await logEvent({
      userId,
      type: API_MUTATION_TYPE,
      subjectType: 'api.route',
      subjectId: route,
      metadata: {
        outcome: 'error',
        durationMs,
        error: message,
        input: body ? maskSensitive(body) : null,
      },
    })

    throw error
  }
}

/**
 * Lightweight convenience: log a mutation that already completed (success or
 * failure) without wrapping the execution. Useful when the mutation result is
 * already known or the audit must be written outside the request lifecycle
 * (e.g. from an Inngest job).
 */
export async function logMutationEvent(
  userId: string,
  route: string,
  outcome: 'success' | 'error',
  body: Record<string, unknown> | null,
  durationMs: number,
  errorMessage?: string,
): Promise<void> {
  await logEvent({
    userId,
    type: API_MUTATION_TYPE,
    subjectType: 'api.route',
    subjectId: route,
    metadata: {
      outcome,
      durationMs,
      ...(errorMessage ? { error: errorMessage } : {}),
      input: body ? maskSensitive(body) : null,
    },
  })
}
