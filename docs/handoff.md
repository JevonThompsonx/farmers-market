# Project Handoff — Farmers Market

> **Date:** 2026-03-29
> **From:** Claude (Cascade)
> **Project:** Next.js 15 App Router · Turso (LibSQL) · Drizzle ORM · Auth.js v5 · Tailwind CSS 4

---

## Status

The migration is now in finalization stage:

- Phases 1–8 are complete in-repo (schema, DAL, API, auth, frontend rebuild, SEO, tests, CI/security, deploy workflow).
- Phase 9 backend cleanup is complete: legacy `dev/`, `scripts/`, `views/`, `css/`, `images/`, `.eslintrc.json`, and `Dockerfile` were removed after reference audit.
- Remaining work is deploy rollout plus deploy-dependent browser QA (Lighthouse, CWV, cross-browser) on the live Vercel URL.

Recent completion highlights:

- Theme toggle behavior and SSR-safety fixes are in place.
- Seed content now includes richer product/farm data and comments.
- FTS migration exists and is applied locally; search has fallback handling.
- Upstash-backed distributed mutation rate limiting is wired with in-memory fallback.
- Mobile/responsive/contrast localhost QA findings were fixed; `e2e/mobile-qa.spec.ts` exists.
- Deploy workflow exists at `.github/workflows/deploy.yml`.

---

## Next Steps

### 1. Complete environment rollout

- Run `bun run db:migrate` in non-local target environments (staging/production) so `products_fts` and triggers are active everywhere.

### 2. Complete first Vercel deployment

- Ensure GitHub repository secrets are set: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Trigger deploy (`main` push after CI success or manual `workflow_dispatch`) and confirm live URL health.

### 3. Run deploy-dependent Phase 9 QA

- Lighthouse on key routes.
- Core Web Vitals verification (home + products listing).
- Cross-browser validation (Chrome/Firefox/Safari).

---

## Browser QA Queue

### Localhost (already completed)

Completed against `http://localhost:3000`:

1. **WCAG contrast audit**
2. **Mobile responsiveness audit**

### After Vercel deploy (pending)

These require the live deployed app and should only run after deployment is confirmed.

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
