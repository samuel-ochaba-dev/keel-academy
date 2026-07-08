import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

// Applies the generated ./drizzle migrations through the libSQL client. Works
// for a local `file:` database and a remote Turso database (with a token).
const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const db = drizzle(client)

await migrate(db, { migrationsFolder: './drizzle' })
console.log('✓ migrations applied')
client.close()
