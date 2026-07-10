import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

// Mirrors @auth/core's AdapterAccountType, inlined so the app doesn't depend on
// a transitively-installed package the isolated pnpm linker wouldn't expose.
type AdapterAccountType = 'oauth' | 'oidc' | 'email' | 'webauthn'

// --- Auth.js v5 adapter tables ---------------------------------------------
// Table + column names are the canonical shape the @auth/drizzle-adapter maps
// to literally. Do not rename them.

export const users = sqliteTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
})

export const accounts = sqliteTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
)

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
})

export const verificationTokens = sqliteTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
)

// --- Domain tables ----------------------------------------------------------

export const chapterProgress = sqliteTable(
  'chapter_progress',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chapterSlug: text('chapter_slug').notNull(),
    status: text('status', {
      enum: ['not_started', 'reading', 'complete'],
    })
      .notNull()
      .default('not_started'),
    percentComplete: integer('percent_complete').notNull().default(0),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    lastVisitedAt: integer('last_visited_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex('chapter_progress_user_slug_idx').on(
      table.userId,
      table.chapterSlug,
    ),
  ],
)

export type ChapterProgressRow = typeof chapterProgress.$inferSelect
export type ChapterStatus = ChapterProgressRow['status']

// Append-only audit log of progress *transitions* (from !== to). Written by the
// progress service inside the same transaction as the status change, so the
// history of how a user moved through a chapter is durable and inspectable
// (M8 observability builds on this). Plain visits that don't change status are
// deliberately not recorded here — that firehose is a later analytics concern.
export const progressEvents = sqliteTable(
  'progress_event',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chapterSlug: text('chapter_slug').notNull(),
    event: text('event', { enum: ['visit', 'complete'] }).notNull(),
    fromStatus: text('from_status', {
      enum: ['not_started', 'reading', 'complete'],
    }).notNull(),
    toStatus: text('to_status', {
      enum: ['not_started', 'reading', 'complete'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('progress_event_user_idx').on(table.userId),
    index('progress_event_user_chapter_idx').on(
      table.userId,
      table.chapterSlug,
    ),
  ],
)

export type ProgressEventRow = typeof progressEvents.$inferSelect

// --- Billing & entitlements (M5) --------------------------------------------

// One row per user = their access to the apprenticeship. Written only by the
// signature-verified Paddle webhook (app/api/webhooks/paddle/route.ts) via the
// billing service, never from a checkout redirect — access is always derived
// from this row, so a spoofed success URL can't grant it. `plan` distinguishes
// the two products (monthly subscription vs one-time lifetime); entitlement is
// read by lib/entitlements/service.ts. Keyed uniquely on userId so replaying a
// webhook converges on one row instead of duplicating enrollments.
export const enrollments = sqliteTable(
  'enrollment',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    plan: text('plan', { enum: ['monthly', 'lifetime'] }).notNull(),
    status: text('status', {
      enum: ['active', 'canceled', 'past_due'],
    }).notNull(),
    paddleCustomerId: text('paddle_customer_id'),
    // Null for a lifetime one-time purchase; set for a monthly subscription.
    paddleSubscriptionId: text('paddle_subscription_id'),
    // Set for a lifetime one-time purchase (the completed transaction).
    paddleTransactionId: text('paddle_transaction_id'),
    priceId: text('price_id'),
    // Null for lifetime (no period); the subscription's next-bill / period end
    // for monthly, so entitlement can lapse when Paddle stops renewing.
    currentPeriodEndsAt: integer('current_period_ends_at', {
      mode: 'timestamp_ms',
    }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex('enrollment_user_idx').on(table.userId),
    index('enrollment_paddle_customer_idx').on(table.paddleCustomerId),
    index('enrollment_paddle_subscription_idx').on(table.paddleSubscriptionId),
  ],
)

export type EnrollmentRow = typeof enrollments.$inferSelect
export type EnrollmentPlan = EnrollmentRow['plan']
export type EnrollmentStatus = EnrollmentRow['status']

// Idempotency ledger for inbound provider webhooks. The unique (provider,
// provider_event_id) index is the dedupe key: the webhook route claims a row
// before fulfilling and marks it `processed` after, so a redelivery of an
// already-processed event is a safe no-op (design-doc §7). Retryable failures
// stay `received`/`failed` so Paddle's retries reprocess them.
export const webhookEvents = sqliteTable(
  'webhook_event',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    provider: text('provider').notNull(),
    providerEventId: text('provider_event_id').notNull(),
    eventType: text('event_type').notNull(),
    status: text('status', {
      enum: ['received', 'processed', 'failed'],
    })
      .notNull()
      .default('received'),
    payload: text('payload'),
    receivedAt: integer('received_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    processedAt: integer('processed_at', { mode: 'timestamp_ms' }),
    errorMessage: text('error_message'),
  },
  (table) => [
    uniqueIndex('webhook_event_provider_id_idx').on(
      table.provider,
      table.providerEventId,
    ),
    index('webhook_event_status_idx').on(table.status, table.receivedAt),
  ],
)

export type WebhookEventRow = typeof webhookEvents.$inferSelect

// --- CLI & test submissions (M6) --------------------------------------------

// Hashed CLI API keys. The raw key (`keel_<random>`) is shown to the student
// exactly once when created and is never stored — only its SHA-256 hash. The
// CLI sends the raw key in the X-Keel-Key header; the server hashes it to find
// the row (uniqueIndex on hashedKey), then uses the raw key to verify the
// HMAC signature on submission payloads. Revocation sets `revokedAt`; the
// lookup query filters on `revokedAt IS NULL`.
export const apiKeys = sqliteTable(
  'api_key',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    hashedKey: text('hashed_key').notNull(),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex('api_key_hash_idx').on(table.hashedKey),
    index('api_key_user_idx').on(table.userId),
  ],
)

export type ApiKeyRow = typeof apiKeys.$inferSelect

// Durable record of every CLI test submission. A passing submission (status =
// 'passed') is the proof that the student's local build meets the chapter spec.
// The server validates HMAC signature, timestamp freshness, test count, and
// prerequisites before inserting a row. `signatureHash` stores a SHA-256 of the
// HMAC signature for audit purposes (the full signature is not retained). M7
// (Reference Unlock) reads this table to gate reference access.
export const testSubmissions = sqliteTable(
  'test_submission',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chapterSlug: text('chapter_slug').notNull(),
    status: text('status', { enum: ['passed', 'failed'] }).notNull(),
    testsTotal: integer('tests_total').notNull(),
    testsPassed: integer('tests_passed').notNull(),
    testSuiteVersion: text('test_suite_version').notNull(),
    cliVersion: text('cli_version').notNull(),
    commitSha: text('commit_sha'),
    signatureHash: text('signature_hash').notNull(),
    submittedAt: integer('submitted_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index('test_sub_user_idx').on(table.userId),
    index('test_sub_user_chapter_idx').on(table.userId, table.chapterSlug),
    index('test_sub_user_time_idx').on(table.userId, table.submittedAt),
  ],
)

export type TestSubmissionRow = typeof testSubmissions.$inferSelect
export type SubmissionStatus = TestSubmissionRow['status']
