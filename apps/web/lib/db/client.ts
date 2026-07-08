import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { env } from '@/lib/env'
import * as schema from '@/lib/db/schema'

// TURSO_DATABASE_URL defaults to a local libSQL file (see lib/env.ts) so the
// walking skeleton runs with zero external secrets. Point it at a real Turso
// database (with a TURSO_AUTH_TOKEN) for embedded replicas in deployed envs.
const client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
