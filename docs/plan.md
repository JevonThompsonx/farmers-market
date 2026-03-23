# Farmers Market — Migration Plan

> **Status:** Planning phase — no code written yet.
> **Target stack:** Next.js (App Router) · Turso (LibSQL) · Drizzle ORM · Auth.js v5 · Tailwind CSS 4 · Cloudinary · Vercel · bun

---

## Project Snapshot

| Aspect | Current | Target |
|---|---|---|
| Framework | Express.js + EJS server-rendered templates | Next.js 15 App Router |
| Language | TypeScript (loose — `any`, `@ts-ignore`, `as`) | TypeScript `strict: true`, no `any`/`as`/`!` |
| Runtime | Node.js, `tsc -w` → `scripts/` | Node.js LTS via Next.js bundler |
| Database | MongoDB/Mongoose (Atlas) | Turso (LibSQL) via Drizzle ORM |
| Validation | Joi (server-side only) | Zod (shared client/server) |
| Auth | None — all CRUD is public | Auth.js v5 · GitHub OAuth · users in Turso |
| Frontend | EJS templates · Bootstrap 5 CDN | React (RSC-first) · Tailwind CSS 4 |
| Styling | Bootstrap 5 CDN + 13 lines custom CSS | Tailwind CSS 4 · design token system · dark/light theme |
| API Surface | Express route handlers (GET/POST, form submissions) | Next.js route handlers + Server Actions |
| Images | Bing/Unsplash auto-fetch via Mongoose pre-save | Auto-fetch service → convert to WebP → store on Cloudinary |
| Error Handling | `AppError` with `any` types, EJS error pages | `AppError` hierarchy (NotFound, Unauthorized, etc.) |
| Testing | None | Vitest (unit/integration) · Playwright (E2E) |
| CI/CD | None | GitHub Actions |
| Deployment | Single-stage Dockerfile | Vercel |
| Package Manager | pnpm | bun |
| Env Management | `dotenv`, credentials partially hardcoded | Zod-validated env vars · `.env.example` · no secrets in source |
| Logging | `console.log` only | Structured logger |
| SEO | None | Metadata API · JSON-LD · sitemap · robots.txt |

---

## Architecture Decisions (Resolved)

**Database — Turso (LibSQL)**
Turso runs SQLite-compatible LibSQL over HTTP/WebSockets, has a Vercel-native integration, and works with Drizzle ORM identically to PostgreSQL (same query builder, same migration tooling). You already have Drizzle + Turso experience from J²Adventures, so the adapter and client patterns are familiar. Vercel Postgres is an alternative but Turso is preferred here.
→ Drizzle adapter: `@libsql/client` + `drizzle-orm/libsql`

**Auth — Auth.js v5 + GitHub OAuth**
GitHub as the sole OAuth provider. Sessions and user records stored in Turso via the Drizzle adapter for Auth.js — no Supabase needed. Adding Supabase solely for user rows introduces a second database client, a second set of credentials, and a second failure point with no benefit when Turso handles it natively.
→ If you want row-level security or Postgres-native auth features later, Supabase becomes worth it. Not now.

**Images — Auto-fetch → WebP → Cloudinary**
The fetch-on-create pattern stays. The Mongoose pre-save hook becomes an explicit server-side service (`src/server/services/image.service.ts`). The service: fetches from Unsplash API (preferred over Bing scraping) → converts to WebP via `sharp` → uploads to Cloudinary. All stored URLs are WebP. A small CLI utility (`scripts/convert-to-webp.ts`) will be built for any batch conversion needs during seeding.

**Categories (replacing `fruit`, `vegetable`, `dairy`)**
```
vegetables | fruits | dairy-eggs | meat-poultry | herbs-spices
honey-preserves | baked-goods | flowers-plants | grains-legumes | beverages
```
Stored as a `category` enum in the Drizzle schema. Extensible — adding a new value is a schema migration.

**Search — LibSQL FTS5**
Turso supports SQLite FTS5 virtual tables. Full-text search on product name and description via a `products_fts` virtual table, synchronized by trigger. Replaces the current in-memory `.filter()` on the full product list.

**Deployment — Vercel**
All services land on Vercel: Next.js app, Turso DB (native Vercel integration), Cloudinary (external). No Docker needed. Multi-stage Dockerfile removed in Phase 9.

**Package Manager — bun**
Switch in Phase 2. `bun.lockb` replaces `pnpm-lock.yaml`. All CI scripts use `bun run`.

---

## Migration Phases

---

### Phase 1 — Security Triage & Cleanup

**Goal:** Remove hardcoded secrets and fix critical security issues in the existing Express app before any migration work begins.

**Backend tasks:**
- [ ] Move full MongoDB connection string to `MONGODB_URI` env var — remove `connectionString.ts` credentials
- [ ] Create `.env.example` documenting all required variables
- [ ] Verify `.env` is in `.gitignore`; if not, add it and purge from git history (`git filter-branch` or `git filter-repo`)
- [ ] Rotate the exposed MongoDB Atlas credentials (Atlas dashboard → Database Access → reset password)
- [ ] Convert all `DELETE` operations from `GET` to `POST`/`DELETE` HTTP methods (`/farms/:id/delete`, `/products/:id/delete`, review delete routes)
- [ ] Remove compiled `scripts/` directory from git tracking — add `scripts/` to `.gitignore`, run `git rm -r --cached scripts/`
- [ ] Fix `AppError` class: replace `any` with `number` for `status` property
- [ ] Remove `@ts-ignore` on `ejs-mate` import — add `declare module 'ejs-mate'` in `src/types/ejs-mate.d.ts`

**Frontend tasks:** None in this phase.

**Dependencies:** None — this is the starting point.

**Risk:** Credential rotation requires updating any active deployment using the old Atlas connection string. The `GET→POST` change for delete routes requires updating every EJS template that links to those routes — audit all `<a href="...delete">` links and convert to forms with `method="POST"`.

---

### Phase 2 — Project Scaffolding

**Goal:** Initialize the Next.js 15 App Router project with all tooling, Tailwind CSS 4, and base structure alongside the still-running Express app.

**Backend tasks:**
- [ ] Initialize Next.js 15 project: `bun create next-app@latest` with App Router, TypeScript, Tailwind, `src/` directory, `@/*` path alias
- [ ] Configure `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "exactOptionalPropertyTypes": true,
      "paths": { "@/*": ["./src/*"] }
    }
  }
  ```
- [ ] Set up Zod-validated env vars at `src/lib/env.ts` — parse `process.env` at startup, throw on missing required vars
- [ ] Set up structured logger at `src/lib/logger.ts` (use `pino` or `winston` — `pino` preferred for Vercel edge compatibility)
- [ ] Set up `AppError` hierarchy at `src/lib/errors.ts`: `AppError` → `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`
- [ ] Set up API error handler at `src/lib/api-handler.ts` — wraps route handlers, catches `AppError` subclasses, returns consistent `{ error, message, statusCode }` JSON shape
- [ ] Configure ESLint with zero-warnings policy (extend `next/core-web-vitals`, add `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unsafe-assignment`)
- [ ] Configure Prettier — `prettier.config.ts` with `tailwindcss` plugin
- [ ] Add `vitest.config.ts` and `playwright.config.ts` stubs
- [ ] Set up `package.json` scripts: `dev`, `build`, `start`, `lint`, `type-check`, `test`, `test:e2e`
- [ ] Pin all dependency versions (remove `^`)
- [ ] Switch package manager to bun — delete `pnpm-lock.yaml`, run `bun install`, commit `bun.lockb`

**Frontend tasks:**
- [ ] Configure Tailwind CSS 4 with `@import "tailwindcss"` in global CSS
- [ ] Define design token system in `src/app/globals.css` — CSS custom properties for color (brand, neutral, semantic), spacing scale, typography scale, radius
- [ ] Create `src/app/layout.tsx` with `next/font` (Geist or Inter), metadata defaults, and `<html lang="en">` with `suppressHydrationWarning` for theme toggle
- [ ] Create `src/app/error.tsx` and `src/app/not-found.tsx` error boundaries
- [ ] Create `src/lib/utils.ts` with `cn()` (clsx + tailwind-merge)
- [ ] Create layout components in `src/components/layout/`: `Header`, `Footer`, `Nav` — replaces EJS partials

**Dependencies:** Phase 1 complete.

**Risk:** Low — purely additive. The existing Express app continues running untouched.

---

### Phase 3 — Database & Schema (Turso + Drizzle)

**Goal:** Define the new schema in Turso via Drizzle ORM, implement the Data Access Layer, and build the image service and WebP converter.

**Backend tasks:**

**Turso setup:**
- [ ] Create Turso database — `turso db create farmers-market`
- [ ] Install Turso Vercel integration (automatic env injection for `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`)
- [ ] Install deps: `bun add drizzle-orm @libsql/client` + `bun add -d drizzle-kit`
- [ ] Create `drizzle.config.ts` pointing to `src/server/db/schema.ts`

**Schema design (`src/server/db/schema.ts`):**
```
users         — id (text PK), name, email, image, githubId, createdAt, updatedAt
farms         — id (text PK), name, city, state, description, email, website, image, ownerId (FK users), createdAt, updatedAt, deletedAt
products      — id (text PK), name, price, description, category (enum), image, farmId (FK farms), createdAt, updatedAt, deletedAt
reviews       — id (text PK), body, rating (1-5 CHECK), authorId (FK users), farmId (FK farms nullable), productId (FK products nullable), createdAt
products_fts  — FTS5 virtual table over (name, description) synced by trigger
```

- [ ] Categories enum: `vegetables | fruits | dairy-eggs | meat-poultry | herbs-spices | honey-preserves | baked-goods | flowers-plants | grains-legumes | beverages`
- [ ] Add indexes: `farmId` on products, `category` on products, `farmId`/`productId` on reviews
- [ ] Generate and apply initial migration: `bun drizzle-kit generate` → `bun drizzle-kit migrate`

**Data Access Layer (`src/server/queries/`):**
- [ ] `farms.ts` — `getFarms()`, `getFarmById()`, `createFarm()`, `updateFarm()`, `softDeleteFarm()`
- [ ] `products.ts` — `getProducts(filters)`, `getProductById()`, `getProductsByFarm()`, `getProductsByCategory()`, `searchProducts(query)`, `createProduct()`, `updateProduct()`, `softDeleteProduct()`
- [ ] `reviews.ts` — `getReviewsForFarm()`, `getReviewsForProduct()`, `createReview()`, `deleteReview()`
- [ ] All query files: `import 'server-only'` at top, explicit column selection (no `SELECT *`), return typed results

**Image service (`src/server/services/image.service.ts`):**
- [ ] Install: `bun add sharp cloudinary`
- [ ] `fetchAndStoreImage(query: string): Promise<string>` — fetches from Unsplash API (requires `UNSPLASH_ACCESS_KEY` env var), converts buffer to WebP via `sharp`, uploads to Cloudinary, returns CDN URL
- [ ] Build `scripts/convert-to-webp.ts` — batch CLI for converting any existing local images to WebP and uploading to Cloudinary during seed

**Seed script:**
- [ ] `src/server/db/seed.ts` — populates farms, products, reviews using DAL functions and image service; runs with `bun run db:seed`
- [ ] Data: 5–8 farms across multiple states, 3–5 products per farm spread across all 10 categories, 2–3 reviews per product

**Zod schemas (`src/schemas/`):**
- [ ] `farm.schema.ts` — `CreateFarmSchema`, `UpdateFarmSchema`
- [ ] `product.schema.ts` — `CreateProductSchema`, `UpdateProductSchema` (category validated against enum)
- [ ] `review.schema.ts` — `CreateReviewSchema` (rating: `z.number().int().min(1).max(5)`)

**Frontend tasks:** None.

**Dependencies:** Phase 2 complete. Unsplash API key and Cloudinary account required before running seed.

**Risk:** Medium. LibSQL FTS5 virtual tables require raw SQL for setup — not expressible in pure Drizzle schema syntax; use `db.run(sql\`...\`)` in a migration. Cloudinary upload adds external API dependency to seeding — stub with a local placeholder URL if Cloudinary isn't configured during early dev.

---

### Phase 4 — API Layer (Next.js Route Handlers)

**Goal:** Reimplement all Express routes as Next.js API route handlers with Zod validation, DAL calls, and consistent error handling. Replace in-memory search with FTS5.

**Backend tasks:**

Route structure under `src/app/api/`:
- [ ] `products/route.ts` — `GET` (list with `category`, `farmId`, `page`, `limit` query params) · `POST` (create, auth required)
- [ ] `products/[id]/route.ts` — `GET` (single) · `PATCH` (update, auth + ownership) · `DELETE` (soft delete, auth + ownership)
- [ ] `products/[id]/reviews/route.ts` — `POST` (create, auth required)
- [ ] `products/[id]/reviews/[reviewId]/route.ts` — `DELETE` (auth + ownership)
- [ ] `farms/route.ts` — `GET` (list) · `POST` (create, auth required)
- [ ] `farms/[id]/route.ts` — `GET` (single) · `PATCH` (update, auth + ownership) · `DELETE` (soft delete, auth + ownership)
- [ ] `farms/[id]/reviews/route.ts` — `POST` (create, auth required)
- [ ] `farms/[id]/reviews/[reviewId]/route.ts` — `DELETE` (auth + ownership)
- [ ] `search/route.ts` — `GET` with `q` param, delegates to `searchProducts()` DAL (FTS5 query)
- [ ] `categories/route.ts` — `GET` returns the enum list

**Every route handler must:**
- [ ] Parse and validate input with the corresponding Zod schema
- [ ] Delegate all DB access to DAL (no `db.` calls in route files directly)
- [ ] Return `{ data }` on success, `{ error, message, statusCode }` on failure
- [ ] Use `api-handler.ts` wrapper for error normalization
- [ ] Add rate limiting to all mutation endpoints (`upstash/ratelimit` or `@vercel/kv`-backed limiter)

**Frontend tasks:** None.

**Dependencies:** Phase 3 complete.

**Risk:** Medium — ensure full route parity with the Express app. The search endpoint is a behavioral change (FTS5 vs substring match) — verify result quality with seed data before proceeding to frontend.

---

### Phase 5 — Authentication & Authorization

**Goal:** Add GitHub OAuth via Auth.js v5. Protect all mutation routes. Store sessions and users in Turso.

**Backend tasks:**
- [ ] Install: `bun add next-auth@beta` + the Auth.js Drizzle adapter
- [ ] Create `src/lib/auth.ts` — configure GitHub provider, Drizzle adapter pointing at Turso, session strategy (`jwt` preferred for edge)
- [ ] Add Auth.js tables to Drizzle schema (`accounts`, `sessions`, `verificationTokens`) + migrate
- [ ] Create `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Add `middleware.ts` at project root — protect `/products/new`, `/products/[id]/edit`, `/farms/new`, `/farms/[id]/edit`, and all `POST`/`PATCH`/`DELETE` API routes
- [ ] Add ownership check helper `assertOwnership(userId, resourceOwnerId)` — throws `ForbiddenError` if mismatch
- [ ] Apply ownership checks in: farm update/delete, product update/delete, review delete

**Frontend tasks:**
- [ ] Create `src/app/auth/signin/page.tsx` — GitHub sign-in button, redirect back to previous page on success
- [ ] Add auth state to `Header` component — show user avatar + sign-out when authenticated, sign-in button when not
- [ ] Conditionally render edit/delete controls in product and farm detail pages based on session ownership

**Dependencies:** Phase 4 complete.

**Risk:** Medium. Auth.js v5 (`beta`) has breaking API changes from v4 — use the beta docs exclusively, not older tutorials. The Drizzle adapter for Auth.js with LibSQL requires testing; it's less documented than the Prisma adapter. Add `NEXTAUTH_SECRET` and `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` to `.env.example` and Vercel env config.

---

### Phase 6 — Frontend Rebuild

**Goal:** Replace all EJS templates with React Server Components and Client Components. Implement full UI per design token system.

**Frontend tasks:**

**Shared UI primitives (`src/components/ui/`):**
- [ ] `Button` — variants: `primary`, `secondary`, `destructive`, `ghost`; sizes: `sm`, `md`, `lg`; loading state
- [ ] `Card` — `CardHeader`, `CardBody`, `CardFooter`
- [ ] `Input`, `Textarea`, `Select`, `Label` — all with error state display
- [ ] `Badge` — for category labels
- [ ] `Rating` — star display component (read-only) + interactive version for review form
- [ ] `ImageWithFallback` — wraps `next/image`, shows placeholder on load error
- [ ] `ThemeToggle` — light/dark/system switcher

**Page components (Server Components by default):**
- [ ] `src/app/page.tsx` — hero + featured products grid + category quick-links
- [ ] `src/app/products/page.tsx` — full product listing with category filter tabs, pagination
- [ ] `src/app/products/[id]/page.tsx` — product detail, farm attribution, review list + `ReviewForm` (client)
- [ ] `src/app/products/new/page.tsx` — `"use client"` form, protected
- [ ] `src/app/products/[id]/edit/page.tsx` — `"use client"` form, protected + ownership check
- [ ] `src/app/categories/[category]/page.tsx` — filtered product grid, validates category against enum (404 on invalid)
- [ ] `src/app/farms/page.tsx` — farm listing grid
- [ ] `src/app/farms/[id]/page.tsx` — farm detail, products by farm, review list + `ReviewForm` (client)
- [ ] `src/app/farms/new/page.tsx` — `"use client"` form, protected
- [ ] `src/app/farms/[id]/edit/page.tsx` — `"use client"` form, protected + ownership check
- [ ] `src/app/search/page.tsx` — search bar (client), results grid (server, via `searchParams`)

**Data loading:**
- [ ] Use `<Suspense>` with skeleton fallbacks for product/farm grids and review lists
- [ ] Use `generateStaticParams` on `products/[id]` and `farms/[id]` for ISR
- [ ] All `next/image` usage: set `sizes`, `priority` on above-the-fold images, `quality={85}`, `format="webp"` (Cloudinary URLs already WebP)

**Forms:**
- [ ] Implement create/edit forms using Server Actions (`src/server/actions/`) — farm actions, product actions, review actions
- [ ] Use `useActionState` (React 19) for optimistic feedback and error display in client forms

**Accessibility:**
- [ ] Semantic HTML throughout (`<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`)
- [ ] All interactive elements keyboard-navigable with visible focus indicators
- [ ] All images have meaningful `alt` text (or `alt=""` for decorative)
- [ ] ARIA labels on icon-only buttons
- [ ] `prefers-reduced-motion` media query applied to any transitions/animations
- [ ] 4.5:1 contrast ratio on all text — verify with design tokens

**Responsive design:**
- [ ] Mobile-first throughout — test at 375px, 768px, 1280px, 1440px
- [ ] 44px minimum touch targets on all interactive elements

**Backend tasks:**
- [ ] Create Server Actions in `src/server/actions/`: `createFarm`, `updateFarm`, `deleteFarm`, `createProduct`, `updateProduct`, `deleteProduct`, `createReview`, `deleteReview`
- [ ] Configure `next.config.ts` security headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- [ ] Add Cloudinary domain to `next.config.ts` `images.remotePatterns`

**Dependencies:** Phases 4 and 5 complete.

**Risk:** Medium-high — largest phase by volume. Recommended split: implement layout/nav + home page first, verify theme toggle and design tokens, then build product pages, then farm pages, then all forms. Don't move to Phase 7 until all pages render correctly and auth gates work.

---

### Phase 7 — SEO & Metadata

**Goal:** Add technical SEO, structured data, and all metadata APIs.

**Frontend tasks:**
- [ ] Add `export const metadata: Metadata` to every page component — `title`, `description`, `openGraph` (title, description, image, url, type), `twitter` (card, title, description, image)
- [ ] Root layout metadata: `metadataBase` set to production Vercel URL
- [ ] `src/app/sitemap.ts` — dynamically generates entries for all farm and product pages via DAL queries
- [ ] `src/app/robots.ts` — disallow `/api/*`, allow everything else
- [ ] JSON-LD structured data:
  - `Product` schema on product detail pages (name, description, image, offers.price, aggregateRating)
  - `LocalBusiness` schema on farm detail pages (name, address, description)
  - `BreadcrumbList` schema on all nested pages
- [ ] Canonical URL (`<link rel="canonical">`) on all pages via metadata API
- [ ] Verify all product/farm images have descriptive `alt` text (not filenames)

**Backend tasks:** None.

**Dependencies:** Phase 6 complete (pages must exist before metadata is added).

**Risk:** Low.

---

### Phase 8 — Testing & CI/CD

**Goal:** Add test coverage and a fully automated GitHub Actions pipeline with deploy to Vercel.

**Backend tasks:**
- [ ] Unit tests (`src/__tests__/`):
  - All Zod schemas — valid input, invalid input, edge cases
  - `AppError` hierarchy — correct status codes, message propagation
  - Utility functions (`cn`, env parser)
  - Image service — mock `sharp` and Cloudinary, test transformation logic
- [ ] Integration tests — all API route handlers and Server Actions using Vitest + MSW or direct DAL mocks
- [ ] `ci.yml` (GitHub Actions):
  ```
  on: push (all branches), pull_request
  jobs: type-check → lint → test → build
  ```
- [ ] Security scanning in CI:
  - `gitleaks` — secrets scanning on every push
  - `trivy` — dependency vulnerability scan on PRs
  - `semgrep` — SAST scan on PRs

**Frontend tasks:**
- [ ] Component tests for all `src/components/ui/` primitives (Vitest + React Testing Library)
- [ ] E2E tests (Playwright):
  - [ ] Browse home page → click product → view detail
  - [ ] Filter products by category
  - [ ] Search for a product by name
  - [ ] Sign in with GitHub (mocked in test env)
  - [ ] Create a farm (authenticated)
  - [ ] Create a product on that farm (authenticated)
  - [ ] Submit a review (authenticated)
  - [ ] Edit the farm (authenticated, owner)
  - [ ] Delete the farm (authenticated, owner)
- [ ] `deploy.yml` (GitHub Actions):
  ```
  on: push to main
  jobs: (ci.yml jobs pass) → deploy to Vercel via Vercel CLI
  ```

**Dependencies:** Phases 6–7 complete.

**Risk:** Low — purely additive. GitHub OAuth in Playwright requires a test account or mocked session; set up a dedicated test GitHub app with a bot account.

---

### Phase 9 — Cleanup & Decommission

**Goal:** Remove all legacy Express/EJS code and finalize the migration.

**Backend tasks:**
- [ ] Remove `dev/` directory (Express TypeScript source)
- [ ] Remove `scripts/` directory (compiled JS output)
- [ ] Remove `views/` directory (EJS templates)
- [ ] Remove `css/` directory
- [ ] Remove `images/` directory — any needed static assets moved to `public/`
- [ ] Remove legacy `package.json` dependencies: `express`, `ejs`, `ejs-mate`, `mongoose`, `joi`, `axios`, `concurrently`, `nodemon`, `@types/express`, `@types/ejs`
- [ ] Remove old `.eslintrc.json` — replaced by new ESLint flat config
- [ ] Remove `Dockerfile` — Vercel deployment doesn't require it; archive on a `docker-deployment` branch if you want to keep it
- [ ] Update `README.md` — project overview, local dev setup (bun, Turso CLI, env vars), seed instructions, deployment notes

**Frontend tasks:**
- [ ] Run Lighthouse CI on all main page routes — target ≥ 90 Performance, ≥ 90 Accessibility, 100 Best Practices, ≥ 90 SEO
- [ ] Verify Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] Cross-browser test: Chrome, Firefox, Safari, Safari iOS, Chrome Android

**Dependencies:** All previous phases complete and verified on Vercel production.

**Risk:** Low if all phases are functional. Keep the pre-cleanup state on a `legacy/express` branch before deleting files.

---

## Env Vars Reference

Document these in `.env.example`:

```bash
# Turso
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Auth.js
NEXTAUTH_SECRET=
NEXTAUTH_URL=                    # http://localhost:3000 in dev
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Unsplash
UNSPLASH_ACCESS_KEY=

# Rate limiting (if using Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Phase Summary

| Phase | Focus | Risk | Blocking Dependency |
|---|---|---|---|
| 1 | Security triage | Low | None |
| 2 | Project scaffolding | Low | Phase 1 |
| 3 | Turso schema + DAL + image service | Medium | Phase 2 |
| 4 | API route handlers | Medium | Phase 3 |
| 5 | Auth.js + GitHub OAuth | Medium | Phase 4 |
| 6 | React frontend rebuild | Medium-High | Phases 4–5 |
| 7 | SEO + metadata | Low | Phase 6 |
| 8 | Tests + CI/CD | Low | Phases 6–7 |
| 9 | Cleanup + decommission | Low | All |

---

## Notes

- MongoDB Atlas data is not being migrated. The existing database is abandoned after Phase 1 credential rotation. Re-seeding from scratch in Phase 3.
- Auth.js v5 is still in beta as of this writing — pin the exact version in `package.json` and check the changelog before upgrading.
- The `products_fts` FTS5 virtual table cannot be expressed in Drizzle schema syntax — it must be created via raw SQL in a migration file (`db.run(sql\`CREATE VIRTUAL TABLE...\`)`).
- Do not open Phase 6 PRs until Phase 5 auth is verified end-to-end. Auth gates need to exist before building the UI that conditionally renders behind them.