# AGENTS.md

Guidance for AI coding agents working in this repository.

## Scope

This file applies to the entire repository.

## Read First

Before changing code, read these docs in order:

1. `docs/fullstack.md` (priority rules and engineering standards)
2. `docs/handoff.md` (current project status and pending work)
3. `docs/engineering-backend-architect.md` (backend expectations)
4. `docs/engineering-frontend-developer.md` (frontend expectations)

## Project Snapshot

- Stack: Next.js 15 App Router, TypeScript, Tailwind CSS 4, Drizzle ORM, Turso (LibSQL), Auth.js v5
- Testing: Vitest (unit/integration), Playwright (E2E)
- CI/CD: GitHub Actions (`ci.yml`, `security.yml`, `deploy.yml`)

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

- `bun run type-check`
- `bun run lint`
- `bun run test`
- `bun run test:e2e` (when behavior/UI flows are affected)
- `bun run build` (for release-critical or broad changes)

## Deployment Notes

Based on current handoff status:

- Ensure migrations are applied in non-local environments: `bun run db:migrate`
- Required deploy secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- Do not run deploy-dependent QA (Lighthouse/CWV/cross-browser on live URL) until deployment is confirmed

## Current Known Caveats

- `e2e/authenticated.spec.ts` uses a placeholder session token and needs a real signed JWT to pass.
- Legacy Express/EJS cleanup is pending; do not remove legacy assets/dependencies unless explicitly requested.

## Definition of Done

A task is complete when:

- Code changes meet the non-negotiable rules above
- Relevant tests/checks pass for the changed surface area
- Documentation is updated when behavior/process/status changed
- The final handoff clearly states what changed, why, and any follow-up actions
