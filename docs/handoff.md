# Gemini Handoff — Farmers Market

> **Date:** 2026-03-25
> **From:** Claude (Sonnet 4.6)
> **To:** Gemini Flash 2.0 (static tasks) · Gemini Pro 3.1 (browser tasks)
> **Project:** Next.js 15 App Router · Turso (LibSQL) · Drizzle ORM · Auth.js v5 · Tailwind CSS 4

---

## Status

**Gemini Pro localhost browser QA tasks are complete.**

Gemini Flash tasks for Phases 7, 8, and 9 are complete:

| Phase | Task | Status |
|---|---|---|
| 7 | Metadata on all pages (static + dynamic) | ✅ |
| 7 | `src/app/sitemap.ts` | ✅ |
| 7 | `src/app/robots.ts` | ✅ |
| 7 | Canonical URLs on all pages | ✅ |
| 7 | Alt text audit | ✅ |
| 8 | Component unit tests (9 components, 28 tests) | ✅ |
| 8 | E2E test scaffolding (`e2e/public.spec.ts`, `e2e/authenticated.spec.ts`) | ✅ |
| 9 | README rewrite | ✅ |

**Latest Claude fixes in this run:**
- Fixed theme switcher one-click behavior by changing it to deterministic light/dark toggling with persisted state (`src/components/ui/ThemeToggle.tsx`), eliminating the apparent double-click issue from previous system/light/dark cycling.
- Added resilient image fallbacks across all core product/farm surfaces by standardizing on `ImageWithFallback` in listing/detail pages (`src/app/page.tsx`, `src/app/products/page.tsx`, `src/app/categories/[category]/page.tsx`, `src/app/search/page.tsx`, `src/app/products/[id]/page.tsx`, `src/app/farms/page.tsx`, `src/app/farms/[id]/page.tsx`).
- Upgraded `ImageWithFallback` to include a loading skeleton overlay and stronger local default fallback (`src/components/ui/ImageWithFallback.tsx`), and aligned the component test assertion (`src/__tests__/components/ui/ImageWithFallback.test.tsx`).
- Added dedicated local skeleton image assets for failed image states (`public/placeholders/product-skeleton.svg`, `public/placeholders/farm-skeleton.svg`).
- Normalized legacy `placehold.co` URLs directly to local skeleton assets in query normalization (`src/server/queries/image-url.ts`) to prevent repeated Next image optimizer upstream 404 errors.
- Added a minimal no-op service worker file (`public/sw.js`) to satisfy existing browser registrations and stop local `/sw.js` 404 noise.
- Expanded seed generation to 100+ products (currently 120) via variant expansion logic, switched seed fallback images to local skeleton assets, and made reseeding deterministic by clearing existing seeded entities before insert (`src/server/db/seed.ts`).
- Upgraded seed content quality so entries are full-featured: every product now seeds with a deterministic photo URL (`picsum.photos`), rich description text, and multiple comments from multiple seeded users; farm-level comments are also seeded for populated farm detail pages (`src/server/db/seed.ts`, `next.config.ts`).
- Hardened `searchProducts()` to gracefully fallback to SQL `LIKE` when `products_fts` is missing, preventing runtime search crashes.
- Corrected FTS join shape to use SQLite `rowid` semantics when FTS exists.
- Implemented mobile header hamburger navigation (`src/components/layout/Nav.tsx`) and increased header touch targets (`src/components/layout/Header.tsx`).
- Updated contrast tokens in `src/app/globals.css` (`--color-text-muted` light/dark) to address WCAG findings from Gemini QA.
- Fixed mobile search overflow and control sizing (`src/components/ui/SearchBar.tsx`).
- Improved mobile category filter usability via horizontal scrolling + 44px tap targets (`src/app/products/page.tsx`, `src/app/page.tsx`).
- Improved farm detail mobile behavior and resilience (`src/app/farms/[id]/page.tsx`) with breadcrumb wrapping, responsive action layout, and hero image fallback.
- Added follow-up Drizzle migration for FTS (`src/server/db/migrations/0001_products_fts.sql`) and migration journal entry (`src/server/db/migrations/meta/_journal.json`) to create/sync `products_fts` with guarded SQL + triggers.
- Migrated API mutation rate limiting to distributed Upstash-backed limiter in `src/lib/rate-limit.ts` (`@upstash/ratelimit` + `@upstash/redis`) with automatic in-memory fallback when Upstash env vars are absent; wired guards into all current `POST`/`PATCH`/`DELETE` handlers in `src/app/api/farms*` and `src/app/api/products*`.
- Added focused mobile QA regression smoke test `e2e/mobile-qa.spec.ts` and verified it passes on Chromium (`2 passed`) for viewport overflow and 44px touch-target checks.
- Created deploy workflow `.github/workflows/deploy.yml` (triggers after successful `CI` on `main`, plus manual dispatch) to deploy with Vercel CLI using repository secrets.
- Ran `bun run db:migrate` successfully in the current local environment; migration set is applied locally.

**Gemini task queue before backend completion:**
- No active Gemini tasks remain on localhost before backend/deploy work is complete.
- Next Gemini Pro tasks are deploy-dependent (Phase 9): Lighthouse, Core Web Vitals, and cross-browser validation after Vercel deploy.

---

## What Claude needs to do next

### 1. Apply migration in non-local environments

Local migration is complete. Run `bun run db:migrate` in remaining target environments (staging/production) to activate `products_fts` and triggers everywhere.

### 2. Configure deploy secrets + trigger first deploy

Ensure GitHub repository secrets exist: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Then trigger deploy via push to `main` (after CI succeeds) or `workflow_dispatch`.

### 3. Continue remaining Phase 9 Claude cleanup tasks

Legacy cleanup/decommission tasks are still pending (remove old Express/EJS assets and legacy dependencies when ready).

---

## Gemini Pro 3.1 tasks (browser)

### Localhost tasks (completed)

Completed against `http://localhost:3000`:

1. **WCAG contrast audit** — completed across target routes/themes.
2. **Mobile responsiveness audit** — completed at 375px, 768px, 1280px, 1440px with screenshots and remediation guidance.

### After Vercel deploy

These require the live deployed app. Do not run until deployment is confirmed.

1. **Lighthouse audit** — run on `/`, `/products`, `/products/[id]`, `/farms`, `/farms/[id]`, `/search`, `/categories/vegetables`. Targets: ≥90 Performance, ≥90 Accessibility, 100 Best Practices, ≥90 SEO.
2. **Core Web Vitals** — on home page and product listing: LCP <2.5s, INP <200ms, CLS <0.1.
3. **WCAG contrast audit** — test both light and dark themes on all pages. Report any text/background pairs failing 4.5:1 ratio with the specific CSS custom property causing the failure.
4. **Mobile responsiveness** — test every page at 375px, 768px, 1280px, 1440px. Report layout breaks, overflow, touch targets <44×44px.
5. **Cross-browser** — Chrome, Firefox, Safari. Check layout, theme toggle, forms, images, navigation.

---

## Notes on E2E tests

`e2e/authenticated.spec.ts` uses a placeholder JWT value (`"mock-session-token"`). These tests will fail until replaced with a real signed JWT. To generate one:

```ts
import { encode } from "next-auth/jwt";

const token = await encode({
  token: {
    sub: "<your-user-id>",
    name: "Test User",
    email: "test@example.com",
  },
  secret: process.env.NEXTAUTH_SECRET!,
});
```

Set this value as the `next-auth.session-token` cookie in `authenticated.spec.ts` and ensure the user ID matches a seeded user in the database who owns at least one farm.

---

## Key files reference

```
src/
  app/
    layout.tsx                    — Root layout, metadataBase, fonts
    page.tsx                      — Home page (has metadata)
    sitemap.ts                    — Dynamic sitemap
    robots.ts                     — Robots config
    products/page.tsx             — Product listing with category filters (has metadata)
    products/[id]/page.tsx        — Product detail (generateMetadata + generateStaticParams + JSON-LD)
    farms/page.tsx                — Farm listing (has metadata)
    farms/[id]/page.tsx           — Farm detail (generateMetadata + generateStaticParams + JSON-LD)
    categories/[category]/page.tsx — Category filtered products (generateMetadata)
    search/page.tsx               — Search page (has metadata)
    auth/signin/page.tsx          — GitHub sign-in page (has metadata)
  components/ui/                  — Button, Card, Badge, Input, Select, Rating, RatingInput, ImageWithFallback, SearchBar, ThemeToggle
  server/
    queries/                      — DAL (farms.ts, products.ts, reviews.ts)
    actions/                      — Server Actions (farms.ts, products.ts, reviews.ts)
    db/schema.ts                  — Drizzle schema + CATEGORIES enum
  schemas/                        — Zod schemas (farm, product, review)
  lib/
    auth.ts                       — Auth.js v5 config
    env.ts                        — Zod-validated env vars
    errors.ts                     — AppError hierarchy
    utils.ts                      — cn()
  __tests__/                      — 104 passing tests (unit + integration + component)
e2e/
  public.spec.ts                  — 3 public browsing scenarios
  authenticated.spec.ts           — 5 authenticated scenarios (placeholder JWT — needs real token)
  mobile-qa.spec.ts               — focused mobile overflow + touch-target smoke checks
.github/workflows/
  ci.yml                          — type-check → lint → test → build
  security.yml                    — gitleaks + trivy + semgrep
```
