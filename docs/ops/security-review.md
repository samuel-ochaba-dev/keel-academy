# Security Review (M10 Baseline; M11 Verification Pending)

> Threat-model review of auth, API surface, webhooks, and the reference
> implementation gate. Each section lists the control, its status, and any
> residual risk.

## 0. Evidence boundary

This is a source-review baseline, not a production attestation. “Implemented”
means the control was observed in the checked-in code; provider configuration,
rate-limit behavior, and real callback delivery must be evidenced in staging.
M11 owns that validation and the fixes called out as release blockers below.

## 1. Authentication (Auth.js v5)

### Magic-link sign-in

- **Control:** Email-based magic link signed with `AUTH_SECRET`. Link expires
  after 24 h (default). Token is single-use.
- **Status:** ✅ Implemented in `lib/auth-actions.ts` (`signIn` server action).
- **Risk:** Email interception — mitigated by HTTPS and short expiry. No further
  action.
- **Risk:** Email bombing — the established rate-limit policy is the control,
  but it is not implemented in `proxy.ts`. M11 must record its provider/location,
  limits, and a staging `429` test before release.

### OAuth providers

- **GitHub** — callback `/api/auth/callback/github`. Scopes: `user:email`.
- **Google** — callback `/api/auth/callback/google`. Scopes: `email`, `profile`.
  `allowDangerousEmailAccountLinking` is enabled so a user who signs in with
  GitHub then Google (same email) gets one account, not two.

  > **Why this is safe:** both GitHub and Google verify the email before
  > issuing tokens. A malicious actor must control the email account to link.
  > If you add an unverified provider later (e.g., Twitter without email
  > verification), **disable** `allowDangerousEmailAccountLinking` first.

- **Status:** ✅ Both provider integrations are implemented; conditional rendering
  on the sign-in page shows a button only when its client ID/secret are set.
  Dashboard configuration is a staging/production validation item.
- **Risk:** OAuth CSRF — handled by Auth.js `state` param.

### Session management

- **Control:** Database-backed sessions (JWE token in cookie, session row in
  `sessions` table). Session expiry 30 d. Cleanup cron runs hourly via Inngest.
- **Status:** ✅ `session-cleanup-cron` Inngest function; `sessions` table has
  `expiresAt` index.
- **Risk:** Expiry and cleanup behavior must be exercised against the deployed
  database/session configuration in M13; do not treat a source review as proof
  of production session cleanup.

## 2. API Surface

### Coarse route protection (`proxy.ts`)

- **Control:** Coarse request-level protection — the proxy checks for the
  presence of an Auth.js session cookie and redirects anonymous users from
  `/dashboard`, `/billing`, and `/admin`. Business authorization belongs in
  server/domain code.
- **Status:** ✅ Source reviewed. `proxy.ts` does **not** rate-limit requests,
  validate a session against the database, or make an admin-role decision.
- **Release blocker:** its matcher includes `/account`, but the protected-prefix
  list does not; the proxy therefore does not redirect `/account`. M11 must
  reconcile that behavior and test the route's server-side authorization.
- **Release blocker:** `app/admin/events/page.tsx` currently reads audit events
  without an observed server-side role check. M11 must add and test role-based
  authorization before any staging/public release.

### Input validation

- **Control:** `POST /api/submissions` parses JSON as `unknown` and validates it
  with `submissionPayloadSchema` before the durable submission write. The Paddle
  route verifies the raw-body signature before it claims or fulfills an event.
- **Status:** ✅ Source reviewed at `app/api/submissions/route.ts` and
  `app/api/webhooks/paddle/route.ts`.
- **Risk:** This is not evidence that every API handler has been audited. M11
  must complete the per-route input/authorization review and adversarial tests.

### Server actions

- **Control:** All server actions (`completeChapterAction`, `signIn`,
  `signOut`) are behind `auth()` checks. No action accepts an unauthenticated
  caller.
- **Status:** ✅ Each action calls `auth()` and redirects on missing session.
- **Risk:** CSRF — Auth.js v5 server actions include built-in CSRF tokens.
  No extra action needed.

## 3. API Keys (CLI auth)

### Storage

- **Control:** API keys are **hashed** (SHA-256) before storage. The plaintext
  key is shown once at creation and never retrievable again.
- **Status:** ✅ `lib/api-keys/service.ts` hashes on create and compares on
  verify.
- **Risk:** Database leak — hashed keys are useless without the plaintext. ✅.

### Revocation

- **Control:** Revoke is immediate (row deleted). Next CLI submission with that
  key gets 401.
- **Status:** ✅ `DELETE /api/account/api-keys/:id` checks session user owns the
  key.
- **Risk:** Stolen key window — no rotation endpoint, but user can revoke +
  create a new one. Acceptable for a learning platform.

### Scope

- **Control:** API keys are **user-scoped** — they authenticate the CLI to
  submit test results and view references on behalf of that user. They cannot
  access other users' data or admin routes.
- **Status:** ✅ Every CLI API route extracts `userId` from the key and scopes
  queries by it.
- **Risk:** None identified.

## 4. Webhooks

### Paddle

- **Control:** Signature verification before processing. HMAC-SHA256 with
  `PADDLE_WEBHOOK_SECRET`. Idempotent via `paddle_events` table (dedup by
  event id).
- **Status:** ✅ `app/api/webhooks/paddle/route.ts` uses Paddle's
  `webhooks.unmarshal` against the raw payload, then claims the event in the
  local ledger before fulfillment. Processed event IDs return a duplicate result;
  failures remain retryable.
- **Risk:** M11 must select and test the single fulfillment owner (synchronous
  route versus Inngest), including duplicate delivery and retry behavior.

### Inngest

- **Control:** Inngest signing key verified on `/api/inngest` route. Only
  Inngest can trigger functions.
- **Status:** ✅ `inngestClient` configured with `INNGEST_SIGNING_KEY`.
- **Risk:** None identified.

## 5. Reference Implementation Gate

- **Control:** References unlock only when (a) user has course access AND
  (b) a passing CLI submission exists for that chapter. Page enforces both
  server-side; no client-side bypass possible.
- **Status:** ✅ `lib/references/service.ts` — `canViewReference` tested (11
  rules tests). Reference page redirects on missing access.
- **Risk:** Copy-paste leak — a user who unlocks a reference could paste it
  publicly. Acceptable: the content is educational, not payment-card data.
- **Risk:** Test forgery — CLI submissions are HMAC-signed with a per-install
  nonce; we verify the signature and the test count matches the reference
  suite. A user cannot submit "all passed" without running the actual tests.

## 6. Data Exposure

- **Secrets:** No secrets in client bundle. Only `NEXT_PUBLIC_*` vars are
  public (`NEXT_PUBLIC_PADDLE_ENV`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`,
  `NEXT_PUBLIC_PADDLE_PRICE_*`). All secrets (`AUTH_SECRET`, `PADDLE_API_KEY`,
  `TURSO_AUTH_TOKEN`, `INNGEST_SIGNING_KEY`, `SENTRY_DSN`) are server-only.
- **Error pages:** `error.tsx` and `global-error.tsx` show generic messages;
  the real error goes to Sentry, never to the DOM.
- **Admin:** `proxy.ts` only performs a session-cookie presence check. The
  observed `/admin/events` page has no server-side role check, so it is an M11
  release blocker rather than a completed control.
- **Strict TypeScript:** `any` is banned by ESLint. No `any` in production
  code.

## 7. Content Security Policy (Future)

- **Status:** ⚠️ Not yet implemented. CSP headers must be added before launch
  with an allowlist derived from the actual first-party, Auth.js, Paddle, and
  Sentry resources. This product does not use Stripe.
- **Action:** Add CSP in M11, start with staging report-only validation, then
  enforce after Paddle sandbox and observability flows are verified.

## 8. Summary

| Area                       | Status | Notes                                          |
| -------------------------- | ------ | ---------------------------------------------- |
| Auth (magic link + OAuth)  | ⚠️     | Code present; rate-limit/staging proof pending |
| API surface                | ⚠️     | Key routes reviewed; M11 audit remains         |
| API keys                   | ✅     | Hashed, revocable, user-scoped                 |
| Webhooks (Paddle, Inngest) | ⚠️     | Code present; fulfillment path must be chosen  |
| Reference gate             | ✅     | HMAC + test-count verification                 |
| Admin authorization        | ❌     | Server-side role check is an M11 blocker       |
| Secrets                    | ✅     | No secrets in client bundle                    |
| CSP                        | ⚠️     | Add before public launch                       |
