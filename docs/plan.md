# Farmers Market — Migration Plan

> **Status:** Phase 6 complete — frontend rebuild done. Phases 7–9 remaining.
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

## AI Assignment Key

| Icon | Model | Use for | Notes |
|---|---|---|---|
| 🟡 | Gemini Flash 2.0 | Repetitive frontend tasks, boilerplate, metadata, component tests, README | Primary Gemini model — give it explicit file paths, import names, and output structure to avoid mistakes |
| 🟠 | Gemini Pro 3.1 | Visual/browser tasks — Lighthouse, responsive testing, contrast audits, cross-browser | Use Antigravity app's browser access for live page inspection |
| *(unmarked)* | Claude | Backend logic, server actions, JSON-LD, CI/CD, destructive cleanup, integration tests | Complex logic, multi-file reasoning, security-sensitive work |

**Flash optimization tips:** Each Flash task is self-contained with exact file paths, import names, and expected output shape. Batch related tasks (e.g., all metadata exports) into a single prompt. Avoid giving Flash tasks that require cross-file reasoning or understanding auth/DB internals.

---

## Migration Phases

---

### Phase 1 — Security Triage & Cleanup ✅

**Goal:** Remove hardcoded secrets and fix critical security issues in the existing Express app before any migration work begins.

**Backend tasks:**
- [x] Move full MongoDB connection string to `MONGODB_URI` env var — remove `connectionString.ts` credentials
- [x] Create `.env.example` documenting all required variables
- [x] Verify `.env` is in `.gitignore`; if not, add it and purge from git history (`git filter-branch` or `git filter-repo`)
- [x] Rotate the exposed MongoDB Atlas credentials (Atlas dashboard → Database Access → reset password)
- [x] Convert all `DELETE` operations from `GET` to `POST`/`DELETE` HTTP methods (`/farms/:id/delete`, `/products/:id/delete`, review delete routes)
- [x] Remove compiled `scripts/` directory from git tracking — add `scripts/` to `.gitignore`, run `git rm -r --cached scripts/`
- [x] Fix `AppError` class: replace `any` with `number` for `status` property
- [x] Remove `@ts-ignore` on `ejs-mate` import — add `declare module 'ejs-mate'` in `src/types/ejs-mate.d.ts`

**Frontend tasks:** None in this phase.

**Dependencies:** None — this is the starting point.

**Risk:** Credential rotation requires updating any active deployment using the old Atlas connection string. The `GET→POST` change for delete routes requires updating every EJS template that links to those routes — audit all `<a href="...delete">` links and convert to forms with `method="POST"`.

---

### Phase 2 — Project Scaffolding ✅

**Goal:** Initialize the Next.js 15 App Router project with all tooling, Tailwind CSS 4, and base structure alongside the still-running Express app.

**Backend tasks:**
- [x] Initialize Next.js 15 project: `bun create next-app@latest` with App Router, TypeScript, Tailwind, `src/` directory, `@/*` path alias
- [x] Configure `tsconfig.json`:
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
- [x] Set up Zod-validated env vars at `src/lib/env.ts` — parse `process.env` at startup, throw on missing required vars
- [x] Set up structured logger at `src/lib/logger.ts` (use `pino` or `winston` — `pino` preferred for Vercel edge compatibility)
- [x] Set up `AppError` hierarchy at `src/lib/errors.ts`: `AppError` → `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`
- [x] Set up API error handler at `src/lib/api-handler.ts` — wraps route handlers, catches `AppError` subclasses, returns consistent `{ error, message, statusCode }` JSON shape
- [x] Configure ESLint with zero-warnings policy (extend `next/core-web-vitals`, add `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unsafe-assignment`)
- [x] Configure Prettier — `prettier.config.ts` with `tailwindcss` plugin
- [x] Add `vitest.config.ts` and `playwright.config.ts` stubs
- [x] Set up `package.json` scripts: `dev`, `build`, `start`, `lint`, `type-check`, `test`, `test:e2e`
- [x] Pin all dependency versions (remove `^`)
- [x] Switch package manager to bun — delete `pnpm-lock.yaml`, run `bun install`, commit `bun.lockb`

**Frontend tasks:**
- [x] Configure Tailwind CSS 4 with `@import "tailwindcss"` in global CSS
- [x] Define design token system in `src/app/globals.css` — CSS custom properties for color (brand, neutral, semantic), spacing scale, typography scale, radius
- [x] Create `src/app/layout.tsx` with `next/font` (Geist or Inter), metadata defaults, and `<html lang="en">` with `suppressHydrationWarning` for theme toggle
- [x] Create `src/app/error.tsx` and `src/app/not-found.tsx` error boundaries
- [x] Create `src/lib/utils.ts` with `cn()` (clsx + tailwind-merge)
- [x] Create layout components in `src/components/layout/`: `Header`, `Footer`, `Nav` — replaces EJS partials

**Dependencies:** Phase 1 complete.

**Risk:** Low — purely additive. The existing Express app continues running untouched.

---

### Phase 3 — Database & Schema (Turso + Drizzle) ✅

**Goal:** Define the new schema in Turso via Drizzle ORM, implement the Data Access Layer, and build the image service and WebP converter.

**Backend tasks:**

**Turso setup:**
- [x] Create Turso database — `turso db create farmers-market`
- [x] Install Turso Vercel integration (automatic env injection for `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`)
- [x] Install deps: `bun add drizzle-orm @libsql/client` + `bun add -d drizzle-kit`
- [x] Create `drizzle.config.ts` pointing to `src/server/db/schema.ts`

**Schema design (`src/server/db/schema.ts`):**
```
users         — id (text PK), name, email, image, githubId, createdAt, updatedAt
farms         — id (text PK), name, city, state, description, email, website, image, ownerId (FK users), createdAt, updatedAt, deletedAt
products      — id (text PK), name, price, description, category (enum), image, farmId (FK farms), createdAt, updatedAt, deletedAt
reviews       — id (text PK), body, rating (1-5 CHECK), authorId (FK users), farmId (FK farms nullable), productId (FK products nullable), createdAt
products_fts  — FTS5 virtual table over (name, description) synced by trigger
```

- [x] Categories enum: `vegetables | fruits | dairy-eggs | meat-poultry | herbs-spices | honey-preserves | baked-goods | flowers-plants | grains-legumes | beverages`
- [x] Add indexes: `farmId` on products, `category` on products, `farmId`/`productId` on reviews
- [x] Generate and apply initial migration: `bun drizzle-kit generate` → `bun drizzle-kit migrate`

**Data Access Layer (`src/server/queries/`):**
- [x] `farms.ts` — `getFarms()`, `getFarmById()`, `createFarm()`, `updateFarm()`, `softDeleteFarm()`
- [x] `products.ts` — `getProducts(filters)`, `getProductById()`, `getProductsByFarm()`, `getProductsByCategory()`, `searchProducts(query)`, `createProduct()`, `updateProduct()`, `softDeleteProduct()`
- [x] `reviews.ts` — `getReviewsForFarm()`, `getReviewsForProduct()`, `createReview()`, `deleteReview()`
- [x] All query files: `import 'server-only'` at top, explicit column selection (no `SELECT *`), return typed results

**Image service (`src/server/services/image.service.ts`):**
- [x] Install: `bun add sharp cloudinary`
- [x] `fetchAndStoreImage(query: string): Promise<string>` — fetches from Unsplash API (requires `UNSPLASH_ACCESS_KEY` env var), converts buffer to WebP via `sharp`, uploads to Cloudinary, returns CDN URL
- [x] Build `scripts/convert-to-webp.ts` — batch CLI for converting any existing local images to WebP and uploading to Cloudinary during seed

**Seed script:**
- [x] `src/server/db/seed.ts` — populates farms, products, reviews using DAL functions and image service; runs with `bun run db:seed`
- [x] Data: 5–8 farms across multiple states, 3–5 products per farm spread across all 10 categories, 2–3 reviews per product

**Zod schemas (`src/schemas/`):**
- [x] `farm.schema.ts` — `CreateFarmSchema`, `UpdateFarmSchema`
- [x] `product.schema.ts` — `CreateProductSchema`, `UpdateProductSchema` (category validated against enum)
- [x] `review.schema.ts` — `CreateReviewSchema` (rating: `z.number().int().min(1).max(5)`)

**Frontend tasks:** None.

**Dependencies:** Phase 2 complete. Unsplash API key and Cloudinary account required before running seed.

**Risk:** Medium. LibSQL FTS5 virtual tables require raw SQL for setup — not expressible in pure Drizzle schema syntax; use `db.run(sql\`...\`)` in a migration. Cloudinary upload adds external API dependency to seeding — stub with a local placeholder URL if Cloudinary isn't configured during early dev.

---

### Phase 4 — API Layer (Next.js Route Handlers) ✅

**Goal:** Reimplement all Express routes as Next.js API route handlers with Zod validation, DAL calls, and consistent error handling. Replace in-memory search with FTS5.

**Backend tasks:**

Route structure under `src/app/api/`:
- [x] `products/route.ts` — `GET` (list with `category`, `farmId`, `page`, `limit` query params) · `POST` (create, auth required)
- [x] `products/[id]/route.ts` — `GET` (single) · `PATCH` (update, auth + ownership) · `DELETE` (soft delete, auth + ownership)
- [x] `products/[id]/reviews/route.ts` — `POST` (create, auth required)
- [x] `products/[id]/reviews/[reviewId]/route.ts` — `DELETE` (auth + ownership)
- [x] `farms/route.ts` — `GET` (list) · `POST` (create, auth required)
- [x] `farms/[id]/route.ts` — `GET` (single) · `PATCH` (update, auth + ownership) · `DELETE` (soft delete, auth + ownership)
- [x] `farms/[id]/reviews/route.ts` — `POST` (create, auth required)
- [x] `farms/[id]/reviews/[reviewId]/route.ts` — `DELETE` (auth + ownership)
- [x] `search/route.ts` — `GET` with `q` param, delegates to `searchProducts()` DAL (FTS5 query)
- [x] `categories/route.ts` — `GET` returns the enum list

**Every route handler must:**
- [x] Parse and validate input with the corresponding Zod schema
- [x] Delegate all DB access to DAL (no `db.` calls in route files directly)
- [x] Return `{ data }` on success, `{ error, message, statusCode }` on failure
- [x] Use `api-handler.ts` wrapper for error normalization
- [ ] Add rate limiting to all mutation endpoints (`upstash/ratelimit` or `@vercel/kv`-backed limiter)

**Frontend tasks:** None.

**Dependencies:** Phase 3 complete.

**Risk:** Medium — ensure full route parity with the Express app. The search endpoint is a behavioral change (FTS5 vs substring match) — verify result quality with seed data before proceeding to frontend.

---

### Phase 5 — Authentication & Authorization ✅

**Goal:** Add GitHub OAuth via Auth.js v5. Protect all mutation routes. Store sessions and users in Turso.

**Backend tasks:**
- [x] Install: `bun add next-auth@beta` + the Auth.js Drizzle adapter
- [x] Create `src/lib/auth.ts` — configure GitHub provider, Drizzle adapter pointing at Turso, session strategy (`jwt` preferred for edge)
- [x] Add Auth.js tables to Drizzle schema (`accounts`, `sessions`, `verificationTokens`) + migrate
- [x] Create `src/app/api/auth/[...nextauth]/route.ts`
- [x] Add `middleware.ts` at project root — protect `/products/new`, `/products/[id]/edit`, `/farms/new`, `/farms/[id]/edit`, and all `POST`/`PATCH`/`DELETE` API routes
- [x] Add ownership check helper `assertOwnership(userId, resourceOwnerId)` — throws `ForbiddenError` if mismatch
- [x] Apply ownership checks in: farm update/delete, product update/delete, review delete

**Frontend tasks:**
- [x] Create `src/app/auth/signin/page.tsx` — GitHub sign-in button, redirect back to previous page on success
- [x] Add auth state to `Header` component — show user avatar + sign-out when authenticated, sign-in button when not
- [x] Conditionally render edit/delete controls in product and farm detail pages based on session ownership

**Dependencies:** Phase 4 complete.

**Risk:** Medium. Auth.js v5 (`beta`) has breaking API changes from v4 — use the beta docs exclusively, not older tutorials. The Drizzle adapter for Auth.js with LibSQL requires testing; it's less documented than the Prisma adapter. Add `NEXTAUTH_SECRET` and `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` to `.env.example` and Vercel env config.

---

### Phase 6 — Frontend Rebuild ✅

**Goal:** Replace all EJS templates with React Server Components and Client Components. Implement full UI per design token system.

**Frontend tasks:**

**Shared UI primitives (`src/components/ui/`):**
- [x] `Button` — variants: `primary`, `secondary`, `destructive`, `ghost`; sizes: `sm`, `md`, `lg`; loading state
- [x] `Card` — `CardHeader`, `CardBody`, `CardFooter`
- [x] `Input`, `Textarea`, `Select`, `Label` — all with error state display
- [x] `Badge` — for category labels
- [x] `Rating` — star display component (read-only) + interactive version for review form (`RatingInput`)
- [x] `ImageWithFallback` — wraps `next/image`, shows placeholder on load error
- [x] `ThemeToggle` — light/dark/system switcher

**Page components (Server Components by default):**
- [x] `src/app/page.tsx` — hero + featured products grid + category quick-links
- [x] `src/app/products/page.tsx` — full product listing with category filter tabs, pagination
- [x] `src/app/products/[id]/page.tsx` — product detail, farm attribution, review list + `ReviewForm` (client)
- [x] `src/app/products/new/page.tsx` — `"use client"` form, protected
- [x] `src/app/products/[id]/edit/page.tsx` — `"use client"` form, protected + ownership check
- [x] `src/app/categories/[category]/page.tsx` — filtered product grid, validates category against enum (404 on invalid)
- [x] `src/app/farms/page.tsx` — farm listing grid
- [x] `src/app/farms/[id]/page.tsx` — farm detail, products by farm, review list + `ReviewForm` (client)
- [x] `src/app/farms/new/page.tsx` — `"use client"` form, protected
- [x] `src/app/farms/[id]/edit/page.tsx` — `"use client"` form, protected + ownership check
- [x] `src/app/search/page.tsx` — search bar (client), results grid (server, via `searchParams`)

**Data loading:**
- [x] Use `<Suspense>` with skeleton fallbacks for product/farm grids and review lists
- [ ] **Claude:** Use `generateStaticParams` on `products/[id]` and `farms/[id]` for ISR — export async function in each `page.tsx` that calls the DAL to return all IDs
- [x] All `next/image` usage: set `sizes`, `priority` on above-the-fold images, `quality={85}`, `format="webp"` (Cloudinary URLs already WebP)

**Forms:**
- [x] Implement create/edit forms using Server Actions (`src/server/actions/`) — farm actions, product actions, review actions
- [x] Use `useActionState` (React 19) for optimistic feedback and error display in client forms

**Accessibility:**
- [x] Semantic HTML throughout (`<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`)
- [x] All interactive elements keyboard-navigable with visible focus indicators
- [x] All images have meaningful `alt` text (or `alt=""` for decorative)
- [x] ARIA labels on icon-only buttons
- [x] `prefers-reduced-motion` media query applied to any transitions/animations
- [ ] 🟡 **Gemini (Pro 3.1 — browser):** 4.5:1 contrast ratio audit — open the running app at `localhost:3000`, inspect every page (home, `/products`, `/products/[id]`, `/farms`, `/farms/[id]`, `/categories/[category]`, `/search`). Check both light and dark themes. Report any text/background color pairs that fail WCAG AA 4.5:1 ratio. List the exact CSS custom property or Tailwind class causing each failure and suggest a fix.

**Responsive design:**
- [ ] 🟡 **Gemini (Pro 3.1 — browser):** Mobile responsiveness audit — open the running app at `localhost:3000` and test every page at 375px, 768px, 1280px, and 1440px viewport widths. For each breakpoint, screenshot and report: layout breaks, overflow/horizontal scroll, text truncation, overlapping elements, and any interactive element (button, link, input) smaller than 44x44px touch target. List the specific component/element and what CSS change would fix it.

**Backend tasks:**
- [x] Create Server Actions in `src/server/actions/`: `createFarm`, `updateFarm`, `deleteFarm`, `createProduct`, `updateProduct`, `deleteProduct`, `createReview`, `deleteReview`
- [x] Configure `next.config.ts` security headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- [x] Add Cloudinary domain to `next.config.ts` `images.remotePatterns`

**Dependencies:** Phases 4 and 5 complete.

**Risk:** Medium-high — largest phase by volume. Recommended split: implement layout/nav + home page first, verify theme toggle and design tokens, then build product pages, then farm pages, then all forms. Don't move to Phase 7 until all pages render correctly and auth gates work.

---

### Phase 7 — SEO & Metadata

**Goal:** Add technical SEO, structured data, and all metadata APIs.

> **Assignment key:** 🟡 = Gemini Flash 2.0 · 🟠 = Gemini Pro 3.1 (browser) · unmarked = Claude

**Frontend tasks:**
- [ ] 🟡 **Gemini Flash:** Add `export const metadata: Metadata` to every page component. Each page file already exists — add a `metadata` export (for static pages) or `generateMetadata` function (for dynamic `[id]` pages) with `title`, `description`, `openGraph` (title, description, image, url, type), `twitter` (card: `"summary_large_image"`, title, description, image).
  - **Files to edit:** `src/app/page.tsx`, `src/app/products/page.tsx`, `src/app/products/[id]/page.tsx`, `src/app/farms/page.tsx` (create listing page if missing), `src/app/farms/[id]/page.tsx`, `src/app/categories/[category]/page.tsx`, `src/app/search/page.tsx`, `src/app/auth/signin/page.tsx`
  - **For dynamic pages** (`[id]`, `[category]`): use `generateMetadata({ params })` — fetch the entity name/description via the existing DAL imports (`getProductById`, `getFarmById`) already at the top of those files. Do NOT add new imports if the query is already imported.
  - **Import:** `import type { Metadata } from "next"` for static, `import type { Metadata, ResolvingMetadata } from "next"` for dynamic
  - **Do NOT** touch `src/app/layout.tsx` — it already has base metadata configured with title template and description
- [ ] 🟡 **Gemini Flash:** Root layout `metadataBase` — in `src/app/layout.tsx`, add `metadataBase: new URL("https://farmers-market.vercel.app")` to the existing `metadata` export. This is a one-line addition inside the existing metadata object. Do not change anything else in layout.tsx.
- [ ] 🟡 **Gemini Flash:** Create `src/app/sitemap.ts` — export a default async function returning `MetadataRoute.Sitemap`. Import `getFarms` from `@/server/queries/farms` and `getProducts` from `@/server/queries/products`. Map each farm/product to `{ url: \`https://farmers-market.vercel.app/farms/${id}\`, lastModified: updatedAt }` and `{ url: \`https://farmers-market.vercel.app/products/${id}\`, lastModified: updatedAt }`. Also include static routes: `/`, `/products`, `/farms`, `/search`. Import type `MetadataRoute` from `"next"`.
- [ ] 🟡 **Gemini Flash:** Create `src/app/robots.ts` — export a default function returning `MetadataRoute.Robots`. Disallow `/api/*`, allow everything else. Set `sitemap: "https://farmers-market.vercel.app/sitemap.xml"`. This is ~10 lines total.
- [ ] **Claude:** JSON-LD structured data — add `<script type="application/ld+json">` to detail pages:
  - `Product` schema on `src/app/products/[id]/page.tsx` (name, description, image, offers.price, aggregateRating from reviews)
  - `LocalBusiness` schema on `src/app/farms/[id]/page.tsx` (name, address from city+state, description)
  - `BreadcrumbList` schema on all nested pages (products/[id], farms/[id], categories/[category])
- [ ] 🟡 **Gemini Flash:** Canonical URLs — handled automatically by Next.js when `metadataBase` is set and `alternates: { canonical: "./" }` is added to each page's metadata. Add `alternates: { canonical: "./" }` to every page metadata/generateMetadata return object (same files as the metadata task above).
- [ ] 🟡 **Gemini Flash:** Alt text audit — grep all `<Image` and `<img` usages across `src/app/` and `src/components/`. Verify every image has a descriptive `alt` prop (not a filename like `"product-1.webp"`). For product images use the product name, for farm images use the farm name. Report any that need fixing.

**Backend tasks:** None.

**Dependencies:** Phase 6 complete (pages must exist before metadata is added).

**Risk:** Low.

---

### Phase 8 — Testing & CI/CD

**Goal:** Add test coverage and a fully automated GitHub Actions pipeline with deploy to Vercel.

> **Assignment key:** 🟡 = Gemini Flash 2.0 · 🟠 = Gemini Pro 3.1 (browser) · unmarked = Claude

**Backend tasks:**
- [ ] **Claude:** Unit tests (`src/__tests__/`) — Vitest. These tests touch server-side logic, Zod schemas, and error classes:
  - All Zod schemas (`src/schemas/farm.schema.ts`, `product.schema.ts`, `review.schema.ts`) — valid input, invalid input, edge cases
  - `AppError` hierarchy (`src/lib/errors.ts`) — correct status codes, message propagation
  - Utility functions (`cn` in `src/lib/utils.ts`, env parser in `src/lib/env.ts`)
  - Image service (`src/server/services/image.service.ts`) — mock `sharp` and Cloudinary, test transformation logic
- [ ] **Claude:** Integration tests — all API route handlers (`src/app/api/`) and Server Actions (`src/server/actions/`) using Vitest + MSW or direct DAL mocks
- [ ] **Claude:** `ci.yml` (GitHub Actions):
  ```
  on: push (all branches), pull_request
  jobs: type-check → lint → test → build
  ```
- [ ] **Claude:** Security scanning in CI:
  - `gitleaks` — secrets scanning on every push
  - `trivy` — dependency vulnerability scan on PRs
  - `semgrep` — SAST scan on PRs

**Frontend tasks:**
- [ ] 🟡 **Gemini Flash:** Component tests for all UI primitives in `src/components/ui/` using Vitest + React Testing Library. Create test files at `src/__tests__/components/ui/`. Components to test: `Button.tsx` (variants: primary/secondary/destructive/ghost, sizes: sm/md/lg, loading state, click handler), `Card.tsx` (renders header/body/footer slots), `Badge.tsx` (renders text), `Input.tsx` (value change, error state), `Select.tsx` (option rendering, selection), `Rating.tsx` (displays correct number of filled stars for rating 1-5), `RatingInput.tsx` (click to set rating), `ImageWithFallback.tsx` (renders next/image, shows fallback on error), `SearchBar.tsx` (input change, form submit). Each test file should: `import { render, screen, fireEvent } from "@testing-library/react"`, import the component, test rendering and basic interactions. Do NOT test `ThemeToggle` (depends on DOM APIs that need special setup).
- [ ] 🟡 **Gemini Flash:** E2E tests using Playwright. Create test files at `e2e/` or `tests/e2e/`. The app runs at `localhost:3000`. Config is already stubbed at `playwright.config.ts`. Write these test scenarios:
  - [ ] Browse home page → click a product card → verify product detail page loads with name, price, description
  - [ ] Navigate to `/products` → click a category filter tab → verify URL updates and products filter
  - [ ] Navigate to `/search` → type a product name in search bar → verify results appear
  - [ ] Sign in with GitHub (mock the session — set a cookie or use Playwright's `page.context().addCookies()` with a test session token. The auth is Auth.js v5 with JWT strategy)
  - [ ] (Authenticated) Navigate to `/farms/new` → fill form → submit → verify redirect to new farm page
  - [ ] (Authenticated) Navigate to `/products/new` → fill form → submit → verify redirect to new product page
  - [ ] (Authenticated) On a product detail page → fill review form → submit → verify review appears
  - [ ] (Authenticated, owner) On own farm → click edit → modify name → save → verify updated
  - [ ] (Authenticated, owner) On own farm → click delete → confirm → verify redirect to farms list
- [ ] **Claude:** `deploy.yml` (GitHub Actions):
  ```
  on: push to main
  jobs: (ci.yml jobs pass) → deploy to Vercel via Vercel CLI
  ```

**Dependencies:** Phases 6–7 complete.

**Risk:** Low — purely additive. GitHub OAuth in Playwright requires a test account or mocked session; set up a dedicated test GitHub app with a bot account.

---

### Phase 9 — Cleanup & Decommission

**Goal:** Remove all legacy Express/EJS code and finalize the migration.

> **Assignment key:** 🟡 = Gemini Flash 2.0 · 🟠 = Gemini Pro 3.1 (browser) · unmarked = Claude

**Backend tasks:**
- [ ] **Claude:** Remove legacy directories and dependencies — this is destructive cleanup that requires understanding what's still referenced:
  - Remove `dev/` directory (Express TypeScript source)
  - Remove `scripts/` directory (compiled JS output)
  - Remove `views/` directory (EJS templates)
  - Remove `css/` directory
  - Remove `images/` directory — any needed static assets moved to `public/`
  - Remove legacy `package.json` dependencies: `express`, `ejs`, `ejs-mate`, `mongoose`, `joi`, `axios`, `concurrently`, `nodemon`, `@types/express`, `@types/ejs`
  - Remove old `.eslintrc.json` — replaced by new ESLint flat config
  - Remove `Dockerfile` — Vercel deployment doesn't require it; archive on a `docker-deployment` branch if you want to keep it
- [ ] 🟡 **Gemini Flash:** Update `README.md` — rewrite for the new Next.js stack. Include: project overview (Next.js 15 App Router + Turso + Drizzle + Auth.js + Tailwind CSS 4 + Cloudinary), prerequisites (bun, Turso CLI), local dev setup steps (`bun install`, `turso db create`, `bun drizzle-kit migrate`, env var setup from `.env.example`, `bun run db:seed`, `bun dev`), available scripts from `package.json` (dev, build, lint, type-check, test, test:e2e), deployment notes (Vercel with Turso integration). Keep it concise — no badges or excessive formatting.

**Frontend tasks:**
- [ ] 🟠 **Gemini Pro 3.1 (browser):** Lighthouse audit — after the app is deployed to Vercel, run Lighthouse on these routes: `/`, `/products`, `/products/[id]` (pick one), `/farms`, `/farms/[id]` (pick one), `/search`, `/categories/vegetables`. Target: ≥ 90 Performance, ≥ 90 Accessibility, 100 Best Practices, ≥ 90 SEO. Report each score per route and list specific failing audits with recommended fixes.
- [ ] 🟠 **Gemini Pro 3.1 (browser):** Core Web Vitals verification — on the deployed Vercel app, check LCP < 2.5s, INP < 200ms, CLS < 0.1 on the home page and product listing page. Use Chrome DevTools Performance tab or web.dev/measure. Report actual values.
- [ ] 🟠 **Gemini Pro 3.1 (browser):** Cross-browser test — verify the deployed app renders correctly in Chrome, Firefox, and Safari (if accessible). Check: layout integrity, theme toggle works, forms submit, images load, navigation works. Report any browser-specific rendering issues.

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

| Phase | Focus | Risk | Status | AI Split |
|---|---|---|---|---|
| 1 | Security triage | Low | ✅ Complete | — |
| 2 | Project scaffolding | Low | ✅ Complete | — |
| 3 | Turso schema + DAL + image service | Medium | ✅ Complete | — |
| 4 | API route handlers | Medium | ✅ Complete | — |
| 5 | Auth.js + GitHub OAuth | Medium | ✅ Complete | — |
| 6 | React frontend rebuild | Medium-High | ✅ Complete | 2 tasks → 🟠 Pro (browser audits) |
| 7 | SEO + metadata | Low | Next | 5 tasks → 🟡 Flash · 1 task → Claude |
| 8 | Tests + CI/CD | Low | Pending | 2 tasks → 🟡 Flash · 4 tasks → Claude |
| 9 | Cleanup + decommission | Low | Pending | 1 task → 🟡 Flash · 3 tasks → 🟠 Pro · 1 task → Claude |

---

## Notes

- MongoDB Atlas data is not being migrated. The existing database is abandoned after Phase 1 credential rotation. Re-seeding from scratch in Phase 3.
- Auth.js v5 is still in beta as of this writing — pin the exact version in `package.json` and check the changelog before upgrading.
- The `products_fts` FTS5 virtual table cannot be expressed in Drizzle schema syntax — it must be created via raw SQL in a migration file (`db.run(sql\`CREATE VIRTUAL TABLE...\`)`).
- Do not open Phase 6 PRs until Phase 5 auth is verified end-to-end. Auth gates need to exist before building the UI that conditionally renders behind them.