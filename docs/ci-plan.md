# CI Plan

## Status

Active. The first automated pipeline lives at `.github/workflows/ci.yml`. This
document explains what it does, why, and how it grows across milestones.

## Goal

Keep `main` always green: every pull request and every push to `main` must pass
lint, type-check, and a production build before it can be trusted. CI mirrors the
exact commands a developer runs locally, so "works on my machine" and "passes CI"
mean the same thing.

## Pipeline (current)

Single job, `verify`, on `ubuntu-latest`:

1. `actions/checkout@v7`
2. `pnpm/action-setup@v6` — pnpm version comes from `package.json#packageManager`.
3. `actions/setup-node@v6` — Node 20, with pnpm store caching.
4. `pnpm install --frozen-lockfile` — fails if `pnpm-lock.yaml` is out of date.
5. `pnpm lint` → `turbo run lint` (eslint, `--max-warnings 0`).
6. `pnpm check-types` → `turbo run check-types` (velite + `next typegen` + `tsc --noEmit`).
7. `pnpm build` → `turbo run build` (velite + `next build`), which also runs
   **build-time environment validation** via `apps/web/lib/env.ts`.

Each root script fans out through Turborepo, so package tasks run in dependency
order (`^build`) and reuse Turbo's local cache. Concurrency is set so a newer push
cancels the in-flight run for the same ref.

## Secrets

The build step sets throwaway values for `AUTH_SECRET` / `AUTH_TRUST_HOST` /
`TURSO_DATABASE_URL`. These are **not** real secrets — CI proves the app compiles
and the env contract is enforced, not that it can reach a live database. Pages that
touch the DB are dynamic (they call `auth()`), so no query runs during the build.

## Roadmap

- **M2–M3:** enable the `test` task in Turbo and add a `pnpm test` step once the
  first suites exist. Make it a required check.
- **M4–M5:** add a migrations/`db:push` dry-run against an ephemeral libSQL file;
  keep real Turso/Paddle secrets in GitHub Environments, not in the workflow.
- **M8:** upload build artifacts / coverage; wire Turbo Remote Cache to share the
  cache between CI and local, cutting build time.
- **M9:** add an accessibility + Lighthouse budget gate on the reading pages.

## Conventions

- CI runs the same `pnpm` scripts that exist locally — never bespoke inline steps.
- Action versions are pinned to a major tag and bumped deliberately (Dependabot
  can automate this later).
- A red build blocks merge. Do not merge around a failing required check.
