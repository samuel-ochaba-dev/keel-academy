import { Environment, Paddle } from '@paddle/paddle-node-sdk'
import { env } from '@/lib/env'

// Billing is "configured" — and the paywall therefore enforced — only when the
// server can both verify inbound webhooks and talk to Paddle, i.e. real
// enrollments can be created. Without these, no enrollment row could ever
// exist, so entitlement checks fall back to OPEN MODE (see
// lib/entitlements/service.ts) instead of locking everyone out. This mirrors
// the optional-integration pattern used for GitHub OAuth in auth.ts: absent
// secrets degrade a feature gracefully rather than breaking the app.
export function isBillingConfigured(): boolean {
  if (env.BILLING_FORCE_ENABLED) return true
  return Boolean(env.PADDLE_API_KEY && env.PADDLE_WEBHOOK_SECRET)
}

let cached: Paddle | null = null

// Server-side Paddle SDK singleton. Only valid when billing is configured;
// callers guard with isBillingConfigured() first. The environment follows
// NEXT_PUBLIC_PADDLE_ENV so sandbox/production stay in sync across the client
// checkout and the server that verifies its webhooks.
export function getPaddle(): Paddle {
  if (!env.PADDLE_API_KEY) {
    throw new Error('Paddle is not configured (missing PADDLE_API_KEY)')
  }
  cached ??= new Paddle(env.PADDLE_API_KEY, {
    environment:
      env.NEXT_PUBLIC_PADDLE_ENV === 'production'
        ? Environment.production
        : Environment.sandbox,
  })
  return cached
}
