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

- `apps/web/src/app/` - Next.js App Router pages and route handlers
- `apps/web/src/components/ui/` - shadcn components (never modify directly, extend via variants)
- `apps/web/src/components/` - app-specific components
- `apps/web/src/lib/` - domain services, db client, auth, API helpers
- `apps/web/src/styles/` - globals.css (tokens), typography.css
- `apps/web/content/` - MDX chapters, lexicon, DSA entries
- `apps/web/drizzle/` - schema and migrations
- `packages/ui/` - shared UI extensions
- `packages/email/` - transactional email templates
- `packages/content/` - content schemas and validation helpers
- `packages/test-suite/` - chapter test suites
- `packages/cli/` - student CLI
- `packages/config/` - shared TypeScript, lint, Tailwind, and formatting config

## Conventions

- All colors via CSS variables (OKLCH). Never hardcode hex/rgb in components.
- Font stack: Newsreader (serif, novels), Geist Sans (UI), Geist Mono (code).
- shadcn components consume semantic tokens only (bg-background, text-foreground, etc).
- Content layers differentiated via data-layer attribute, not separate color systems.
- 2-space indent. No semicolons in TS. Single quotes.
- Prefer server components. Mark 'use client' only when necessary.
- External APIs and webhooks live in `apps/web/src/app/api/` route handlers. Use Inngest for anything async.
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
