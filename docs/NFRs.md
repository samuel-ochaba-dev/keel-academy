# Keelacademy NFRs

# Non-Functional Requirements
Performance, scalability, availability, security, accessibility, observability, and developer experience requirements for the Keelacademy learning platform.

* * *
## NFR-001: Performance

| Metric | Target | Rationale |
| ---| ---| --- |
| Largest Contentful Paint (LCP) | < 1.5s | Novel pages are the primary experience; readers bounce on slow loads. Google Core Web Vitals "good" threshold is 2.5s; we target excellence. |
| First Input Delay (FID) | < 50ms | Term click → slide-over must feel instant. |
| Cumulative Layout Shift (CLS) | < 0.05 | No content jumping while reading. |
| Time to First Byte (TTFB) | < 200ms | ISR + edge caching enables this for content pages. |
| API route response (p95) | < 500ms | Test submissions, progress updates, auth checks. |
| Slide-over panel open | < 100ms | Lexicon/DSA entries prefetched, render is purely client-side. |

**Benchmarks:** EdTech platforms with similar content-heavy models (Codecademy, Launch School) report 2-4s LCP. We target sub-1.5s through static generation + selective hydration.

Source: Google Web Vitals documentation (2025), HTTP Archive EdTech vertical report.

* * *
## NFR-002: Scalability

| Dimension | Target | Strategy |
| ---| ---| --- |
| Concurrent readers | 10,000 | ISR serves from CDN cache; no origin hit for content pages |
| Concurrent test submissions | 500/min | Inngest queues buffer writes; DB handles sustained 500 inserts/min easily |
| Total enrolled students | 100,000 | Turso scales to millions of rows; queries indexed on user\_id + chapter\_number. Edge replicas handle read load globally. |
| Content corpus | 200+ MDX files | Build time stays under 120s with incremental builds |
| Monthly bandwidth | 5TB | Vercel CDN + text-heavy pages (no video) keeps payload small |

**Growth model:** Start at ~100 students (launch cohort), grow to 1,000 within 6 months, 10,000 within 18 months. Architecture must handle 10x beyond current load without re-architecture.

Source: Vercel infrastructure documentation, Turso performance benchmarks (2026).

* * *
## NFR-003: Availability

| Metric | Target |
| ---| --- |
| Uptime | 99.9% (8.7h downtime/year max) |
| Planned maintenance windows | Zero (serverless: no restarts) |
| Recovery Time Objective (RTO) | < 5 minutes (Vercel instant rollback) |
| Recovery Point Objective (RPO) | < 1 hour (Turso point-in-time recovery) |

**Rationale:** Students study at unpredictable hours across global time zones. Downtime during a build-along session (2-6 hours) breaks flow state. Serverless architecture means no single points of failure in compute.

Source: Vercel SLA (99.99% for Enterprise, 99.9% implied for Pro), Turso backup documentation.

* * *
## NFR-004: Security

| Requirement | Implementation |
| ---| --- |
| Authentication | Auth.js with CSRF tokens, httpOnly secure cookies, session rotation |
| Authorization | Role-based (student, admin); content gating via middleware |
| Data at rest | Turso encrypts all data at rest (AES-256) |
| Data in transit | TLS 1.3 enforced on all endpoints |
| Payment data | Zero PCI scope (Paddle handles all card data) |
| API security | Rate limiting (Upstash, 100 req/min per user), HMAC-verified webhooks |
| Secrets management | Vercel environment variables (encrypted, per-environment) |
| Dependency security | Dependabot + `pnpm audit` in CI |
| Content protection | Reference implementations behind auth + signed URLs (time-limited) |

**Compliance:** No SOC2 or GDPR certification required at launch (education platform, not enterprise SaaS). GDPR data subject requests handled manually until scale requires automation.

Source: OWASP Top 10 (2025), Auth.js security documentation, Vercel security whitepaper.

* * *
## NFR-005: Accessibility

| Requirement | Standard |
| ---| --- |
| WCAG compliance | 2.1 Level AA |
| Keyboard navigation | Full — all interactive elements (terms, panels, buttons) focusable and operable |
| Screen reader support | Semantic HTML, ARIA labels on slide-over panels, live regions for dynamic content |
| Color contrast | Minimum 4.5:1 for body text, 3:1 for large text |
| Motion | Respects `prefers-reduced-motion`; slide-over animations disableable |
| Focus management | Slide-over traps focus; returns focus on close |

**Rationale:** Developers with disabilities exist and deserve equal access to engineering education. Additionally, accessible design improves UX for all users (keyboard shortcuts for power users, readable contrast for everyone).

Source: WCAG 2.1 specification, Radix UI accessibility documentation.

* * *
## NFR-006: Observability

| Dimension | Tool | What We Track |
| ---| ---| --- |
| Errors | Sentry | Unhandled exceptions, API failures, client errors |
| Performance | Vercel Analytics | Core Web Vitals, route-level performance |
| Business metrics | Plausible | Chapter completion rates, time-on-page, conversion funnel |
| Background jobs | Inngest Dashboard | Event processing, function failures, retry rates |
| Uptime | Vercel (built-in) | Endpoint health, response times |

**Alerts:** Sentry alerts on new error types, Inngest alerts on repeated function failures. No PagerDuty (solo developer, async alerts via email/Slack are sufficient).

* * *
## NFR-007: Developer Experience (Maintainability)

| Requirement | Target |
| ---| --- |
| Local dev startup | < 30 seconds (`pnpm dev`) |
| CI pipeline | < 3 minutes (type-check + lint + test) |
| Deploy time | < 60 seconds (Vercel build + deploy) |
| Preview deploys | Every PR gets a unique URL with isolated Turso database |
| Code coverage | \> 80% on business logic (auth, progress, payments) |
| Type coverage | 100% strict TypeScript, no `any` |

**Rationale:** Solo developer means DX IS velocity. Every minute of friction compounds. No context-switching between tools.

Source: Dub's development workflow documentation, Vercel build performance benchmarks.