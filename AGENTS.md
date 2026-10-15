# AGENTS.md

Guidance for AI coding agents working in this repository.

## Scope

This file applies to the entire repository.

## Read First

Before changing code, read these docs in order:

1. `docs/fullstack.md` (priority rules and engineering standards)
2. `docs/handoff.md` (current project status and pending work)
3. `docs/plan.md` (migration plan and phase history)
4. `docs/engineering-backend-architect.md` (backend expectations)
5. `docs/engineering-frontend-developer.md` (frontend expectations)
6. `docs/engineering-security-engineer.md` (security expectations)
7. `MODERNIZATION_TODO.md` (modernization backlog and wave status)

Note: `docs/prompt.md` is an unrelated prompt-engineering ruleset (PowerShell/RMM) that does not describe this repo. Do not apply it here.

## Project Snapshot

- Stack: Next.js 16 App Router, TypeScript, Tailwind CSS 4, Drizzle ORM, Turso (LibSQL), Auth.js v4 (next-auth 4.24.15)
- Package manager: `bun` (lockfile `bun.lock` committed); Node 20 per `.nvmrc`
- Testing: Vitest (unit/integration), Playwright (E2E)
- CI/CD: GitHub Actions (`ci.yml`, `security.yml`, `deploy.yml`) — `ci.yml` also enforces `format:check`

## Non-Negotiable Rules

These are adapted from `docs/fullstack.md` priority rules.

1. Keep TypeScript strict. Avoid `any`, unsafe assertions, and non-null assertions.
2. Never trust client input. Validate on the server at every trust boundary with Zod.
3. Every Server Action/API mutation must enforce auth + authorization + validation.
4. Do not hardcode secrets. Use environment variables validated in `src/lib/env.ts`.
5. Prefer Server Components. Use `"use client"` only when interactivity/browser APIs are required.
6. Keep DB access in the Data Access Layer (`src/server/queries/*`) with server-only boundaries.
7. Use structured error handling (`src/lib/errors.ts`, `src/lib/api-handler.ts`) and avoid leaking internals.
8. Migrations are append-only and idempotent. Never edit an already-applied migration.
9. Pin dependency versions and keep lockfile changes intentional.

## Implementation Conventions

- Follow the existing structure under `src/app`, `src/components`, `src/server`, `src/schemas`, and `src/lib`.
- Prefer minimal, targeted changes over broad refactors unless explicitly requested.
- Preserve accessibility and responsive behavior (WCAG 2.1 AA targets from docs).
- Consider security, performance, and SEO impacts for all user-facing changes.

## Required Workflow

1. Understand scope and identify affected files before editing.
2. Implement with security-first + validation-first approach.
3. Keep docs in sync for meaningful changes:
   - Update `docs/handoff.md` with a concise summary of completed work.
4. Validate locally (targeted first, then broader checks as needed).

## Validation Commands

Run the smallest relevant checks first, then broader checks:

- `bun run format:check`
- `bun run type-check`
- `bun run lint`
- `bun run test`
- `bun run test:e2e` (when behavior/UI flows are affected)
- `bun run build` (for release-critical or broad changes)

## Deployment Notes

Production deploy is live at `https://farmers-market-alpha.vercel.app` (see `docs/handoff.md`, 2026-09-09). Remaining rollout work:

- Ensure migrations are applied in non-local environments, including production Turso: `bun run db:migrate`
- Required deploy secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Set `NEXT_PUBLIC_SITE_URL` on Vercel (production + preview) — `src/lib/site-url.ts` derives sitemap/robots/JSON-LD URLs from it
- Deploy-dependent QA (Lighthouse/CWV/cross-browser on the live URL) is still queued in `docs/handoff.md`

## Gotchas

- API mutation routes are **not** gated by `middleware.ts` (its matcher excludes `api/auth`, and auth is enforced inside each handler). Never rely on middleware to protect an endpoint.
- `.env.local` is the local env file. No `.env.example` is committed, so onboard others by copying the variable list from `README.md`.
- E2E auth tests need a real signed JWT in the `next-auth.session-token` cookie — see `docs/handoff.md`.
- In-memory rate limiting is per-instance; treat Upstash as required for meaningful protection on serverless.
- `playwright-report/` and `test-results/` are generated artifacts; they are tracked in git, so do not assume a clean `git status` means no test output changed.

## Current Known Caveats

- `e2e/authenticated.spec.ts` uses a placeholder session token and needs a real signed JWT to pass.
- Legacy Express/EJS cleanup is complete (`dev/`, `scripts/`, `views/`, `css/`, `images/`, `.eslintrc.json`, and `Dockerfile` were removed). Do not add back legacy assets.

## Definition of Done

A task is complete when:

- Code changes meet the non-negotiable rules above
- Relevant tests/checks pass for the changed surface area
- Documentation is updated when behavior/process/status changed
- The final handoff clearly states what changed, why, and any follow-up actions
