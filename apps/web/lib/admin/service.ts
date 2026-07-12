import { db as defaultDb } from '@/lib/db/client'
import { users, type UserRole } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type Db = typeof defaultDb

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin'
}

export async function isAdminUser(
  userId: string,
  database: Db = defaultDb,
): Promise<boolean> {
  const row = await database
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return row[0] ? isAdminRole(row[0].role) : false
}
