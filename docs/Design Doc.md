# Keelacademy Design Doc

# DESIGN DOC: Keelacademy Learning Platform
## Status: Draft
## Authors: Samuel Ochaba
## Date: 2026-07-05
* * *
## 1\. Overview
Keelacademy is an online school that teaches software engineers to build production-grade systems. The platform delivers a novel-driven curriculum across 16 chapters with four interlocking layers (Novel, Build-Along, Engineering Lexicon, Emerging DSA) through a single-page-per-chapter experience.

This document describes the architecture of the web platform students interact with: content delivery, progress tracking, test integration, inline reference lookup, payments, and deployment.

* * *
## 2\. Goals
*   Deliver a seamless single-page chapter experience where four content layers are accessed contextually (no tab-switching)
*   Support self-paced progression through 16 chapters with gated reference implementation unlocks
*   Provide sub-200ms page loads for content (reading is the primary activity)
*   Integrate with student test suites to validate chapter completion
*   Handle payments globally from Nigeria via Merchant of Record
*   Scale to 10,000 concurrent students without architectural changes
*   Ship as a solo developer with minimal operational overhead

* * *
## 3\. Non-Goals
*   Real-time collaboration (students work solo)
*   Video hosting or streaming
*   In-browser code execution (students use local environments)
*   Mobile-native apps (responsive web only)
*   Social features (forums, chat, comments)
*   AI tutoring (the novel IS the tutor)

* * *
## 4\. System Architecture
### 4.1 High-Level Architecture

```plain
┌─────────────────────────────────────────────────────┐
│                    Vercel Edge                        │
│  ┌───────────┐  ┌───────────┐  ┌────────────────┐  │
│  │  Next.js   │  │  API Routes│  │  Edge Middleware│  │
│  │  App Router│  │  /api/*    │  │  (auth, geo)   │  │
│  └───────────┘  └───────────┘  └────────────────┘  │
└────────────┬───────────┬──────────────┬─────────────┘
             │           │              │
     ┌───────▼───┐  ┌────▼─────┐  ┌────▼──────┐
     │  SQLite    │  │  Upstash │  │  Paddle   │
     │  (Turso)   │  │  Redis   │  │  (MoR)    │
     │            │  │          │  │           │
     └────────────┘  └──────────┘  └───────────┘
             │
     ┌───────▼───────┐
     │   Inngest     │
     │ (Background   │
     │  Jobs)        │
     └───────────────┘
```

### 4.2 Tech Stack

| Layer | Technology | Rationale |
| ---| ---| --- |
| Framework | Next.js 15 (App Router) | RSC for content, streaming, Vercel-native |
| Language | TypeScript (strict) | Type safety across stack |
| Database | SQLite via Turso | Edge-native, embedded replicas for zero-latency reads, Vercel Marketplace integration |
| ORM | Drizzle | Type-safe, SQL-first, lightweight |
| Cache | Upstash Redis | Serverless Redis, session cache, rate limiting |
| Auth | Auth.js (v5) | OAuth + magic link, session strategy |
| Payments | Paddle | MoR with global payout support (Nigeria included), tax compliance in 200+ countries |
| Background Jobs | Inngest | Event-driven, serverless, retries, cron |
| Content | MDX + Velite | Typed content, co-located with repo, RSC-compatible |
| Styling | Tailwind CSS | Utility-first, design system via preset |
| UI Components | Radix Primitives + custom | Accessible, unstyled base |
| Deployment | Vercel | Zero-config, edge functions, preview deploys |
| Analytics | Plausible (self-hosted or cloud) | Privacy-first, lightweight |
| Monitoring | Sentry | Error tracking, performance monitoring |
| Email | Resend | Transactional email (welcome, receipts, progress) |
| Storage | Vercel Blob or Cloudflare R2 | Reference implementation file storage |

### 4.3 Data Model (Core Entities)

```plain
User
├── id, email, name, avatar_url
├── created_at, updated_at
├── subscription_status (active, cancelled, expired, trial)
└── paddle_customer_id

Enrollment
├── id, user_id, plan_type
├── started_at, expires_at
└── paddle_subscription_id

ChapterProgress
├── id, user_id, chapter_slug
├── novel_completed_at
├── build_started_at
├── tests_passing_at
├── reference_unlocked_at
├── completed_at
└── time_spent_minutes

LexiconEntry
├── id, slug, title, category
├── chapter_introduced
├── content_mdx
└── related_entries[]

DSAEntry
├── id, slug, title
├── chapter_introduced
├── content_mdx
├── complexity_table
└── interview_framing

TestSubmission
├── id, user_id, chapter_slug
├── submitted_at
├── tests_total, tests_passed
├── commit_sha
└── status (pending, passed, failed)
```

### 4.4 Content Architecture
All curriculum content lives in the repository as MDX files:

```plain
content/
├── chapters/
│   ├── 01-the-first-commit/
│   │   ├── novel.mdx
│   │   ├── build-along.mdx
│   │   ├── meta.json (title, part, estimated_time)
│   │   └── test-suite/ (spec files students run locally)
│   ├── 02-the-extension-chain/
│   │   └── ...
├── lexicon/
│   ├── repository-pattern.mdx
│   ├── backpressure.mdx
│   └── ...
├── dsa/
│   ├── topological-sort.mdx
│   ├── token-bucket.mdx
│   └── ...
└── reference/ (gated, not in public repo)
    ├── 01/ (reference implementation files)
    └── ...
```

MDX files use custom components for inline term highlighting:

```jsx
The senior explains why a <Term slug="repository-pattern">repository pattern</Term> prevents this coupling.
```

### 4.5 Key Flows
**Chapter Reading Flow:**
1. Student opens chapter page (RSC renders novel MDX at build time via ISR)
2. Highlighted terms render as interactive elements
3. Click term → client-side slide-over panel loads lexicon/DSA entry (prefetched)
4. Novel completion tracked via scroll progress + explicit "Done reading" action
5. Page continues into Build-Along section (same URL, scroll-based transition)

**Test Submission Flow:**
1. Student runs test suite locally: `pnpm test:chapter-03`
2. Test runner generates a signed results JSON (HMAC with student's API key)
3. Student submits via CLI: `keel submit` (hits API route)
4. API validates signature, records TestSubmission
5. If all tests pass → reference implementation unlocks → chapter marked complete
6. Inngest triggers progress email + analytics event

**Payment Flow:**
1. Student clicks "Enroll" → Paddle overlay checkout opens
2. Paddle handles payment, tax calculation, fraud prevention
3. Webhook fires to `/api/webhooks/paddle`
4. API creates Enrollment, updates User subscription\_status
5. Student redirected back to platform with active access

* * *
## 5\. Security Considerations
*   Auth via Auth.js with CSRF protection, secure httpOnly cookies
*   API routes protected by session middleware
*   Test submission integrity via HMAC-SHA256 signing
*   Reference implementations served from authenticated endpoints (not static)
*   Paddle webhook verification via signature header
*   Rate limiting on API routes via Upstash Redis
*   Content not behind paywall at novel layer (freemium: read free, build gated)

* * *
## 6\. Deployment & Operations
*   Vercel for compute (auto-scaling, preview deploys per PR)
*   Turso for database (edge replicas, embedded reads in Vercel functions)
*   GitHub Actions for CI (type-check, lint, test)
*   Sentry for error monitoring and performance
*   Inngest dashboard for background job visibility
*   No self-managed infrastructure

* * *
## 7\. Open Questions
1. Should novel content be free (freemium) or fully gated?
2. CLI-based test submission vs. GitHub App integration for validation?
3. Single purchase vs. subscription pricing model?
4. Should reference implementations be downloadable or view-only in browser?

* * *
## Appendix: Tech Stack Comparison with Dub

| Concern | Dub (Link Attribution) | Keelacademy (Learning Platform) | Why Different |
| ---| ---| ---| --- |
| Framework | Next.js App Router | Next.js App Router | Same: both are content + interaction hybrids |
| Database | PlanetScale (MySQL) | Turso (SQLite, edge) | Read-heavy workload benefits from embedded replicas; zero-latency local reads |
| ORM | Prisma | Drizzle | Drizzle is lighter, SQL-first, better serverless perf |
| Cache | Upstash Redis | Upstash Redis | Same: serverless Redis for sessions + rate limiting |
| Queue/Jobs | QStash | Inngest | Inngest adds orchestration layer; solo dev needs more abstractions |
| Auth | NextAuth | Auth.js v5 | Same library, newer version |
| Payments | Stripe | Paddle (MoR) | Nigeria requires MoR; Stripe not available for NG merchants |
| Analytics | Tinybird | Plausible | Simpler needs; no click-level analytics required |
| Monitoring | Axiom | Sentry | Sentry's error grouping better for debugging solo |
| Email | Resend | Resend | Same: transactional email |
| Hosting | Vercel | Vercel | Same: zero-ops deployment |
| Content | MDX in repo | MDX in repo | Same pattern: content as code |