import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './lib/db/schema.ts',
  // `generate` emits SQLite SQL without a DB connection; migrations are applied
  // by scripts/migrate.mjs through the libSQL client (works for local `file:`
  // and remote Turso alike).
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
  },
})
