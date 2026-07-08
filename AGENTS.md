# Keelacademy Platform

An online school for software engineers. Novel-driven curriculum, 16 chapters, 4 interlocking layers per chapter (Novel, Build-Along, Lexicon, DSA).

## Stack

- Next.js 16 (App Router, RSC, TypeScript strict)
- Turso (libSQL/SQLite, embedded replicas via @tursodatabase/serverless)
- Drizzle ORM
- Auth.js v5 (magic link + GitHub OAuth, database sessions)
- Paddle (Merchant of Record, payments)
- Inngest (background jobs, event-driven)
- Upstash Redis (rate limiting, session cache)
- MDX + Velite (content pipeline)
- Tailwind CSS v4 + shadcn/ui (OKLCH tokens)
- Vercel (deployment)

## Commands

- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm lint` — eslint + tsc --noEmit
- `pnpm db:push` — push schema to Turso
- `pnpm db:studio` — open Drizzle Studio

## Architecture

App code uses a flat `app/` layout (no `src/`).

- `apps/web/app/` - Next.js App Router pages and route handlers
- `apps/web/app/globals.css` - design tokens (OKLCH); `apps/web/app/styles/` - typography, panel, code-theme CSS
- `apps/web/app/api/` - route handlers for external APIs and webhooks
- `apps/web/components/ui/` - shadcn-style primitives (never modify directly, extend via variants)
- `apps/web/components/` - app-specific components
- `apps/web/lib/` - domain services, db client (`lib/db/`), auth, env schema (`lib/env.ts`), helpers
- `apps/web/drizzle/` - generated SQL migrations (schema lives in `apps/web/lib/db/schema.ts`)
- `packages/content/` - Velite content pipeline: schemas + cross-ref validation (`velite.config.ts`),
  the MDX source (`content/` — chapters, build-alongs, lexicon, DSA), and typed lookup helpers.
  Consumed via `@keelacademy/content/collections` (generated data + types) and
  `@keelacademy/content/lookup` (helpers). Never import the generated `#velite` output directly from the app.
- `packages/ui/` - shared UI extensions (e.g. Wordmark)
- `packages/email/` - transactional email templates
- `packages/test-suite/` - chapter test suites
- `packages/cli/` - student CLI (`keel`)
- `packages/typescript-config/` - shared `tsconfig` bases
- `packages/eslint-config/` - shared ESLint config

MDX authoring: fenced code blocks are highlighted at build time by rehype-pretty-code (Shiki,
dual light/dark theme); custom components available in MDX are `Term`, `Callout`, and
`DSAComplexity` (registered in `apps/web/components/mdx-content.tsx`).

Deviations from the original design: config is split into `packages/typescript-config`
and `packages/eslint-config` (Turborepo convention) rather than a single `packages/config`;
Prettier is configured at the repo root (`.prettierrc.json`); Tailwind v4 is CSS-first
(tokens in `app/globals.css`, no config file).

## Conventions

- All colors via CSS variables (OKLCH). Never hardcode hex/rgb in components.
- Font stack: Newsreader (serif, novels), Geist Sans (UI), Geist Mono (code).
- shadcn components consume semantic tokens only (bg-background, text-foreground, etc).
- Content layers differentiated via data-layer attribute, not separate color systems.
- 2-space indent. No semicolons in TS. Single quotes.
- Prefer server components. Mark 'use client' only when necessary.
- External APIs and webhooks live in `apps/web/app/api/` route handlers. Use Inngest for anything async.
- Use `proxy.ts` for coarse request protection in Next.js 16; keep business authorization in server/domain code.
- Never use `any`. Strict TypeScript everywhere.
- Commit messages: conventional commits (feat:, fix:, chore:, docs:).

## Do this before any task

- Before starting any task i give you, make sure you read official docs or credible online sources. Always assume your training data is outdated.

## Do NOT

- Install Prisma (we use Drizzle)
- Use Pages Router (App Router only)
- Add Stripe (we use Paddle)
- Use HSL for colors (OKLCH only)
- Create barrel files (index.ts re-exports)
- Use default exports (named exports only)
