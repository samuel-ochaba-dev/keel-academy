# Keelacademy Implementation Plan

## Status

Active planning document. Update this file whenever the next build target changes.

## Purpose

This file is the build-order source of truth for Keelacademy.

It is not a design doc, ADR, RFC, or feature spec:

- `Design Doc.md` explains the system shape.
- `ADRs.md` records durable decisions.
- `NFRs.md` records quality bars.
- `RFCs.md` explores proposed mechanics.
- `Implementation Plan.md` says what to build next, in what order, and what "done" means.

## Source Rationale

This plan follows three credible planning ideas:

- [GitHub milestones](https://docs.github.com/issues/using-labels-and-milestones-to-track-work/about-milestones) and [GitLab milestones](https://docs.gitlab.com/user/project/milestones/) group work toward a goal; the plan document should define the milestone sequence, while issues can later track individual tasks.
- [Product requirements documents](https://www.atlassian.com/agile/product-management/requirements) define feature purpose and behavior; they should not become the only source of build order.
- A walking skeleton should come first: a tiny end-to-end path that proves the main architecture works before individual parts become deep. See [O'Reilly's "Start with a Walking Skeleton"](https://www.oreilly.com/library/view/97-things-every/9780596800611/ch60.html) and Thoughtworks' ["The First Story in Every Project"](https://www.thoughtworks.com/insights/blog/first-story-every-project).
- [Turborepo](https://turborepo.dev/docs) should sit on top of pnpm workspaces for repo-wide task orchestration and caching. Its docs describe `turbo.json` as the place to define tasks, dependencies, outputs, and cache behavior.

## How To Use This File

- Keep exactly one milestone marked `Current`.
- Do not start a later milestone until the current milestone's exit criteria are met, unless the later task is documentation-only or clearly unblocks the current milestone.
- Convert milestone tasks into issues only when the repo has enough implementation surface to make issue tracking useful.
- Keep tasks vertical when possible: a small user-visible path beats a large invisible subsystem.
- When a task changes architecture, update the relevant ADR or design doc in the same milestone.

## Current Focus

**Current Milestone:** M11 - Security and Payment Path

**Goal:** make the public request surface and money path deliberate, protected,
and testable before provider traffic reaches the application.

**Release-Lane Objective:** establish a repeatable path from green CI and
aligned docs through isolated staging, evidence-backed validation, staged
production promotion, rollback, and first-day monitoring.

**Next Actions:**

1. **PR 2 / M11:** resolve payment-fulfillment ownership, verify the existing
   rate-limit policy, enforce admin authorization, add CSP, and cover the
   security-critical paths with tests.
2. **PR 3 / M12:** create the persistent staging environment and the browser
   smoke/release-evidence harness; then execute M13-M16 in order.

**M9 Superseded:** its broad launch-hardening scope is now decomposed into the
seven executable milestones M10-M16 below. M9 remains as the historical
umbrella record.

CI reference: see `docs/ci-plan.md`.

## Milestone Overview

| Milestone | Name                          | Outcome                                                                    |
| --------- | ----------------------------- | -------------------------------------------------------------------------- |
| M0        | Walking Skeleton              | One tiny end-to-end product path works                                     |
| M1        | Repo Foundation               | Workspace, Turborepo tasks, UI tokens, and deployment shape are stable     |
| M2        | Content Pipeline              | MDX content compiles, validates, and renders                               |
| M3        | Reading Experience            | Chapter page, term panels, and reference pages feel usable                 |
| M4        | Auth and Progress             | Students can sign in and persist chapter state                             |
| M5        | Billing and Entitlements      | Paddle enrollment controls gated access                                    |
| M6        | CLI and Test Suite            | Students can run tests and submit signed results                           |
| M7        | Reference Unlock              | Passing submissions unlock reference artifacts                             |
| M8        | Observability and Operations  | Errors, events, webhooks, jobs, and audit trails are visible               |
| M9        | Launch Hardening (superseded) | Original umbrella; decomposed into the verified M10-M16 release lane       |
| M10       | Release Gate and Plan Truth   | CI, branch rules, launch scope, and operating docs are trustworthy         |
| M11       | Security and Payment Path     | Verified rate limits, CSP, and one tested fulfillment path protect traffic |
| M12       | Staging Foundation            | A stable, isolated staging environment and QA harness exist                |
| M13       | Integration Validation        | Auth, billing, jobs, database recovery, and CLI work in staging            |
| M14       | Experience and Ops Evidence   | Accessibility, CWV, mobile, and alerts have release evidence               |
| M15       | Staged Production Release     | A production-configured build is verified, promotable, and reversible      |
| M16       | Post-Launch Stabilization     | The first 24 hours are monitored, supported, and assessed                  |

---

## M0 - Walking Skeletons

**Status:** Done

**Goal:** create the smallest end-to-end version of Keelacademy that touches the real architectural seams.

**Build:**

- pnpm workspace with `apps/web`, `packages/ui`, `packages/content`, `packages/email`, `packages/test-suite`, `packages/cli`, and `packages/config` placeholders.
- Turborepo installed/configured at the repo root for task orchestration.
- Initial `turbo.json` with `dev`, `build`, `lint`, `check-types`, and placeholder `test` task definitions.
- Next.js 16 App Router app in `apps/web`.
- Shared config package for TypeScript, linting, formatting, and Tailwind conventions.
- Initial design tokens and font loading.
- Drizzle schema with the minimum tables needed for a user, session placeholder, and chapter progress.
- Turso/libSQL client wiring.
- One chapter route at `/chapters/[slug]`.
- One dashboard shell route.
- One content fixture with novel, build-along, lexicon, and DSA content.
- One progress mutation path that writes a chapter event.

**Exit Criteria:**

- The app renders a real chapter from local MDX content.
- The app can read from and write to the database.
- The workspace package boundaries exist and imports flow in the right direction.
- Root scripts route through Turbo instead of hand-running package scripts one by one.
- The dashboard shell can show a persisted progress state.
- The docs still match the created folder structure.

---

## M1 - Repo Foundation

**Status:** Done

**Goal:** make the repository stable enough for daily implementation.

**Build:**

- Root workspace manifests.
- Turborepo root configuration.
- root scripts that call `turbo run ...`.
- task dependency rules, including package builds before dependent app builds.
- cache outputs for Next.js and package build artifacts.
- `apps/web` configuration.
- shared `packages/config`.
- Tailwind CSS v4 and shadcn/ui setup.
- base app layout, error page, not-found page, loading conventions.
- path aliases and strict TypeScript configuration.
- environment variable schema.
- initial CI plan documented, even if not automated yet.

**Exit Criteria:**

- New files have an obvious home.
- Shared packages do not import from `apps/web`.
- Turbo can describe repo-wide task order and cacheable outputs.
- TypeScript strict mode is enabled.
- The design system tokens are the only color source used by initial components.

---

## M2 - Content Pipeline

**Status:** Done

**Goal:** make content as code reliable before building deeper learning flows.

**Build:**

- Velite content schemas. _(done — `packages/content/velite.config.ts`)_
- chapter metadata schema. _(done)_
- lexicon and DSA schemas (shared `term` slug group). _(done)_
- MDX components for `Term`, code blocks, callouts, and layer wrappers.
  _(done — `Term`, `Callout`, `DSAComplexity`; code blocks via rehype-pretty-code + Shiki;
  layers via `data-layer` wrappers)_
- build-time validation for duplicate slugs, missing metadata, broken term links, and missing chapter references.
  _(done — schema `strict: true` + `prepare` hook throws on unknown `lexicon[]`/`dsa[]`
  and unknown inline `<Term slug>`)_
- typed content lookup helpers in `packages/content`. _(done — extracted from `apps/web`
  into `@keelacademy/content`; app consumes `@keelacademy/content/collections`
  and `@keelacademy/content/lookup`)_
- one complete chapter fixture. _(done — Chapter 1 "The First Commit" + build-along,
  3 lexicon, 2 DSA)_

**Exit Criteria:**

- Broken content references fail validation. _(proven: an unknown `<Term>` slug or
  chapter `lexicon[]`/`dsa[]` ref fails `velite`, failing the build)_
- The chapter page can load typed content without database queries. _(met — pages read
  the Velite-generated collections; DB is touched only for progress)_
- Standalone lexicon and DSA pages render from the same source as inline panels. _(met —
  both the `/lexicon/[slug]` `/dsa/[slug]` pages and the in-chapter `Term` slide-over
  render the same `entry.body`)_

**Notes:** the M0 rebuild (2026-07-07) already delivered the Velite pipeline, validation,
`Term`, and standalone pages, so M2 satisfied its exit criteria at entry. The M2 work
proper was: extracting the pipeline into `@keelacademy/content` (honoring ADR-009, which
M0 had temporarily deferred), adding build-time Shiki highlighting, and adding the
`Callout` / `DSAComplexity` MDX components named in ADR-004.

---

## M3 - Reading Experience

**Status:** Done

**Goal:** make the core student reading loop feel real.

**Build:**

- chapter page layout. _(done — sidebar + novel measure + build-along, from M0/M2)_
- persistent progress/navigation shell. _(done — desktop sticky sidebar plus a
  new `ChapterTopbar`: a sticky course-progress bar under the header, with a
  `< lg` "Chapters" button that opens the sidebar as a native-`<dialog>` drawer)_
- inline term buttons. _(done — `Term` + `ConceptChips`, from M0/M2)_
- accessible slide-over panel on desktop. _(done — native `<dialog>` per RFC-001;
  M3 hardened it: `aria-labelledby`/`aria-describedby`, deliberate initial focus
  on the term title, guarded `showModal()`, and a global background scroll-lock
  so the reader never loses their place)_
- mobile full-screen panel behavior. _(done — panel becomes a bottom sheet, and
  the nav drawer slides from the left; both reuse the `@starting-style` pattern)_
- standalone lexicon and DSA pages. _(done — plus an "Introduced in Chapter N"
  backlink via the new `getChapterForTerm` helper, keeping the dual-access
  reference connected to the linear flow)_
- "Now build it" chapter transition. _(done — divider, subtitle, and a `< lg`
  "best experienced on a larger screen" notice above the build-along)_
- reading completion action. _(done — "Mark complete" server action, plus a
  next-chapter CTA in the completion footer)_

**Exit Criteria:**

- A student can read one chapter without losing context. _(met — sticky
  progress shell, next-chapter CTA, and body scroll-lock while a panel is open)_
- A term opens and closes without navigation or scroll loss. _(met — native
  `<dialog>` opens in the top layer without navigation; scroll-lock + focus
  return to the trigger preserve reading position)_
- Keyboard and screen reader basics work for the term panel. _(met — `showModal()`
  gives focus trap / Esc / focus return; M3 added the accessible name and
  deliberate heading focus. An adversarial review also caught two SR gaps, now
  fixed: `role="img"` on the sidebar status icons so completion state reaches the
  a11y tree, and `aria-haspopup="dialog"` on the concept chips to match `Term`)_
- The page respects the design system and content layer rules. _(met — OKLCH
  tokens only, `data-layer` typography, shadcn primitives incl. `Progress`)_

**Notes:** the mobile nav drawer deliberately reuses the native-`<dialog>`
approach RFC-001 chose for the term panel rather than introducing a Radix/shadcn
`Sheet`, keeping one overlay mechanism across the app. Background scroll-lock is
CSS-only (`body:has(dialog[open]) { overflow: hidden }` + `scrollbar-gutter:
stable`), since `showModal()` does not lock page scroll on its own.

---

## M4 - Auth and Progress

**Status:** Done

**Goal:** make student identity and progress durable.

**Build:**

- Auth.js v5 setup. _(done in the M0 rebuild; M4 hardened it)_
- magic link via Resend. _(done — the Nodemailer shell was replaced by the
  `next-auth/providers/resend` provider with a custom `sendVerificationRequest`:
  it prints the link to the terminal when no key is set, and emails a React
  Email template (`packages/email/magic-link-email`) via the `resend` SDK when
  `AUTH_RESEND_KEY` is present. `nodemailer` was dropped entirely.)_
- GitHub OAuth. _(done — a `GitHub` provider wired only when `AUTH_GITHUB_ID`/
  `AUTH_GITHUB_SECRET` are set, with `allowDangerousEmailAccountLinking` so a
  GitHub sign-in links to an existing magic-link account on a shared verified
  email. The sign-in page shows "Continue with GitHub" only when configured.)_
- Drizzle adapter tables. _(done — from M0)_
- database sessions. _(done — `session: { strategy: 'database' }`; `proxy.ts`
  only glances at the session cookie, so the DB is never touched at the edge —
  no `auth.config.ts` split needed)_
- `proxy.ts` for coarse protected-route handling. _(done — from M0; guards
  `/dashboard`)_
- progress state machine domain service. _(done — new pure
  `lib/progress/state-machine.ts` (`applyEvent`, `percentForStatus`), monotonic
  not_started → reading → complete. `service.ts` now reads the row, runs the
  machine, and writes the result + an audit row in one `db.transaction`,
  dropping the old inline SQL `case` guards.)_
- dashboard progress view. _(done — "Continue" now resumes the most recently
  visited in-progress chapter, by `lastVisitedAt`)_
- audit event on progress transitions. _(done — new append-only `progress_event`
  table; a row is written only when the status actually changes)_

**Exit Criteria:**

- A signed-in user can resume where they left off. _(met — DB sessions persist;
  the dashboard resumes the most recently visited chapter)_
- Progress state transitions are controlled by domain code. _(met — the pure
  state machine is the single source of truth, covered by vitest)_
- Anonymous and signed-in routes behave intentionally. _(met — `proxy.ts` gates
  `/dashboard`; chapter pages read anonymously and invite sign-in to save)_
- Progress rules are covered by domain tests. _(met — `state-machine.test.ts`
  covers every transition, the no-downgrade property, and idempotence, wired
  into `turbo run test` via a new `apps/web` vitest setup)_

**Notes:** `resend` and the email template are imported lazily inside
`sendVerificationRequest`, so a page that only calls `auth()` never pulls them
into its bundle. Verified end-to-end: magic-link sign-in over HTTP creates a DB
session, a first chapter visit writes `reading`/25% plus one `visit` audit row,
and a second visit (reading → reading) writes none.

---

## M5 - Billing and Entitlements

**Status:** Done

**Goal:** make paid access real and independent of checkout redirects.

**Build:**

- Paddle checkout flow.
- Paddle webhook route.
- signature verification.
- webhook event dedupe table.
- enrollment domain service.
- entitlement checks for build-along and references.
- billing page.
- payment success and failure states.

**Exit Criteria:**

- Access is determined from database enrollment state.
- Paddle webhook replay is idempotent.
- A failed payment does not grant access.
- A valid enrollment unlocks the intended gated surface.

**Notes:** all M5 code is present and wired into chapter, DSA, lexicon, and
dashboard pages, but the paywall is dormant until Paddle secrets
(`PADDLE_API_KEY` + `PADDLE_WEBHOOK_SECRET`) are set — without them
`isBillingConfigured()` returns `false` and entitlement checks fall back to open
mode (all content accessible, no lock badges, no paywall). To visually verify
the gating UI locally without a Paddle account, set `BILLING_FORCE_ENABLED=true`
in `.env.local`: this makes `isBillingConfigured()` return `true` so the lock
badges, `ContentPaywall`, billing plan cards, and dashboard upsell all render.
Checkout buttons stay disabled (no `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` to
initialize Paddle.js) and the webhook route still 503s — only real Paddle sandbox
credentials complete the end-to-end flow. Never set this flag in production.

---

## M6 - CLI and Test Suite

**Status:** Done

**Goal:** let students prove local build completion without Keelacademy running their code.

**Build:**

- `packages/test-suite` structure.
- one chapter test suite.
- `packages/cli` with `auth`, `test`, `submit`, and `status` commands.
- API key creation and revocation.
- hashed API key storage.
- signed submission payload schema.
- `POST /api/submissions`.
- submission validation domain service.

**Exit Criteria:**

- CLI can generate a signed submission payload.
- Server rejects invalid signatures, stale timestamps, and wrong test-suite versions.
- Passing submission records a durable test result.
- Failed submission gives useful feedback.

---

## M7 - Reference Unlock

**Status:** Done

**Goal:** make the "tests pass -> compare with reference" loop complete.

**Build:**

- private reference artifact storage. _(not needed — see ADR-011: rendered MDX source)_
- reference artifact manifest. _(not needed — Velite `references` schema is the manifest)_
- signed reference download or rendered source route. _(done — `/references/[slug]` rendered-source route)_
- entitlement and progress checks. _(done — `canAccessReference` checks course access + passing submission)_
- reference viewed audit event. _(done — `recordReferenceView` writes `auditEvents` row)_
- `unlocked -> complete` transition. _(done — `recordReferenceView` calls `markChapterComplete` idempotently)_
- dashboard reference access. _(done — per-chapter "Reference" button or locked placeholder)_

**Exit Criteria:**

- A student cannot access references before tests pass. _(met — `canAccessReference` requires both `hasCourseAccess` and `hasPassingSubmission`)_
- A passing submission unlocks the correct chapter reference. _(met — `getPassingChapterSlugs` filters by `status = 'passed'`)_
- Reference access is logged. _(met — `recordReferenceView` writes an audit event)_
- Repeated access is idempotent and does not corrupt progress. _(met — `markChapterComplete` is idempotent; audit events are append-only)_

**Notes:** ADR-011 records the decision to render references as inline MDX
source rather than downloadable artifacts. Pure unlock rules are extracted into
`lib/references/rules.ts` (`canViewReference`) and tested independently in
`rules.test.ts` (11 tests). The chapter page shows a reference unlock/locked
footer below the build-along section; the dashboard shows a per-chapter
reference badge. Content for references lives in
`packages/content/content/references/` (one MDX file per chapter).

---

## M8 - Observability and Operations

**Status:** Done

**Goal:** make production behavior inspectable before launch pressure arrives.

**Build:**

- Sentry setup. _(done — `next.config.ts`, `instrumentation.ts`, `global-error.tsx`, `error.tsx`)_
- Vercel Analytics. _(done — `Analytics` in `layout.tsx`)_
- structured event logging service. _(done — `lib/events/service.ts` + `types.ts`)_
- API mutation logs with sensitive-field masking. _(done — `lib/audit/api-audit.ts`)_
- Inngest workflows. _(done — `progress-emails`, `session-cleanup-cron`, and
  `content-revalidation`; payment fulfillment is owned by the signed Paddle
  webhook route)_
- operational admin dashboard. _(done — `/admin/events` with server-side fetch + client table)_
- `/admin` proxy guard. _(done — added to `proxy.ts` protected prefixes + matcher)_
- alert thresholds documented. _(done — `docs/ops/alerting.md`)_

**Exit Criteria:**

- Failed webhooks can be diagnosed. ✅
- Failed background jobs can be retried. ✅ (Inngest auto-retry)
- Sensitive values are not logged raw. ✅ (`maskSensitiveHeaders` in `api-audit.ts`)
- A founder can answer what happened to a payment, submission, or reference unlock. ✅ (`/admin/events`)

---

## M9 - Launch Hardening

**Status:** Superseded by M10-M16

**Goal:** prepare the first public release.

**Migration:** M9's exit criteria remain the release outcome, but its work is
now sequenced through M10-M16 so that a green local build, a staging pass, and a
production promotion cannot be confused with one another.

**Build:**

- accessibility pass for chapter page, dashboard, term panel, billing, and CLI-token UI. _(checklist — `docs/ops/launch-checklist.md` §6)_
- Core Web Vitals pass. _(checklist — §7)_
- mobile reading pass. _(checklist — §8)_
- security review for auth, API keys, webhooks, and references. _(checklist — §9)_
- Google OAuth as a second social sign-in provider. _(done — `Google` provider in
  `auth.ts`, `signInWithGoogle` action, `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
  in `env.ts` + `.env.example`, multi-provider button on sign-in page)_
- backup and restore notes. _(checklist — §10)_
- seed/demo data strategy. _(checklist — §11)_
- first end-to-end happy path. _(checklist — §12)_
- launch checklist. _(done — `docs/ops/launch-checklist.md`: 14 sections)_

**Exit Criteria:**

- One complete student path works: enroll, read, build, submit, unlock reference, resume dashboard.
- Critical docs match implementation.
- No known P0/P1 launch blockers remain.
- Rollback and support paths are documented.

**Notes:** Google is the recommended second social provider for a developer
audience — the best-practice pairing is GitHub + Google, which with the existing
magic-link fallback stays inside the "2–3 providers max" guideline (more than
that causes decision paralysis and "which one did I use?" confusion). It is
deliberately deferred to launch rather than added in M4 for two reasons: (1)
GitHub + magic link already cover the pre-launch audience, and Google's
incremental value over passwordless magic link is modest; (2) a clean Google
consent screen requires Google **brand verification** — a privacy policy hosted
on the launch domain, a public homepage, Search Console domain ownership, and a
~2–3 day review — otherwise users hit the "unverified app" warning and a
100-new-user cap. Google Sign-In uses only non-sensitive scopes, so no CASA
security audit applies. Implementation is ~10 lines mirroring the M4 GitHub
provider (`Google({ allowDangerousEmailAccountLinking: true })` +
`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` + a button gated on those vars); the
sign-in page is already structured for it. Apple Sign-In is out of scope — App
Store Guideline 4.8 only requires it for a native iOS app, not this web app.

---

## M10 - Release Gate and Plan Truth

**Status:** Done

**Covers:** release-lane point 1 of 7 - make the release gate trustworthy.

**Goal:** make `main`, the launch plan, and the operational instructions safe
to trust before any external staging work begins.

**Build:**

- make the launch scope explicit: a closed one-chapter alpha, or a public
  16-chapter release; keep the chosen scope in the launch checklist;
- repair root `pnpm check-types`, including the NodeNext test-suite import;
- give CI's type-check step the same safe validation contract as its build step;
- add `pnpm test` to CI and make the single `verify` job—which runs `lint`,
  `check-types`, `test`, and `build`—a strict required check for `main`;
- protect `main` with pull-request and required-status-check rules;
- reconcile docs with code: document the Paddle route as
  `POST /api/webhooks/paddle`, document the intentional absence of a generic
  `db:seed` command, and replace stale Turso backup/restore commands;
- update the launch and security checklists so every claim points to a real
  route, script, owner, or external control.

**Exit Criteria:**

- `pnpm lint`, `pnpm check-types`, `pnpm test`, and `pnpm build` pass locally
  and in GitHub Actions.
- A red CI run cannot merge into `main`.
- The chosen launch scope and the operational docs match the actual product.
- There is no known route, command, backup, or webhook-path discrepancy in the
  launch documentation.

**Notes:** this is immediate PR 1. Do not use `SKIP_ENV_VALIDATION` to make CI
green; CI should prove the environment contract with harmless throwaway values.

**Completion (2026-07-12):** the selected launch scope is a closed
one-chapter alpha, matching the single published Chapter 1 content fixture.
The workflow runs all four root commands with job-scoped throwaway environment
values; the NodeNext import is corrected; and the launch, CI, security,
QA-data, and recovery docs have been reconciled. `pnpm lint`,
`pnpm check-types`, `pnpm test`, and `pnpm build` passed locally. GitHub
recorded green `CI / verify` runs on `main`, and the active `main` ruleset
requires pull requests plus the strict `verify` status check with no bypass
actors.

---

## M11 - Security and Payment Path

**Status:** Current

**Covers:** release-lane point 2 of 7 - reconcile code, docs, and security
design before staging.

**Goal:** make the public request surface and money path deliberate, protected,
and testable before provider traffic reaches the application.

**Build:**

- decide whether Paddle fulfillment is synchronous in the webhook route or
  asynchronous through Inngest; retain one owner and remove or wire the other
  path so an event grants access exactly once;
- verify and test the established rate-limit policy for auth and high-risk API
  routes, including explicit keys, limits, error responses, and provider
  visibility;
- enforce and test server-side admin role authorization; `proxy.ts` remains a
  coarse cookie-presence gate, so reconcile its `/account` matcher behavior and
  prevent non-admin sessions from reading `/admin/events`;
- add a production CSP that permits only the required first-party, Auth.js,
  Paddle, and Sentry resources; validate it in staging before enforcement;
- verify webhook signature checks, duplicate delivery handling, API-key
  ownership, reference gates, and error handling under adversarial tests;
- ensure production cannot run in open billing mode or with
  `BILLING_FORCE_ENABLED` enabled;
- correct the security review so it reports implemented controls separately
  from planned controls.

**Exit Criteria:**

- A chosen payment event results in one durable entitlement transition, even on
  replay or failure/retry.
- Rate-limited client routes return the intended response while verified vendor
  webhooks remain deliverable.
- A non-admin session cannot read an admin page or audit-event data, even when
  it has a valid session cookie.
- CSP produces no unexplained violations in staging and is enforced before M15.
- Security claims in docs are backed by tests or an observable provider control.

**Notes:** this is immediate PR 2. It must finish before staging credentials or
real sandbox payments are configured.

**Local progress (2026-07-12):** the first M11 implementation pass selects the
signed Paddle webhook route as the single payment-fulfillment owner, removes the
stale Inngest payment workflow from registration, adds `user.role` with a
default `student` role, protects `/account` in the shared protected-route
helper, blocks non-admin sessions from `/admin/events`, adds enforced security
headers including CSP, and fails production builds that would run in open
billing mode or with `BILLING_FORCE_ENABLED`. Rate-limit provider evidence and
deployed staging CSP/payment validation remain pending.

---

## M12 - Staging Foundation

**Status:** Planned

**Covers:** release-lane point 3 of 7 - create a persistent, isolated staging
environment. This also contains the setup portion of immediate PR 3.

**Goal:** create a stable environment where a release candidate can be safely
exercised against real provider integrations.

**Build:**

- create a persistent `staging` branch and stable staging domain, or an
  equivalent Vercel Custom Environment;
- link the Vercel project and define a development, preview/staging, and
  production environment-variable matrix;
- provision isolated staging resources: Turso database, Paddle sandbox,
  OAuth apps/callbacks, Resend sender/inbox, Inngest keys, Sentry environment,
  and Upstash Redis;
- ensure no preview or staging deployment can write to production data or use
  production provider secrets;
- decide and document how protected staging deployments admit Paddle and
  Inngest callbacks without making the rest of staging public;
- add a non-secret health/readiness smoke endpoint;
- create the browser-smoke harness and a release-evidence template, ready for
  execution once the integration paths are live.

**Exit Criteria:**

- A known commit deploys to a stable staging URL with the correct non-production
  resource identities.
- The health/readiness endpoint, build logs, and error logs can be inspected by
  the release owner.
- Staging callback URLs are reachable by the required providers.
- The QA account, browser-smoke harness, and release-evidence record exist.

**Notes:** this is immediate PR 3 plus provider/dashboard configuration. The
browser harness may be built here, but its acceptance run belongs to M14.

---

## M13 - Staging Integration Validation

**Status:** Planned

**Covers:** release-lane point 4 of 7 - prove each external integration in
staging.

**Goal:** prove the complete student path against isolated, real provider
integrations rather than local mocks or open billing mode.

**Build:**

- test magic-link delivery, sign-out, session persistence, and GitHub/Google
  OAuth callbacks with the staging domain;
- run Paddle sandbox checkout and webhook simulations for success, duplicate
  delivery, failed renewal, cancellation, and past-due flows;
- verify the resulting enrollment, audit event, paywall, and reference-access
  behavior for each relevant billing outcome;
- validate Inngest discovery at `/api/inngest`, safe runs of every function,
  retry behavior, and failure visibility;
- run migrations against the staging Turso database and complete one restore to
  a disposable database using the documented current procedure;
- execute the CLI test, signed submission, reference unlock, and dashboard
  resume loop using a controlled QA user.

**Exit Criteria:**

- One staging user completes sign-in, enrollment, reading, submission,
  reference unlock, and dashboard resume without manual database repair.
- Provider event IDs, logs, audit rows, and screenshots are attached to the
  release-evidence record.
- Restore, retry, cancellation, and duplicate-delivery behavior are proven and
  documented.

---

## M14 - Experience and Operations Evidence

**Status:** Planned

**Covers:** release-lane point 5 of 7 - establish browser, accessibility,
performance, and operational proof.

**Goal:** demonstrate that the release candidate is usable, accessible,
performant, and observable in the deployed environment.

**Build:**

- run the browser-smoke suite for the signed-out, signed-in, paywalled, and
  fully entitled student paths;
- complete keyboard-only and screen-reader passes for home, sign-in, dashboard,
  chapter reader, term dialog, billing, and CLI-token UI;
- complete mobile reading checks at 375px and on a real touch device;
- capture synthetic Core Web Vitals and Lighthouse results for the chapter,
  dashboard, and sign-in flows; resolve regressions against M9 targets;
- verify color contrast, reduced motion, focus visibility, skip links, form
  error announcements, and no-focus-trap behavior;
- configure Sentry alerts and verify a controlled staging error, Vercel logs,
  Inngest failures, and Paddle delivery failures reach an owner;
- complete the launch checklist with deployment URLs, test dates, owners, and
  evidence links rather than unchecked assertions.

**Exit Criteria:**

- All browser smoke tests pass on the staging release candidate.
- WCAG 2.1 AA and mobile findings have no unresolved P0/P1 issue.
- LCP, INP, and CLS meet the documented target on the representative staging
  pages, with results recorded.
- Monitoring and alert delivery are demonstrated end to end.

---

## M15 - Staged Production Release

**Status:** Planned

**Covers:** release-lane point 6 of 7 - verify production configuration before
assigning the public domain, then promote safely.

**Goal:** validate the production configuration before assigning the public
domain, then promote a known-good build with a tested rollback path.

**Build:**

- audit production environment variables, provider credentials, callback URLs,
  database schema, and `BILLING_FORCE_ENABLED` absence;
- create a staged production deployment without auto-assigning the production
  domain;
- smoke-test that deployment with production configuration, controlled QA
  accounts, and the approved payment/support procedure;
- inspect build, runtime, Sentry, Paddle, and Inngest logs before promotion;
- record the prior production deployment and execute a rollback rehearsal;
- manually promote only the validated staged production deployment and publish
  support/rollback ownership.

**Exit Criteria:**

- A production-configured deployment passes the defined smoke checks before it
  receives public traffic.
- No known P0/P1 launch blocker remains.
- The previous production deployment can be restored without a rebuild.
- Support, rollback, and escalation paths are documented and assigned.

---

## M16 - Post-Launch Stabilization

**Status:** Planned

**Covers:** release-lane point 7 of 7 - monitor and support the first 24 hours.

**Goal:** treat the first 24 hours as a monitored release phase, not the end of
validation.

**Build:**

- review production sign-ins, checkout attempts, webhook deliveries, entitlement
  changes, reference unlocks, Inngest runs, and error rates at 5 minutes,
  1 hour, and 24 hours;
- respond to alerts using the documented support and rollback paths;
- verify that real traffic meets the performance and accessibility expectations
  established in M14;
- record incidents, support requests, provider anomalies, and follow-up owners;
- publish a launch assessment: continue, pause sales, or roll back.

**Exit Criteria:**

- The first 24-hour monitoring window is complete with no unresolved P0/P1
  incident.
- The founder can account for payments, background jobs, errors, and support
  requests from the recorded evidence.
- Any remaining issue is prioritized into the backlog with an owner and target.

---

## Backlog

- Search across lexicon and DSA entries.
- Admin content preview.
- Public sample chapter.
- Email preference controls.
- Progress digest emails.
- GitHub App validation as a possible v2 alternative to CLI submissions.
- Cohort features.
- Team/organization accounts.

## Deferred

- Native mobile apps.
- Real-time collaboration.
- In-browser code execution.
- AI tutoring.
- Enterprise SSO.

## Open Questions

1. Should M0 include real Auth.js setup, or should it use a temporary local user and move Auth.js to M4?
2. ~~Should reference implementations be downloadable, rendered in-browser, or both?~~ _(resolved — ADR-011: rendered source only)_
3. Should the first paid product be one-time purchase or subscription?
4. Should `packages/database` exist immediately, or should database code stay inside `apps/web` until reuse is real?
5. Should content search use static manifests first or database-backed indexing later?
