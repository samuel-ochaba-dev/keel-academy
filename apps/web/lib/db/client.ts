import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '@/lib/db/schema'

// M0 defaults to a local libSQL file so the walking skeleton runs with zero
// external secrets. Point TURSO_DATABASE_URL at a real Turso database (with a
// TURSO_AUTH_TOKEN) to use embedded replicas in deployed environments.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
