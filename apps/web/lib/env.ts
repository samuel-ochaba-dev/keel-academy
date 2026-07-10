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
 * Billing (M5) adds the first client (`NEXT_PUBLIC_`) variables. All Paddle
 * vars are optional: when unset the app runs in "open mode" (no paywall), so
 * local dev and CI need no payment secrets. Set `SKIP_ENV_VALIDATION=1` to
 * bypass validation for tooling that runs without secrets.
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
    // Magic-link email. Optional: when unset (local dev) the sign-in link is
    // printed to the terminal; when set, the link is emailed via Resend.
    AUTH_RESEND_KEY: z.string().optional(),
    // From address for magic-link emails. Must be a Resend-verified domain in
    // production; ignored by the dev console fallback.
    EMAIL_FROM: z.string().default('Keelacademy <login@keelacademy.dev>'),
    // GitHub OAuth. Optional: set BOTH to enable the "Continue with GitHub"
    // sign-in option. Auth.js reads these by convention.
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),
    // Paddle server SDK. Optional: set BOTH to enable enrollment gating. The
    // API key backs the Node SDK; the webhook secret (pdl_ntfset_…) verifies
    // inbound signatures. When unset, entitlement checks run in open mode.
    PADDLE_API_KEY: z.string().optional(),
    PADDLE_WEBHOOK_SECRET: z.string().optional(),
  },
  client: {
    // Sandbox for testing, production for live. Drives both Paddle.js and the
    // server SDK environment. Defaults to sandbox so nothing goes live by mistake.
    NEXT_PUBLIC_PADDLE_ENV: z
      .enum(['sandbox', 'production'])
      .default('sandbox'),
    // Client-side token (safe to publish) that initializes Paddle.js checkout.
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().optional(),
    // The two purchasable Paddle price ids: monthly subscription and one-time
    // lifetime. Each checkout button hides itself when its price id is unset.
    NEXT_PUBLIC_PADDLE_PRICE_MONTHLY: z.string().optional(),
    NEXT_PUBLIC_PADDLE_PRICE_LIFETIME: z.string().optional(),
  },
  // Next.js inlines NEXT_PUBLIC_* at build; they must be destructured here so
  // the client bundle sees literal values rather than a runtime process.env read.
  experimental__runtimeEnv: {
    NEXT_PUBLIC_PADDLE_ENV: process.env.NEXT_PUBLIC_PADDLE_ENV,
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN:
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    NEXT_PUBLIC_PADDLE_PRICE_MONTHLY:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY,
    NEXT_PUBLIC_PADDLE_PRICE_LIFETIME:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_LIFETIME,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
