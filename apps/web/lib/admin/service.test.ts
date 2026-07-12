import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { beforeEach, describe, expect, it } from 'vitest'
import * as schema from '@/lib/db/schema'
import { isAdminRole, isAdminUser } from './service'

async function makeTestDb() {
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: './drizzle' })
  return db
}

type TestDb = Awaited<ReturnType<typeof makeTestDb>>

describe('isAdminRole', () => {
  it('allows only the admin role', () => {
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole('student')).toBe(false)
  })
})

describe('isAdminUser', () => {
  let db: TestDb

  beforeEach(async () => {
    db = await makeTestDb()
  })

  it('rejects missing and student users', async () => {
    await db.insert(schema.users).values({
      id: 'student_1',
      email: 'student@example.com',
    })

    await expect(isAdminUser('missing', db)).resolves.toBe(false)
    await expect(isAdminUser('student_1', db)).resolves.toBe(false)
  })

  it('allows a user with the admin role', async () => {
    await db.insert(schema.users).values({
      id: 'admin_1',
      email: 'admin@example.com',
      role: 'admin',
    })

    await expect(isAdminUser('admin_1', db)).resolves.toBe(true)
  })
})
