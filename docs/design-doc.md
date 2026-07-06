# Keelacademy Design Doc

## Status

Draft

## Authors

Samuel Ochaba

## Date

2026-07-05

## Source Review

This version was rewritten after a production architecture pass over `dubinc/dub` at commit `46906b88748312d9183c47e31f1a3eacd7a1fd7d`, plus current primary docs for Next.js App Router, Turso embedded replicas, Drizzle, Auth.js, Paddle webhooks, and Inngest.

Dub is the standard for production discipline, not the template to copy. Keelacademy keeps its own domain, stack constraints, and operating model.

---

## 1. Overview

Keelacademy is an online school for software engineers. Students build one serious system across 16 chapters while moving through four interlocking layers per chapter:

- Novel
- Build-Along
- Engineering Lexicon
- Emerging DSA

The product is not a course library. It is one guided engineering apprenticeship delivered as a reading-first web application, a test-suite package, a student CLI, gated reference implementations, and operational workflows for progress, payments, email, and support.

This document defines the web platform and adjacent packages students interact with: content delivery, progress tracking, test validation, inline reference lookup, billing, auth, observability, and deployment.

---

## 2. Production Standard Borrowed From Dub

Dub's strongest lesson is not "use the same vendors." It is that production-grade small-team software has explicit boundaries everywhere:

- Product domains are first-class folders, not scattered helpers.
- Route handlers stay thin; auth, rate limits, errors, logging, and permissions live in wrappers.
- Runtime input/output contracts are typed with schemas and reused for docs, validation, and tests.
- Background side effects are evented and retried rather than hidden inside request handlers.
- Billing, entitlements, quotas, and permissions are modeled as product primitives.
- Observability is not bolted on later; request logs, error events, webhook logs, and background job traces are part of the architecture.
- Tests are organized by user capability, not only by technical unit.
- Shared surfaces such as UI, email, CLI, content tooling, and utilities live in packages.

Keelacademy should adopt those standards while making different stack choices where the domain requires it:

| Concern | Dub Pattern | Keelacademy Decision |
| --- | --- | --- |
| Repo shape | Turborepo with app plus internal packages | pnpm workspace from day one: web, UI, content, email, CLI, test-suite, config |
| Framework | Next.js App Router on Vercel | Next.js 16 App Router on Vercel |
| Data access | Prisma + PlanetScale | Drizzle + Turso/libSQL |
| Analytics | High-volume click analytics via Tinybird | Product analytics + learning events; start simple, preserve event contracts |
| Payments | Stripe | Paddle because Merchant of Record matters for a Nigerian founder |
| Jobs | QStash/Upstash Workflow | Inngest for event-driven orchestration and solo-dev observability |
| API discipline | Zod schemas, OpenAPI, wrappers | Same discipline with Drizzle/Auth.js/Paddle-specific implementations |

---

## 3. Goals

- Deliver a seamless one-page chapter experience where the four layers are accessed in context.
- Keep reading pages fast, quiet, and mostly server-rendered.
- Track self-paced progress through 16 chapters with explicit state transitions.
- Validate build completion through local tests and signed CLI submissions.
- Gate reference implementations by entitlement and chapter progress.
- Support global payments through Paddle with minimal tax and compliance burden.
- Scale to 10,000 concurrent readers without changing the architecture.
- Keep the system maintainable by one founder without weakening production standards.

---

## 4. Non-Goals

- Real-time collaboration.
- Video hosting or streaming.
- Running student code on Keelacademy infrastructure.
- Native mobile applications.
- Forums, chat, comments, or social features.
- AI tutoring at launch.
- Enterprise SSO, teams, or organization management at launch.

---

## 5. System Architecture

### 5.1 High-Level Architecture

```plain
Student Browser
  |
  | HTTPS
  v
Vercel
  |
  |-- Next.js 16 App Router
  |     |-- Server Components for reading and dashboard pages
  |     |-- Client islands for term panels, progress controls, checkout, CLI token UI
  |
  |-- proxy.ts
  |     |-- auth redirects
  |     |-- entitlement-aware route protection
  |     |-- lightweight geo/header logic only
  |
  |-- Route Handlers in apps/web/src/app/api
        |-- Paddle webhooks
        |-- CLI submissions
        |-- signed reference downloads
        |-- public content metadata

Core Services
  |
  |-- Turso/libSQL + Drizzle
  |     |-- users, sessions, enrollments, progress, submissions, audit events
  |
  |-- Upstash Redis
  |     |-- rate limits, token/session cache, short-lived idempotency keys
  |
  |-- Inngest
  |     |-- payment fulfillment
  |     |-- progress events
  |     |-- email workflows
  |     |-- cleanup and revalidation jobs
  |
  |-- Paddle
  |     |-- checkout, tax, fraud, receipts, subscription events
  |
  |-- Resend
  |     |-- magic links, receipts, progress emails
  |
  |-- Vercel Blob or R2
        |-- gated reference implementation artifacts
```

### 5.2 Tech Stack

| Layer | Technology | Rationale |
| --- | --- | --- |
| Framework | Next.js 16 App Router | Server Components for content, route handlers for external APIs, `proxy.ts` for request interception |
| Language | TypeScript strict | Shared contracts across web, CLI, content, and tests |
| Workspace | pnpm workspaces | Required for web app, CLI, test suite, content tooling, email, shared UI |
| Database | Turso/libSQL | SQLite ergonomics with managed replicas for read-heavy learning pages |
| ORM | Drizzle | SQL-first, lightweight, serverless-friendly |
| Auth | Auth.js v5 | Magic link + GitHub OAuth, database sessions, Drizzle adapter |
| Cache | Upstash Redis | Rate limits, session/token cache, idempotency windows |
| Payments | Paddle Billing | Merchant of Record, checkout, tax handling, webhooks |
| Jobs | Inngest | Event-driven workflows with retries, step history, and cron |
| Content | MDX + Velite | Content as code with typed content manifests and build-time validation |
| UI | Tailwind CSS v4 + shadcn/ui | Token-driven, accessible primitives, no custom component reinvention |
| Email | Resend + React Email | Versioned transactional templates in the repo |
| Storage | Vercel Blob or Cloudflare R2 | Private reference artifacts served through signed access |
| Observability | Sentry + Vercel Analytics + structured app events | Errors, Web Vitals, job failures, learning funnel visibility |
| Deployment | Vercel | Preview deployments, managed Next.js runtime, fast rollback |

---

## 6. Repository Architecture

Keelacademy should start as a workspace, not a single crowded Next.js app.

```plain
apps/
  web/
    src/
      app/
      components/
      lib/
      styles/
      content/
      drizzle/
      tests/

packages/
  ui/             shared shadcn extensions and app-specific primitives
  email/          React Email templates and send helpers
  content/        Velite schemas, MDX components, cross-reference validation
  test-suite/     chapter specs students run locally
  cli/            `keel` command for auth, test, submit, status
  config/         eslint, tsconfig, prettier, tailwind preset
  database/       Drizzle schema and reusable query helpers if web grows large

docs/
  ADRs.md
  Design Doc.md
  Design System.md
  NFRs.md
  RFCs.md
```

The web app can import package code. Packages must not import from the web app. If code needs to be shared, move it down into a package.

### 6.1 Web App Domain Folders

Inside `apps/web/src/lib`, group by product domain:

```plain
lib/
  auth/
  billing/
  content/
  entitlements/
  progress/
  submissions/
  references/
  webhooks/
  email/
  events/
  rate-limit/
  api/
  db/
```

Each domain owns:

- schema or Drizzle table references it depends on
- validation schemas for external input
- service functions for business logic
- event names it emits or handles
- tests for critical rules

Route handlers import domain services. Domain services do not import route handlers.

### 6.2 App Router Layout

```plain
src/app/
  (marketing)/
  (learn)/
    chapters/[slug]/page.tsx
    lexicon/[slug]/page.tsx
    dsa/[slug]/page.tsx
  (dashboard)/
    dashboard/page.tsx
    settings/page.tsx
    billing/page.tsx
  api/
    submissions/route.ts
    references/[chapterSlug]/route.ts
    webhooks/paddle/route.ts
    webhooks/inngest/route.ts
    account/api-keys/route.ts
  layout.tsx
  error.tsx
  not-found.tsx
proxy.ts
```

Rules:

- Reads for internal pages happen in Server Components or cached server functions.
- UI mutations use Server Actions when they are internal to the web app.
- Route handlers are for external clients: Paddle, Inngest, CLI, signed downloads, and any future public API.
- Client Components are islands for interaction only: slide-over panels, checkout controls, command palettes, progress buttons, and optimistic UI.

---

## 7. Data Model

Content files are not stored in the database. The database stores identity, entitlement, progress, submissions, operational events, and artifact access.

### 7.1 Core Tables

```plain
users
  id
  email
  name
  avatar_url
  role
  created_at
  updated_at

accounts
  provider
  provider_account_id
  user_id

sessions
  session_token
  user_id
  expires_at

enrollments
  id
  user_id
  plan
  status
  paddle_customer_id
  paddle_subscription_id
  current_period_ends_at
  created_at
  updated_at

chapter_progress
  id
  user_id
  chapter_slug
  state
  novel_completed_at
  build_started_at
  tests_passed_at
  reference_unlocked_at
  reference_viewed_at
  completed_at
  reading_seconds
  build_attempt_count
  created_at
  updated_at

test_submissions
  id
  user_id
  chapter_slug
  status
  tests_total
  tests_passed
  test_suite_version
  cli_version
  commit_sha
  signature_hash
  submitted_at

api_keys
  id
  user_id
  name
  hashed_key
  last_used_at
  revoked_at
  created_at

reference_artifacts
  id
  chapter_slug
  version
  storage_key
  checksum
  published_at

audit_events
  id
  actor_user_id
  type
  subject_type
  subject_id
  metadata_json
  created_at

webhook_events
  id
  provider
  provider_event_id
  status
  received_at
  processed_at
  error_message
```

### 7.2 Index Requirements

Indexes are part of the design, not an afterthought.

| Table | Required Indexes |
| --- | --- |
| `users` | unique email |
| `sessions` | unique session token, user id |
| `enrollments` | user id, Paddle customer id, Paddle subscription id |
| `chapter_progress` | unique user id + chapter slug, user id + state |
| `test_submissions` | user id + chapter slug + submitted_at, signature hash |
| `api_keys` | unique hashed key, user id + revoked_at |
| `webhook_events` | unique provider + provider event id, status + received_at |
| `audit_events` | actor user id + created_at, subject type + subject id |

### 7.3 State Machines

`chapter_progress.state` is controlled by domain functions only.

```plain
locked -> reading -> building -> unlocked -> complete
```

Allowed transitions:

- `locked -> reading`: enrollment active and prerequisite satisfied.
- `reading -> building`: student starts build or submits first test attempt.
- `building -> unlocked`: signed submission passes expected tests.
- `unlocked -> complete`: reference viewed or explicit completion action.
- any state -> same state: idempotent replay.

All transition functions must write an audit event and emit an Inngest event.

---

## 8. Content Architecture

Content is code. The MDX corpus is compiled into typed manifests and validated during build.

```plain
content/
  chapters/
    01-the-first-commit/
      novel.mdx
      build-along.mdx
      meta.json
      terms.json
    02-the-extension-chain/
  lexicon/
    repository-pattern.mdx
    backpressure.mdx
  dsa/
    topological-sort.mdx
    token-bucket.mdx
  references-manifest/
    01-the-first-commit.json
```

Reference implementations are not stored as public content. They live in private storage and are exposed only through authenticated route handlers.

Content validation must fail the build when:

- a `<Term slug="">` points to a missing lexicon or DSA entry
- a chapter references a missing test-suite chapter
- metadata omits title, part, chapter number, estimated time, or prerequisites
- two content files claim the same slug
- a chapter references a future prerequisite out of order

---

## 9. API and Contract Standards

Every route handler follows the same shape:

1. Wrap with auth/session/entitlement/rate-limit helper.
2. Parse params, query, and body with a schema.
3. Call a domain service.
4. Return a typed response.
5. Emit background events with `waitUntil` or Inngest, never by blocking the user when it is not required.
6. Let the shared error helper map exceptions to stable JSON errors.

Example route responsibilities:

| Route | Caller | Responsibility |
| --- | --- | --- |
| `POST /api/submissions` | `keel` CLI | verify API key, validate HMAC, record submission, emit progress event |
| `GET /api/references/[chapterSlug]` | browser or CLI | verify entitlement and progress, return signed URL or rendered source |
| `POST /api/webhooks/paddle` | Paddle | verify signature, dedupe event id, enqueue fulfillment |
| `POST /api/webhooks/inngest` | Inngest | serve background function endpoint |
| `POST /api/account/api-keys` | dashboard | create hashed CLI key |

Stable error format:

```json
{
  "error": {
    "code": "forbidden",
    "message": "Reference implementation is locked until tests pass.",
    "doc_url": "https://keelacademy.com/docs/errors#forbidden"
  }
}
```

---

## 10. Key Flows

### 10.1 Chapter Reading

1. Student opens `/chapters/[slug]`.
2. Server Component loads compiled chapter content, current enrollment, and progress in parallel.
3. Novel content renders first.
4. Inline terms render as buttons with `data-layer` and slug metadata.
5. Client island opens a slide-over panel with prefetched lexicon or DSA content.
6. Reading progress is tracked through explicit actions and low-frequency heartbeats.
7. The same page continues into the Build-Along section.

### 10.2 Test Submission

1. Student authenticates the CLI and receives a scoped API key.
2. Student runs the chapter test suite locally.
3. CLI creates a payload with chapter slug, test counts, test-suite version, CLI version, timestamp, and optional commit SHA.
4. CLI signs the payload with HMAC-SHA256.
5. `POST /api/submissions` verifies the key, signature, timestamp, test-suite version, and prerequisite state.
6. Passing submissions transition the chapter to `unlocked`.
7. Inngest sends progress email, records analytics event, and warms reference artifact metadata.

### 10.3 Reference Access

1. Student requests a reference from the chapter page or CLI.
2. Route handler verifies active enrollment and `tests_passed_at`.
3. Domain service creates a short-lived signed URL or returns a rendered source view.
4. Access is logged as an audit event.
5. First view transitions `unlocked -> complete` if the student has not completed the chapter yet.

### 10.4 Payment Fulfillment

1. Student starts Paddle checkout from the billing page.
2. Paddle handles payment, tax, fraud, and receipts.
3. Paddle sends a webhook to `/api/webhooks/paddle`.
4. Route handler verifies signature and dedupes by provider event id.
5. Inngest processes fulfillment, updates enrollment, emits `enrollment.activated`, and sends email.
6. Dashboard reflects access from database state, not from checkout redirect params.

---

## 11. Security

- Use Auth.js database sessions with secure, httpOnly cookies.
- Hash API keys before storage; only show raw keys once.
- Verify CLI submission HMACs and reject stale timestamps.
- Verify Paddle webhook signatures and dedupe provider event ids.
- Protect references through route handlers; never expose private storage paths.
- Rate limit auth, submissions, API key creation, and signed reference URLs.
- Use idempotency keys for payment and submission side effects.
- Keep secrets in Vercel environment variables by environment.
- Log mutations with sensitive fields masked.
- Use `proxy.ts` only for coarse request protection; keep business authorization in domain services.

---

## 12. Observability and Operations

Production-grade means the founder can answer "what happened?" without guessing.

| Concern | Implementation |
| --- | --- |
| Application errors | Sentry with release and route context |
| Web Vitals | Vercel Analytics |
| Learning events | structured events: chapter viewed, term opened, build started, tests passed, reference viewed |
| API logs | mutation logs with actor, route pattern, status, duration, masked request/response |
| Webhooks | `webhook_events` table with raw provider id, status, retries, errors |
| Jobs | Inngest run history and alerts |
| Audit trail | `audit_events` for billing, API keys, submissions, reference access |
| Incident response | rollback via Vercel, replay failed Inngest jobs, reprocess webhook events |

Alert on:

- repeated Paddle webhook failures
- submission verification error spike
- reference artifact access failures
- new Sentry issue affecting chapter pages
- p95 API latency above target for 15 minutes

---

## 13. Testing Strategy

Tests should match product risk.

| Layer | Coverage |
| --- | --- |
| Domain services | progress transitions, entitlement checks, submission verification, billing fulfillment |
| Route handlers | auth failures, bad input, idempotency, happy path |
| Content compiler | broken term links, duplicate slugs, missing metadata |
| CLI | auth flow, payload signing, submit command, error display |
| E2E | enroll -> read -> submit -> unlock reference |
| Accessibility | chapter page, term panel, checkout, dashboard navigation |

Do not rely on browser E2E for domain rules. Domain rules belong in fast service tests.

---

## 14. Deployment and Environments

Environments:

- local
- preview
- production

Each environment owns:

- Turso database
- Paddle mode/config
- Upstash Redis database
- Inngest environment
- storage bucket/prefix
- Vercel environment variables

Preview deployments should not share production data. Webhook endpoints in preview must be opt-in and clearly labeled.

---

## 15. Launch Phases

### Phase 1: Reading Platform

- Marketing pages
- Chapter page
- MDX/Velite content pipeline
- Lexicon and DSA standalone pages
- Inline term slide-over
- Basic auth

### Phase 2: Enrollment and Progress

- Paddle checkout and webhooks
- Enrollment state
- Chapter progression
- Dashboard
- Email notifications

### Phase 3: Build Validation

- `packages/test-suite`
- `packages/cli`
- API keys
- Signed submissions
- Reference unlocks

### Phase 4: Production Hardening

- Audit events
- API mutation logs
- webhook replay tools
- Sentry alerts
- accessibility audit
- E2E happy path

---

## 16. Open Questions

1. Should novel content remain free while Build-Along and references are paid?
2. Should references be downloadable, view-only, or both?
3. Should the CLI publish as `@keelacademy/cli` from the same repo or a separate package repo?
4. Should launch pricing be one-time purchase, subscription, or cohort license?
5. Should the content package expose a public JSON manifest for future search?

---

## Appendix A: Dub Comparison

| Concern | Dub | Keelacademy |
| --- | --- | --- |
| Product unit | link, workspace, partner program | chapter, enrollment, progress, submission |
| Scale pressure | redirect latency and click ingestion | reading speed, content validation, progress integrity |
| External API | public link/analytics APIs | CLI submissions, references, future content API |
| Entitlements | plan limits, roles, workspace permissions | active enrollment, chapter prerequisite, reference unlock |
| Event stream | clicks, leads, sales, webhooks | reading, build, submissions, billing, reference access |
| Operational risk | redirect failures, analytics loss, billing/webhook issues | payment fulfillment, locked references, bad progress state |

What Keelacademy should copy:

- thin route handlers
- schema-first validation
- domain service folders
- evented side effects
- package boundaries
- observability from day one
- mutation audit logs
- idempotent webhook processing

What Keelacademy should not copy:

- Prisma, because this project has already chosen Drizzle
- Stripe, because Paddle is the required Merchant of Record path
- Tinybird as a default, because learning analytics are not clickstream-scale at launch
- complex workspace/team RBAC before there is a team product
