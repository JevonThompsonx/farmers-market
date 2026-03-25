# Farmers Market

## Project Overview
Next.js 15 App Router + Turso (LibSQL) + Drizzle ORM + Auth.js v5 + Tailwind CSS 4 + Cloudinary. Fresh local produce from your community.

## Prerequisites
- bun
- Turso CLI (`brew install tursodatabase/tap/turso`)

## Local Setup
1. `bun install`
2. `cp .env.example .env` and fill in values
3. `turso db create farmers-market`
4. `bun run db:migrate`
5. `bun run db:seed`
6. `bun dev`

## Available Scripts
- `dev`: Start development server
- `build`: Build the production application
- `start`: Start production server
- `lint`: Run ESLint
- `type-check`: Run TypeScript compiler check
- `test`: Run unit and integration tests (Vitest)
- `test:e2e`: Run end-to-end tests (Playwright)
- `db:generate`: Generate migrations from schema
- `db:migrate`: Apply migrations to database
- `db:seed`: Seed database with sample data

## Deployment
Vercel with Turso native integration. Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` via Vercel dashboard or `vercel env pull`.
