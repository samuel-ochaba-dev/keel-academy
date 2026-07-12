# Launch Checklist (M9 — Launch Hardening)

> Pre-flight checklist for going live. Each item is a gate — do not deploy to
> production until every box is checked.

## 1. Environment & Secrets

- [ ] All **required** env vars set in the Vercel project (see `.env.example`):
  - `AUTH_SECRET` — generated via `npx auth secret` (not a placeholder string).
  - `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` — production Turso database.
  - `AUTH_TRUST_HOST=true` — needed behind Vercel's proxy.
- [ ] All **production** billing vars set:
  - `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` (production Paddle account).
  - `NEXT_PUBLIC_PADDLE_ENV=production`.
  - `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (production token).
  - `NEXT_PUBLIC_PADDLE_PRICE_MONTHLY`, `NEXT_PUBLIC_PADDLE_PRICE_LIFETIME`.
- [ ] `BILLING_FORCE_ENABLED` is **not** set in production.
- [ ] Email: `AUTH_RESEND_KEY` set, `EMAIL_FROM` uses a Resend-verified domain.
- [ ] Observability: `SENTRY_DSN` set for production environment.
- [ ] Background jobs: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` set.
- [ ] OAuth providers configured:
  - GitHub OAuth app callback: `https://<prod-domain>/api/auth/callback/github`.
  - Google OAuth consent screen: **brand verification complete**, redirect URI
    `https://<prod-domain>/api/auth/callback/google`, scopes `email` + `profile`.
- [ ] `SKIP_ENV_VALIDATION` is **not** set (env validation must run at build).

## 2. Database

- [ ] `pnpm db:push` run against the **production** Turso database.
- [ ] Schema matches `apps/web/lib/db/schema.ts` (no drift).
- [ ] Backups configured in Turso (automated daily snapshots enabled).
- [ ] Restore procedure documented and tested at least once (see §8 below).

## 3. Authentication & Sessions

- [ ] Magic-link sign-in works end-to-end (email arrives, link logs user in).
- [ ] GitHub OAuth sign-in works (if enabled).
- [ ] Google OAuth sign-in works (if enabled; no "unverified app" warning).
- [ ] Session cleanup cron running (Inngest `session-cleanup-cron` function).
- [ ] Sign-out works and redirects to `/`.
- [ ] Protected routes redirect to `/sign-in?next=…` when unauthenticated.

## 4. Billing & Entitlement

- [ ] Paddle webhook endpoint reachable: `https://<prod-domain>/api/paddle/webhook`.
- [ ] Webhook signature verification passes (no 401s on real events).
- [ ] Checkout flow works for both monthly and lifetime price ids.
- [ ] Entitlement check respects `enrolled` flag (locked chapters show paywall).
- [ ] Open mode is NOT active in production (no `BILLING_FORCE_ENABLED`).
- [ ] Refund / cancellation flow demotes entitlement (via Paddle webhook).

## 5. Content Pipeline

- [ ] `pnpm build` completes with no Velite validation errors.
- [ ] All 16 chapters published (status: `published` in frontmatter).
- [ ] Cross-references resolve (no broken `Term` / `Callout` references).
- [ ] MDX renders correctly (code highlighting, custom components).
- [ ] Content revalidation Inngest function wired and triggering on deploy.

## 6. Accessibility (WCAG 2.1 AA target)

- [ ] Keyboard-only navigation tested (tab order, focus visible, no traps).
- [ ] Screen reader pass on: home, sign-in, dashboard, chapter reader, billing.
- [ ] All interactive elements have accessible names (buttons, links, inputs).
- [ ] Color contrast ≥ 4.5:1 for text, ≥ 3:1 for large text and UI components.
- [ ] `prefers-reduced-motion` respected (no essential motion without consent).
- [ ] Skip-to-content link present on chapter and dashboard pages.
- [ ] Form errors are announced (aria-live / role="alert").

## 7. Performance (Core Web Vitals)

- [ ] LCP < 2.5s on the chapter reading page (primary landing / LCP target).
- [ ] INP < 200ms on interactive pages (dashboard, sign-in, term panel).
- [ ] CLS < 0.1 on all pages (no layout shift from fonts, images, or embeds).
- [ ] Fonts: `next/font` with `display: swap` (no FOUT causing shift).
- [ ] Images: `next/image` with explicit width/height (no CLS from images).
- [ ] No client-side data fetching on RSC pages (server fetch only).
- [ ] `'use client'` boundary minimal (only where interactivity is required).
- [ ] Paddle.js loaded only on pages with checkout buttons (not globally).

## 8. Mobile Reading

- [ ] Chapter prose readable at 375px width (no horizontal scroll).
- [ ] Sidebar collapses to drawer / hidden on mobile (chapter page).
- [ ] Reading progress bar visible and not overlapping content on mobile.
- [ ] Term panel opens as bottom sheet or full-screen on mobile.
- [ ] Touch targets ≥ 44px (buttons, links, sidebar items).
- [ ] Pinch-zoom NOT disabled (`user-scalable` not set to `no`).

## 9. Security Review

- [ ] `proxy.ts` rate limits applied to auth and API routes.
- [ ] API route handlers validate input (no untrusted data to DB queries).
- [ ] Webhook signatures verified (Paddle, Inngest) before processing.
- [ ] No secrets in client bundle (only `NEXT_PUBLIC_*` vars are public).
- [ ] `AUTH_SECRET` is not committed (in `.env.local` / Vercel only).
- [ ] CSRF: server actions and form submissions protected (Auth.js handles).
- [ ] Content Security Policy headers set (if using `next.config.ts` headers).
- [ ] `allowDangerousEmailAccountLinking` is safe (both providers verify email).
- [ ] No `any` types in production code (strict TypeScript enforced).

## 10. Backup & Restore

- [ ] Turso automated backups enabled (daily snapshots, 30-day retention).
- [ ] Restore tested: `turso db shell <db> < backup.sql` or Turso restore UI.
- [ ] Document RPO (recovery point objective) and RTO (recovery time objective).
- [ ] Content (MDX) is in git — no separate backup needed (git is the source).
- [ ] User-generated data (progress, CLI tokens, enrollments) is in Turso —
      back up via Turso snapshots. Test restore into a staging database.

## 11. Seed / Demo Data

- [ ] No seed data in production database (use `pnpm db:seed` only in staging).
- [ ] Demo student account created for QA (magic-link email, not OAuth).
- [ ] Demo enrolled student for billing flow testing (entitlement active).
- [ ] Admin account protected (no public admin route without server-side guard).

## 12. End-to-End Happy Path

- [ ] Sign in → land on dashboard → see chapters.
- [ ] Click chapter → read → progress bar updates → mark complete.
- [ ] Open term panel → definition shows → close panel.
- [ ] Unenrolled chapter → see paywall → checkout → entitlement granted.
- [ ] Dashboard shows enrollment status after checkout.
- [ ] Sign out → sign back in → session persists (database sessions).

## 13. CI/CD

- [ ] `pnpm lint` passes (eslint + tsc --noEmit).
- [ ] `pnpm build` passes (production build, no warnings).
- [ ] Vercel preview deployment created and smoke-tested.
- [ ] Vercel production deployment promoted from a passing preview.
- [ ] Inngest functions deployed and synced (Inngest dashboard shows all functions).

## 14. Post-Launch Monitoring

- [ ] Sentry alerts configured (error rate, new issues).
- [ ] Uptime monitor configured (e.g., Vercel, UptimeRobot, or Better Uptime).
- [ ] Paddle webhook delivery monitored (failed deliveries retried).
- [ ] Inngest function failures monitored (dead-letter queue or alerting).
- [ ] First 24h: manual check of error logs, user sign-ins, and checkout flow.
