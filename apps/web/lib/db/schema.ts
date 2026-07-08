import { sql } from 'drizzle-orm'
import {
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
