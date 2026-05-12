# Farmers Market

Modern full-stack farmers market app built with Next.js, Turso, Drizzle, and Auth.js.

## Tech Stack

- `next@16` (App Router) + `react@19`
- TypeScript (`strict`) + Tailwind CSS 4
- Turso (LibSQL) + Drizzle ORM
- Auth.js v5 (GitHub OAuth)
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

Optional:

- `NEXTAUTH_URL` (recommended in production)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Local Setup

1. Install dependencies:

   `bun install`

2. Create local env file:

   `cp .env.example .env`

3. Fill `.env` with all required values listed above.

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
- `bun run lint` — ESLint (`--max-warnings 0`)
- `bun run type-check` — TypeScript `tsc --noEmit`
- `bun run test` — Vitest unit/integration tests
- `bun run test:watch` — Vitest watch mode
- `bun run test:e2e` — Playwright E2E tests
- `bun run db:generate` — Drizzle migration generation
- `bun run db:migrate` — apply Drizzle migrations
- `bun run db:seed` — seed farms/products/reviews

## Validation Workflow

Run targeted checks first, then broader checks:

1. `bun run type-check`
2. `bun run lint`
3. `bun run test`
4. `bun run test:e2e` (when UI flows/behavior are affected)
5. `bun run build` (release-critical or broad changes)

## CI/CD

- CI workflow: `.github/workflows/ci.yml`
  - Type check → lint → unit/integration tests → build
- Security workflow: `.github/workflows/security.yml`
  - Gitleaks + Trivy + Semgrep
- Deploy workflow: `.github/workflows/deploy.yml`
  - Auto deploys to Vercel after successful CI on `main` (or manual dispatch)

## Deployment Notes

Before first production deploy:

1. Set GitHub secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
2. Ensure production/staging env vars are configured.
3. Run `bun run db:migrate` in non-local target environments.

## Known Caveat

- `e2e/authenticated.spec.ts` uses a placeholder JWT and will fail until replaced with a real signed Auth.js session token.

## Key Paths

- `src/app` — routes, pages, metadata, sitemap/robots
- `src/server/queries` — data access layer
- `src/server/actions` — server mutations
- `src/server/db/schema.ts` — Drizzle schema + categories
- `src/schemas` — shared Zod schemas
- `src/lib/env.ts` — env validation
- `docs/handoff.md` — current project handoff and pending rollout tasks
