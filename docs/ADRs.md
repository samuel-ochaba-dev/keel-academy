# Keelacademy ADRs

# Architecture Decision Records
Decisions made for the Keelacademy learning platform. Each ADR captures a significant architectural choice, the context that drove it, and its consequences.

* * *
## ADR-001: Next.js App Router as Application Framework
**Status:** Accepted
**Date:** 2026-07-05
### Context
Keelacademy is a content-heavy platform (16 chapters × 4 layers = 64+ MDX documents) with interactive elements (slide-over panels, progress tracking, gated content). The platform is built and maintained by a solo developer.

Options considered:
*   Next.js (App Router)
*   Remix
*   Astro + React islands
*   SvelteKit
### Decision
Next.js 16 with App Router.
### Rationale
1. **React Server Components** render MDX content on the server with zero client JS for reading-heavy pages. Only interactive elements (term slide-overs, progress buttons) hydrate.
2. **Streaming** allows the novel to render immediately while lexicon data prefetches in parallel.
3. **Vercel-native** deployment means zero DevOps overhead: preview deploys, `proxy.ts` request interception, analytics, cron jobs.
4. **Ecosystem depth**: Auth.js, Drizzle, Inngest, Paddle SDKs all have first-class Next.js support.
5. **Dub's public repository** validates the operating model: Next.js on Vercel, typed product domains, route-handler wrappers, workspace packages, and small-team production discipline.

Astro was close (better static perf) but lacks the dynamic capabilities needed for auth-gated content and real-time progress tracking without significant complexity.
### Consequences
*   Locked into Vercel for optimal DX (can deploy elsewhere but loses edge optimizations)
*   Must manage RSC/client boundary carefully to avoid bundle bloat
*   App Router maturity means some ecosystem libraries still catching up

* * *
## ADR-002: SQLite via Turso as Primary Database
**Status:** Accepted
**Date:** 2026-07-05
### Context
The platform needs relational storage for users, enrollments, progress, and test submissions. Must be serverless-compatible (Vercel functions are stateless) and affordable for a bootstrapped solo project. The workload is overwhelmingly read-heavy (students reading content, checking progress).

Options considered:
*   PlanetScale (MySQL) — Dub's choice
*   Neon (PostgreSQL, serverless)
*   Supabase (PostgreSQL, managed)
*   Turso (SQLite, edge)
### Decision
Turso (managed libSQL/SQLite at the edge).
### Rationale
1. **Embedded replicas** — database pages replicate into Vercel functions. Reads execute locally with zero network roundtrips (1-5ms vs 20-50ms for Neon/PlanetScale). For a read-heavy learning platform, this is a massive latency win.
2. **Edge-native** — replicas in 30+ global locations mean students worldwide get fast reads regardless of region.
3. **Vercel Marketplace integration** — first-class support, zero-config database provisioning.
4. **Drizzle ORM** has excellent Turso/libSQL integration with the `@tursodatabase/serverless` driver.
5. **Cost** — generous free tier (9GB storage, 500 databases), perfect for bootstrapping. Most affordable option in the serverless DB market.
6. **Simplicity** — SQLite's data model constraints (no complex JSON operators, no full-text on user data) are irrelevant for our schema. Users, progress, submissions: simple relational tables.
7. **Writes go to primary** — writes (test submissions, progress updates) route to the remote primary for durability. Infrequent enough that single-region write latency is acceptable.

Neon was close (PostgreSQL, serverless driver, branching) but adds 20-50ms network latency on every read. For a platform where the primary interaction is checking progress/auth state on every page load, embedded reads win decisively. Supabase adds unnecessary services. PlanetScale's pricing changed unfavorably.
### Consequences
*   No database branching for preview deploys (use separate Turso databases per environment instead)
*   SQLite limitations: no `ARRAY` type, no `JSONB` operators (use TEXT + application-level parsing where needed)
*   Embedded replica sync has a small propagation delay (~50-100ms for writes to appear in local reads; acceptable for progress tracking)
*   Newer ecosystem than PostgreSQL (fewer tutorials, smaller community)

* * *
## ADR-003: Paddle as Merchant of Record
**Status:** Accepted
**Date:** 2026-07-05
### Context
Keelacademy sells digital education products globally from Nigeria. Nigerian founders face:
*   Stripe requires a supported-country entity (Nigeria not directly supported for merchants)
*   PayPal cannot receive payments in Nigeria
*   Global tax compliance (VAT/GST in 100+ jurisdictions) is operationally impossible solo
*   Chargebacks and fraud management require dedicated infrastructure

A Merchant of Record handles all of this: they are the legal seller, collect tax, manage disputes, and pay you out.

Options considered:
*   Paddle
*   Lemon Squeezy (Stripe-owned since 2024)
*   Dodo Payments
*   Sellra
*   Selar (Nigerian, creator-focused)
### Decision
Paddle.
### Rationale
1. **Nigeria is explicitly supported** — Paddle pays out to sellers anywhere in the world except sanctioned countries (Iran, North Korea, Russia, etc.). Nigeria is not on the exclusion list.
2. **Proven at scale** — powers thousands of SaaS companies, processes billions in software revenue. Enterprise-grade infrastructure with dedicated support.
3. **5% + $0.50/transaction** — market-rate for MoR, zero tax compliance cost, zero chargeback liability.
4. **Tax compliance in 200+ countries** — Paddle calculates, collects, and remits sales tax/VAT/GST in every jurisdiction. As MoR, tax liability is theirs, not ours.
5. **Subscription + one-time purchase support** — flexibility for pricing model decisions.
6. **Paddle.js overlay checkout** — inline checkout that doesn't redirect away from the platform. Better UX than hosted checkout pages.
7. **Responsive support** — actual humans respond to seller inquiries. Account approvals have clear process and timeline.
8. **Volume-based fee negotiation** — as revenue grows past $50k/month, fees become negotiable.

Lemon Squeezy was ruled out: account approval process unresponsive (tested personally, no approval or response received). Despite Nigeria being on their payout list, an MoR you can't onboard to is useless. Dodo Payments is newer with less track record. Selar is creator-focused but lacks tax compliance depth.
### Consequences
*   5% fee is higher than Stripe's 2.9% (but Stripe isn't available + you'd pay for tax compliance separately)
*   Payout schedule is monthly (balance accrues, paid on 1st, received by 15th). Plan cash flow accordingly.
*   Paddle.js adds a small script (~20KB) to checkout pages
*   Revenue appears under Paddle's merchant name on student bank statements
*   Payout currency: USD, GBP, or EUR (not NGN directly; receive in USD to a domiciliary account or use Grey/Geegpay for conversion)

* * *
## ADR-004: MDX + File-Based Content Model
**Status:** Accepted
**Date:** 2026-07-05
### Context
Keelacademy's content is 64+ documents (novels, build-alongs, lexicon entries, DSA entries) that are:
*   Long-form (novels are 3,000-8,000 words each)
*   Richly formatted (code blocks, tables, diagrams, highlighted terms)
*   Cross-referenced (lexicon entries link to chapters, DSA entries link to build-alongs)
*   Version-controlled (content IS the product, changes must be tracked)

Options considered:
*   Headless CMS (Sanity, Contentful)
*   Database-stored content (rich text in PostgreSQL)
*   MDX in repository (file-based)
*   Notion as CMS
### Decision
MDX files in the monorepo, processed by Velite (or Contentlayer successor) at build time.
### Rationale
1. **Git is the CMS** — every content change has a commit, a diff, and a history. For a solo author writing a 16-chapter novel, this is ideal.
2. **MDX enables custom components** — `<Term>`, `<CodeBlock>`, `<Callout>`, `<DSAComplexity>` render inline without leaving markdown simplicity.
3. **Build-time processing** means content pages are static (ISR), zero database queries for reading.
4. **Co-location** — chapter novel, build-along, and test suite live in the same directory. One PR can update narrative + specs together.
5. **Type safety** — Velite/Contentlayer generates TypeScript types from content schemas. Broken cross-references caught at build time.
6. **Dub pattern** — Dub stores blog/docs content as MDX in repo for the same reasons.

Headless CMS adds a service dependency, costs money, and separates content from code unnecessarily for a solo-authored product.
### Consequences
*   Content updates require a deploy (ISR mitigates with 60s revalidation)
*   No non-developer content editing (fine: Samuel is the sole author)
*   Large content corpus may slow builds (mitigated by incremental builds)
*   Must build custom preview tooling for MDX authoring

* * *
## ADR-005: Auth.js v5 for Authentication
**Status:** Accepted
**Date:** 2026-07-05
### Context
Students need accounts to track progress, submit tests, and access paid content. Auth must be simple (magic link for frictionless signup), secure, and integrate with the payment system.

Options considered:
*   Auth.js (NextAuth v5)
*   Clerk
*   Lucia
*   Custom JWT implementation
### Decision
Auth.js v5 with database sessions (Drizzle adapter).
### Rationale
1. **Magic link + OAuth (GitHub, Google)** — developers prefer passwordless or OAuth. Magic link as primary, GitHub as secondary (our audience lives on GitHub).
2. **Database sessions** — stored in Turso, queryable, revocable. No JWT token size issues.
3. **Drizzle adapter** — first-class integration with our ORM choice.
4. **`proxy.ts` request protection** - coarse route protection happens before rendering; business authorization remains in server/domain code.
5. **Free** — no per-user pricing (Clerk charges $0.02/MAU after free tier).
6. **Dub uses the same authentication family** - validates Auth.js/NextAuth as a practical foundation, while Keelacademy uses Auth.js v5 and Drizzle.

Clerk has better DX for complex auth (MFA, org management) but costs money and adds a service dependency for features we don't need. Lucia was considered but is being deprecated in favor of Auth.js patterns.
### Consequences
*   Must implement email provider (Resend) for magic links
*   Session management is our responsibility (cleanup cron via Inngest)
*   No built-in user management UI (build a minimal settings page)
*   `proxy.ts` checks add latency for protected routes; keep them coarse and avoid putting business logic there.

* * *
## ADR-006: CLI-Based Test Submission with HMAC Verification
**Status:** Accepted
**Date:** 2026-07-05
### Context
Keelacademy's Build-Along requires students to run tests locally and prove they pass. The platform must verify test results without running student code on our infrastructure (security risk, cost, complexity).

Options considered:
*   GitHub App (watch for CI green on student repos)
*   In-browser code execution (WebContainers, CodeSandbox)
*   CLI tool that reports results to API
*   Honor system (student self-reports)
### Decision
Custom CLI tool (`@keelacademy/cli`) that runs tests locally and submits signed results.
### Rationale
1. **Security** — we never execute student code. The CLI runs locally, generates a result payload, and signs it with the student's API key (HMAC-SHA256).
2. **Simplicity** — no GitHub App configuration, no CI pipeline setup, no WebContainer complexity.
3. **Developer experience** — `pnpm test:ch03` then `keel submit` is two commands. Feels native.
4. **Verification** — HMAC signature proves the submission came from the student's authenticated environment. Not cryptographically tamper-proof (student controls the environment) but sufficient for an educational context where cheating hurts only the cheater.
5. **Offline-compatible** — students can run tests without internet, submit when connected.

GitHub App was close (more tamper-resistant) but adds setup friction (students must create repos with specific structure, enable the app, wait for CI). For a self-paced course, the CLI is faster.
### Consequences
*   Students must install the CLI (`npm i -g @keelacademy/cli`)
*   API key management (generated in student dashboard, stored in `.env`)
*   Not fully tamper-proof (acceptable trade-off for education)
*   Must build and maintain a CLI package (small scope: submit command + auth)

* * *
## ADR-007: Inngest for Background Jobs
**Status:** Accepted
**Date:** 2026-07-05
### Context
The platform needs background processing for:
*   Webhook processing (Paddle payment events)
*   Progress notification emails
*   Session cleanup
*   Analytics aggregation
*   Cache warming after deploys

Options considered:
*   Upstash QStash (Dub's choice)
*   Inngest
*   [Trigger.dev](http://Trigger.dev)
*   Vercel Cron + API routes
### Decision
Inngest.
### Rationale
1. **Event-driven** — define functions that react to events (`enrollment.created`, `tests.passed`). Natural fit for webhook-driven flows.
2. **Step functions** — built-in retries, sleeps, and fan-out without managing state.
3. **Serverless-native** — runs inside Next.js API routes, no separate infrastructure.
4. **Observability** — dashboard shows event history, function runs, failures. Essential for solo debugging.
5. **Cron support** — scheduled jobs (session cleanup, progress digests) without Vercel Cron's limitations.
6. **Generous free tier** — 25,000 runs/month free, more than enough for early stage.

QStash (Dub's choice) is lower-level (just HTTP-triggered queues). Inngest adds the orchestration layer on top that saves development time for a solo builder.
### Consequences
*   Service dependency (Inngest is a third-party platform)
*   Must structure code as event-driven (good architectural discipline)
*   Cold starts for infrequently-triggered functions (~1s, acceptable for background work)

* * *
## ADR-008: Vercel for Deployment
**Status:** Accepted
**Date:** 2026-07-05
### Context
Solo developer needs deployment that is zero-ops, auto-scaling, and cost-effective for a bootstrapped project with variable traffic.

Options considered:
*   Vercel
*   Netlify
*   Railway
*   Self-hosted (Docker + VPS)
### Decision
Vercel Pro plan.
### Rationale
1. **Zero-config Next.js deployment** — git push deploys. Preview URLs per PR. Instant rollbacks.
2. **`proxy.ts`** - auth redirects and lightweight request interception before rendering.
3. **ISR (Incremental Static Regeneration)** — content pages regenerate without full redeploys.
4. **Integrated analytics** — Web Vitals, speed insights without third-party scripts.
5. **Cron jobs** — simple scheduled tasks for cache warming.
6. **Dub runs on Vercel** — validates handling 100M+ requests/month on this infrastructure.
7. **$20/month Pro plan** — predictable cost, includes 1TB bandwidth, 1M function invocations.
### Consequences
*   Vendor lock-in (`proxy.ts`, image optimization, ISR, and Vercel deployment features are Vercel-specific)
*   Function timeout limits (60s on Pro, sufficient for our use cases)
*   Egress costs at scale (monitor bandwidth usage)

* * *
## ADR-009: pnpm Workspace for Product Surfaces
**Status:** Accepted
**Date:** 2026-07-06
### Context
Keelacademy is more than a web app. It has a student-facing web application, shared UI, email templates, a content compiler, a CLI, and a chapter test suite. Dub's repository demonstrates the operational advantage of keeping these surfaces in one workspace while giving each surface an explicit package boundary.

Options considered:
*   Single Next.js app with all code under `src/`
*   Multiple repositories
*   pnpm workspace with `apps/` and `packages/`
### Decision
Use a pnpm workspace from the first implementation.

Initial shape:
*   `apps/web` - Next.js application
*   `packages/ui` - shared UI primitives and shadcn extensions
*   `packages/email` - React Email templates and Resend helpers
*   `packages/content` - Velite schemas, MDX components, and validation
*   `packages/test-suite` - chapter tests students run locally
*   `packages/cli` - `keel` CLI for auth, test, submit, and status
*   `packages/config` - shared TypeScript, ESLint, Tailwind, and formatting config

### Rationale
1. **Clear ownership** - the CLI and test suite are product surfaces, not implementation details of the web app.
2. **Publishability** - `@keelacademy/cli` and `@keelacademy/test-suite` can be versioned and published without extracting them later.
3. **Shared contracts** - submission payload schemas, chapter identifiers, and content metadata can be reused without copy-paste.
4. **Build hygiene** - package boundaries prevent the web app from becoming a general-purpose utility bin.
5. **Dub precedent** - Dub keeps UI, email, CLI, analytics, embeds, and utilities in packages while the web app owns product routes.

### Consequences
*   Slightly more setup than a single app.
*   Package dependency direction must be enforced: packages cannot import from `apps/web`.
*   Shared code must earn its place in a package; avoid premature abstraction.

* * *
## ADR-010: Schema-First Route Handlers and Domain Services
**Status:** Accepted
**Date:** 2026-07-06
### Context
Keelacademy will have route handlers for Paddle webhooks, CLI submissions, signed references, API keys, and future public APIs. These endpoints touch money, entitlement, and student progress, so ad hoc route logic would become fragile quickly.

Dub's API handlers show a production pattern worth adopting: route handlers remain thin, shared wrappers own auth/rate-limit/error behavior, schemas define request and response contracts, and domain services own business rules.

Options considered:
*   Put all logic directly in `route.ts`
*   Use tRPC for all server calls
*   Use schema-first route handlers plus domain services
### Decision
Use schema-first route handlers plus domain services.

Every external route handler must:
1. Use a shared wrapper for session/API-key auth, entitlement checks, rate limiting, and stable errors.
2. Validate params, query, and body with a schema.
3. Call a domain service under `apps/web/src/lib/<domain>/`.
4. Return a typed response.
5. Record audit or API logs for mutations.
6. Emit background work through Inngest rather than hiding long side effects in the request.

### Rationale
1. **Security** - auth and entitlement checks are centralized.
2. **Testability** - business rules are tested as domain services without spinning up HTTP.
3. **DX** - schemas become the source of truth for CLI payloads and future API docs.
4. **Operational clarity** - stable error codes and mutation logs make support possible for a solo founder.
5. **Dub precedent** - this is the difference between route files that scale and route files that become a maze.

### Consequences
*   More upfront structure for the first endpoints.
*   Need discipline to keep wrappers small and domain services cohesive.
*   Public contracts become harder to change casually, which is good once the CLI ships.
