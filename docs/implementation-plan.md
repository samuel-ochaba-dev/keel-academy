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

**Current Milestone:** M1 - Repo Foundation

**Goal:** make the repository stable enough for daily implementation — task
orchestration, strict types, base routing conventions, a validated env contract,
documented CI, and docs that match the real folder structure.

**Next Actions:**

1. Add a validated environment schema (`@t3-oss/env-nextjs` + Zod) and enforce it at build time.
2. Add base App Router conventions: `error.tsx`, `global-error.tsx`, `loading.tsx`.
3. Document CI and add a working GitHub Actions workflow (`turbo run lint check-types build`).
4. Reconcile `AGENTS.md` with the real flat `app/` layout and the split config packages.
5. Commit the design-token pass (OKLCH palette, Bricolage UI font, WCAG contrast proof).

CI reference: see `docs/ci-plan.md`.

## Milestone Overview

| Milestone | Name                         | Outcome                                                                  |
| --------- | ---------------------------- | ------------------------------------------------------------------------ |
| M0        | Walking Skeleton             | One tiny end-to-end product path works                                   |
| M1        | Repo Foundation              | Workspace, Turborepo tasks, UI tokens, and deployment shape are stable   |
| M2        | Content Pipeline             | MDX content compiles, validates, and renders                             |
| M3        | Reading Experience           | Chapter page, term panels, and reference pages feel usable               |
| M4        | Auth and Progress            | Students can sign in and persist chapter state                           |
| M5        | Billing and Entitlements     | Paddle enrollment controls gated access                                  |
| M6        | CLI and Test Suite           | Students can run tests and submit signed results                         |
| M7        | Reference Unlock             | Passing submissions unlock reference artifacts                           |
| M8        | Observability and Operations | Errors, events, webhooks, jobs, and audit trails are visible             |
| M9        | Launch Hardening             | Accessibility, performance, security, and happy-path QA are launch-ready |

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

**Status:** Current

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

**Status:** Planned

**Goal:** make content as code reliable before building deeper learning flows.

**Build:**

- Velite content schemas.
- chapter metadata schema.
- lexicon and DSA schemas.
- MDX components for `Term`, code blocks, callouts, and layer wrappers.
- build-time validation for duplicate slugs, missing metadata, broken term links, and missing chapter references.
- typed content lookup helpers in `packages/content`.
- one complete chapter fixture.

**Exit Criteria:**

- Broken content references fail validation.
- The chapter page can load typed content without database queries.
- Standalone lexicon and DSA pages render from the same source as inline panels.

---

## M3 - Reading Experience

**Status:** Planned

**Goal:** make the core student reading loop feel real.

**Build:**

- chapter page layout.
- persistent progress/navigation shell.
- inline term buttons.
- accessible slide-over panel on desktop.
- mobile full-screen panel behavior.
- standalone lexicon and DSA pages.
- "Now build it" chapter transition.
- reading completion action.

**Exit Criteria:**

- A student can read one chapter without losing context.
- A term opens and closes without navigation or scroll loss.
- Keyboard and screen reader basics work for the term panel.
- The page respects the design system and content layer rules.

---

## M4 - Auth and Progress

**Status:** Planned

**Goal:** make student identity and progress durable.

**Build:**

- Auth.js v5 setup.
- magic link via Resend.
- GitHub OAuth.
- Drizzle adapter tables.
- database sessions.
- `proxy.ts` for coarse protected-route handling.
- progress state machine domain service.
- dashboard progress view.
- audit event on progress transitions.

**Exit Criteria:**

- A signed-in user can resume where they left off.
- Progress state transitions are controlled by domain code.
- Anonymous and signed-in routes behave intentionally.
- Progress rules are covered by domain tests once tests are available.

---

## M5 - Billing and Entitlements

**Status:** Planned

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

---

## M6 - CLI and Test Suite

**Status:** Planned

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

**Status:** Planned

**Goal:** make the "tests pass -> compare with reference" loop complete.

**Build:**

- private reference artifact storage.
- reference artifact manifest.
- signed reference download or rendered source route.
- entitlement and progress checks.
- reference viewed audit event.
- `unlocked -> complete` transition.
- dashboard reference access.

**Exit Criteria:**

- A student cannot access references before tests pass.
- A passing submission unlocks the correct chapter reference.
- Reference access is logged.
- Repeated access is idempotent and does not corrupt progress.

---

## M8 - Observability and Operations

**Status:** Planned

**Goal:** make production behavior inspectable before launch pressure arrives.

**Build:**

- Sentry setup.
- Vercel Analytics.
- structured learning events.
- API mutation logs with sensitive-field masking.
- webhook event log and replay notes.
- Inngest workflows for payment fulfillment, progress emails, cleanup, and content revalidation.
- operational dashboard or admin-only event views.
- alert thresholds documented.

**Exit Criteria:**

- Failed webhooks can be diagnosed.
- Failed background jobs can be retried.
- Sensitive values are not logged raw.
- A founder can answer what happened to a payment, submission, or reference unlock.

---

## M9 - Launch Hardening

**Status:** Planned

**Goal:** prepare the first public release.

**Build:**

- accessibility pass for chapter page, dashboard, term panel, billing, and CLI-token UI.
- Core Web Vitals pass.
- mobile reading pass.
- security review for auth, API keys, webhooks, and references.
- backup and restore notes.
- seed/demo data strategy.
- first end-to-end happy path.
- launch checklist.

**Exit Criteria:**

- One complete student path works: enroll, read, build, submit, unlock reference, resume dashboard.
- Critical docs match implementation.
- No known P0/P1 launch blockers remain.
- Rollback and support paths are documented.

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
2. Should reference implementations be downloadable, rendered in-browser, or both?
3. Should the first paid product be one-time purchase or subscription?
4. Should `packages/database` exist immediately, or should database code stay inside `apps/web` until reuse is real?
5. Should content search use static manifests first or database-backed indexing later?
