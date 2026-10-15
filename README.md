# Farmers Market

Modern full-stack farmers market app built with Next.js, Turso, Drizzle, and Auth.js.

## Tech Stack

- `next@16` (App Router) + `react@19`
- TypeScript (`strict`) + Tailwind CSS 4
- Turso (LibSQL) + Drizzle ORM
- Auth.js v4 (next-auth 4.24.15) (GitHub OAuth)
- Cloudinary + Unsplash integration for product/farm imagery
- Vitest (unit/integration) + Playwright (E2E)

## Current Status

- Migration phases 1–8 are complete in-repo.
- Legacy Express/EJS cleanup is complete.
- Remaining work is deployment rollout and deploy-dependent browser QA on live Vercel.

## Features

- Farm and product listings with detail pages
- Category filtering and full-text search
- Review creation/deletion with ownership checks
- Authenticated mutations with Auth.js + route/action authorization
- Zod validation at trust boundaries
- Security headers, structured error handling, and mutation rate limiting
- JSON-LD, sitemap, robots.txt, and metadata coverage

## Prerequisites

- `bun` (package manager/runtime)
- Node.js 20 (pinned by `.nvmrc` / `.tool-versions`)
- Turso database + credentials
- GitHub OAuth app credentials
- Cloudinary account credentials
- Unsplash API access key

Optional (production/distributed rate limiting):

- Upstash Redis REST credentials

## Environment Variables

Required by runtime (`src/lib/env.ts`):

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `NEXTAUTH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `UNSPLASH_ACCESS_KEY`

Recommended:

- `NEXTAUTH_URL` (recommended in production)
- `NEXT_PUBLIC_SITE_URL` — canonical public origin consumed by `src/lib/site-url.ts` for `sitemap.ts`, `robots.ts`, and JSON-LD breadcrumb URLs. Falls back to `https://farmers-market-alpha.vercel.app` when unset.

Optional:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

`NODE_ENV` defaults to `development` and is not set manually in normal use.

## Local Setup

1. Install dependencies:

   `bun install`

2. Create local env file:

   No `.env.example` is committed (see `MODERNIZATION_TODO.md`), so create `.env.local` by hand and paste in every required variable listed above. Next.js auto-loads `.env.local`; `.env` is not used in this repo.

3. Fill `.env.local` with all required values listed above.

4. Create/configure Turso DB (if you do not already have one):
   - `turso db create farmers-market`
   - `turso db show farmers-market --url`
   - `turso db tokens create farmers-market`

5. Apply database migrations:

   `bun run db:migrate`

6. Seed sample data:

   `bun run db:seed`

7. Start development server:

   `bun run dev`

Open `http://localhost:3000`.

## Scripts

- `bun run dev` — start Next.js dev server
- `bun run build` — production build
- `bun run start` — start production server
- `bun run lint` — ESLint (`--max-warnings 0`, scoped to `src`)
- `bun run type-check` — TypeScript `tsc --noEmit`
- `bun run format` — Prettier write
- `bun run format:check` — Prettier check (enforced in CI)
- `bun run test` — Vitest unit/integration tests
- `bun run test:watch` — Vitest watch mode
- `bun run test:e2e` — Playwright E2E tests (note: `e2e/authenticated.spec.ts` uses a placeholder session token and needs a real signed JWT to pass — see `docs/handoff.md`)
- `bun run db:generate` — Drizzle migration generation
- `bun run db:migrate` — apply Drizzle migrations
- `bun run db:seed` — seed farms/products/reviews

## Validation Workflow

Run targeted checks first, then broader checks:

1. `bun run format:check`
2. `bun run type-check`
3. `bun run lint`
4. `bun run test`
5. `bun run test:e2e` (when UI flows/behavior are affected)
6. `bun run build` (release-critical or broad changes)

## Documentation

- `AGENTS.md` — agent-facing rules, conventions, and validation commands
- `docs/README.md` — index of everything under `docs/`
- `docs/handoff.md` — current project status and pending rollout work
- `docs/plan.md` — migration plan and phase history
- `docs/fullstack.md` — engineering standards and priority rules
- `MODERNIZATION_TODO.md` — modernization audit backlog and wave status

## CI/CD

- CI workflow: `.github/workflows/ci.yml`
  - Format check → type check → lint → unit/integration tests → build
  - Pins bun `1.4.0` via `oven-sh/setup-bun@v2`
- Security workflow: `.github/workflows/security.yml`
  - Gitleaks + Trivy + Semgrep
- Deploy workflow: `.github/workflows/deploy.yml`
  - Auto deploys to Vercel after successful CI on `main` (or manual dispatch)

## Deployment Notes

Production deploy is live (`https://farmers-market-alpha.vercel.app`, see `docs/handoff.md`). Remaining rollout work:

1. Ensure GitHub repository secrets are set: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
2. Ensure production/staging env vars are configured (including `NEXT_PUBLIC_SITE_URL`).
3. Run `bun run db:migrate` against the production Turso DB so `products_fts` and its triggers are active outside local.

## Known Caveats

- `e2e/authenticated.spec.ts` uses a placeholder JWT (`"mock-session-token"`) and will fail until replaced with a real signed Auth.js session token. See `docs/handoff.md` for the generation snippet.
- In-memory rate-limit fallback (`src/lib/rate-limit.ts`) is per-instance and resets on cold start, so it provides no real protection on serverless unless `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are configured.

## Key Paths

- `src/app` — routes, pages, metadata, sitemap/robots
- `src/components` — `layout/` (Header/Nav/Footer) and `ui/` primitives
- `src/server/queries` — data access layer
- `src/server/actions` — server mutations
- `src/server/db/schema.ts` — Drizzle schema + categories
- `src/server/db/migrations/` — append-only Drizzle SQL migrations (`0000_*`, `0001_products_fts`)
- `src/schemas` — shared Zod schemas
- `src/lib/env.ts` — env validation
- `src/lib/site-url.ts` — canonical public origin (sitemap/robots/JSON-LD)
- `src/lib/rate-limit.ts` — mutation rate limiting (Upstash + in-memory fallback)
- `middleware.ts` — auth gate for create/edit routes (does **not** gate `/api/*`)
- `drizzle.config.ts` — points at `./src/server/db/schema.ts` / `./src/server/db/migrations`
- `e2e/` — Playwright specs
- `docs/handoff.md` — current project handoff and pending rollout tasks
