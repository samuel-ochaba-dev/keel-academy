import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/**
 * Typed, validated environment contract.
 *
 * Imported by `next.config.ts` so an invalid environment fails the BUILD, and by
 * app-runtime code (e.g. `lib/db/client`) so every read is typed instead of
 * `string | undefined`. When you add a variable, add it here AND to
 * `.env.example` — the schema is the source of truth, the example is the doc.
 *
 * There are no client (`NEXT_PUBLIC_`) variables yet; they arrive with billing
 * (M5). Set `SKIP_ENV_VALIDATION=1` to bypass validation for tooling that runs
 * without secrets.
 */
export const env = createEnv({
  server: {
    // Auth.js session/JWT encryption secret. Generate with `npx auth secret`.
    AUTH_SECRET: z.string().min(1),
    // Auth.js trusts the forwarded Host header when true (needed behind proxies).
    AUTH_TRUST_HOST: z.stringbool().optional(),
    // libSQL/Turso connection. Defaults to a local file so dev needs no secrets.
    TURSO_DATABASE_URL: z.string().min(1).default('file:local.db'),
    TURSO_AUTH_TOKEN: z.string().optional(),
  },
  client: {},
  // Server vars are read from process.env at runtime (Node); only client vars
  // need explicit destructuring here, and there are none yet.
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
