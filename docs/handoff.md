# Gemini Handoff — Farmers Market

> **Date:** 2026-03-25
> **From:** Claude (Sonnet 4.6)
> **To:** Gemini Flash 2.0 (static tasks) · Gemini Pro 3.1 (browser tasks)
> **Project:** Next.js 15 App Router · Turso (LibSQL) · Drizzle ORM · Auth.js v5 · Tailwind CSS 4

---

## What Claude completed this session

- Fixed `@auth/drizzle-adapter` missing package (`bun add @auth/drizzle-adapter`)
- Added `generateStaticParams` to `src/app/products/[id]/page.tsx` and `src/app/farms/[id]/page.tsx`
- Added JSON-LD structured data (`Product` + `BreadcrumbList` on product detail; `LocalBusiness` + `BreadcrumbList` on farm detail)
- Unit tests: Zod schemas, `AppError` hierarchy, `cn()` utility — 54 tests
- Integration tests: API route handlers (`GET`/`POST /api/farms`, `GET`/`POST /api/products`) and Server Actions (`createFarm`, `deleteFarm`, `createReview`, `deleteReview`) — 76 tests total, all passing
- GitHub Actions CI: `.github/workflows/ci.yml` (type-check → lint → test → build)
- GitHub Actions security scanning: `.github/workflows/security.yml` (gitleaks + trivy + semgrep)
- Installed `jsdom` (was missing, blocked tests)

---

## What remains for Gemini

### Phase 7 — SEO & Metadata (Gemini Flash 2.0)

All page files exist. The tasks below are purely additive — no logic changes needed.

---

#### Task 1: Add `metadata` / `generateMetadata` to every page

**Files to edit:**

| File | Type | Notes |
|---|---|---|
| `src/app/page.tsx` | Static | export `const metadata: Metadata` |
| `src/app/products/page.tsx` | Static | export `const metadata: Metadata` |
| `src/app/farms/page.tsx` | Static | export `const metadata: Metadata` |
| `src/app/search/page.tsx` | Static | export `const metadata: Metadata` |
| `src/app/auth/signin/page.tsx` | Static | export `const metadata: Metadata` |
| `src/app/products/[id]/page.tsx` | Dynamic | `generateMetadata` already exists — add `alternates: { canonical: "./" }` to its return |
| `src/app/farms/[id]/page.tsx` | Dynamic | `generateMetadata` already exists — add `alternates: { canonical: "./" }` to its return |
| `src/app/categories/[category]/page.tsx` | Dynamic | `generateMetadata({ params })` — read `category` from params, use it in title/description |

**Import for static pages:**
```ts
import type { Metadata } from "next";
```

**Import for dynamic pages (if not already imported):**
```ts
import type { Metadata, ResolvingMetadata } from "next";
```

**Do NOT touch `src/app/layout.tsx`** — it already has `metadataBase`, title template, description, and openGraph configured.

**Shape for static pages:**
```ts
export const metadata: Metadata = {
  title: "Page Title",
  description: "Page description under 160 chars.",
  openGraph: {
    title: "Page Title",
    description: "Page description.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Page Title",
    description: "Page description.",
  },
  alternates: { canonical: "./" },
};
```

**Shape for dynamic pages — add to existing `generateMetadata` return:**
```ts
alternates: { canonical: "./" },
twitter: {
  card: "summary_large_image",
  title: product.name,       // or farm.name / category name
  description: product.description.slice(0, 160),
},
```

**For `src/app/categories/[category]/page.tsx`:** add `generateMetadata({ params })`. The page already imports and validates `category`. Use the category slug for the title (e.g., `"Vegetables | Farmers Market"`).

---

#### Task 2: `metadataBase` in layout

Already done — `src/app/layout.tsx` has:
```ts
metadataBase: new URL(process.env["NEXTAUTH_URL"] ?? "http://localhost:3000"),
```
**No change needed.**

---

#### Task 3: Create `src/app/sitemap.ts`

```ts
import type { MetadataRoute } from "next";
import { getFarms } from "@/server/queries/farms";
import { getProducts } from "@/server/queries/products";

const BASE = "https://farmers-market.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [farms, products] = await Promise.all([getFarms(), getProducts()]);

  const farmEntries = farms.map((f) => ({
    url: `${BASE}/farms/${f.id}`,
    lastModified: new Date(f.createdAt),
  }));

  const productEntries = products.map((p) => ({
    url: `${BASE}/products/${p.id}`,
    lastModified: new Date(p.createdAt),
  }));

  return [
    { url: BASE, lastModified: new Date() },
    { url: `${BASE}/products`, lastModified: new Date() },
    { url: `${BASE}/farms`, lastModified: new Date() },
    { url: `${BASE}/search`, lastModified: new Date() },
    ...farmEntries,
    ...productEntries,
  ];
}
```

Note: `getFarms()` returns objects with `id` and `createdAt`. `getProducts()` takes optional filters — call with no args for all products.

---

#### Task 4: Create `src/app/robots.ts`

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: "https://farmers-market.vercel.app/sitemap.xml",
  };
}
```

---

#### Task 5: Canonical URL additions

Already covered in Task 1 — add `alternates: { canonical: "./" }` to every page's metadata return.

---

#### Task 6: Alt text audit

Grep all `<Image` usages across `src/app/` and `src/components/`. Verify every `<Image` has a meaningful `alt` prop:
- Product images: `alt={product.name}`
- Farm images: `alt={farm.name}`
- Flag any `alt=""` that is not on a decorative image
- Flag any alt text that is a filename (e.g., `"image.webp"`)

Files to check: `src/app/page.tsx`, `src/app/products/page.tsx`, `src/app/products/[id]/page.tsx`, `src/app/farms/page.tsx`, `src/app/farms/[id]/page.tsx`, `src/components/ui/ImageWithFallback.tsx`

---

### Phase 8 — Component Tests (Gemini Flash 2.0)

Vitest + React Testing Library is already installed. Setup file: `src/__tests__/setup.ts`.

**Create test files at `src/__tests__/components/ui/`**

Components to test (all in `src/components/ui/`):

| Component | File | What to test |
|---|---|---|
| `Button` | `Button.tsx` | renders with each variant (primary/secondary/destructive/ghost), each size (sm/md/lg), loading state disables button, onClick fires |
| `Card` | `Card.tsx` | renders CardHeader, CardBody, CardFooter slots with children |
| `Badge` | `Badge.tsx` | renders text content |
| `Input` | `Input.tsx` | renders value, fires onChange, shows error message when error prop provided |
| `Select` | `Select.tsx` | renders options, fires onChange on selection |
| `Rating` | `Rating.tsx` | renders correct number of filled stars for ratings 1–5 |
| `RatingInput` | `RatingInput.tsx` | clicking a star sets the rating value |
| `ImageWithFallback` | `ImageWithFallback.tsx` | renders next/image, fires onError fallback |
| `SearchBar` | `SearchBar.tsx` | input change updates value, form submit fires handler |

**Do NOT test `ThemeToggle`** — it depends on `localStorage` / `matchMedia` that require extra jsdom setup.

**Test template:**
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
  // ...
});
```

---

### Phase 8 — E2E Tests (Gemini Flash 2.0)

Playwright is installed. Config: `playwright.config.ts`. The app runs at `http://localhost:3000`.

**Create test files at `e2e/`** (directory exists).

Scenarios to implement:

1. Browse home page → click a product card → verify product detail page loads with name, price, description
2. Navigate to `/products` → click a category filter tab → verify URL updates and products are filtered
3. Navigate to `/search` → type a product name → verify results appear
4. Sign in with GitHub — mock the session using `page.context().addCookies()` with a test Auth.js v5 JWT session cookie (`next-auth.session-token`)
5. (Authenticated) Navigate to `/farms/new` → fill form → submit → verify redirect to new farm page
6. (Authenticated) Navigate to `/products/new` → fill form → submit → verify redirect to new product page
7. (Authenticated) On a product detail page → fill review form → submit → verify review appears
8. (Authenticated, owner) On own farm → click Edit → modify name → save → verify update
9. (Authenticated, owner) On own farm → click Delete → confirm → verify redirect to `/farms`

For Auth.js v5 JWT mock: generate a signed JWT with `NEXTAUTH_SECRET` matching your `.env`. The cookie name is `next-auth.session-token` in development (or `__Secure-next-auth.session-token` in production/HTTPS).

---

### Phase 9 — README rewrite (Gemini Flash 2.0)

Rewrite `README.md` for the new stack. Include:
- Project overview: Next.js 15 App Router + Turso + Drizzle ORM + Auth.js v5 + Tailwind CSS 4 + Cloudinary
- Prerequisites: bun, Turso CLI (`brew install tursodatabase/tap/turso`)
- Local setup steps:
  1. `bun install`
  2. `cp .env.example .env` and fill in values
  3. `turso db create farmers-market`
  4. `bun run db:migrate`
  5. `bun run db:seed`
  6. `bun dev`
- Available scripts from `package.json`: `dev`, `build`, `start`, `lint`, `type-check`, `test`, `test:e2e`, `db:generate`, `db:migrate`, `db:seed`
- Deployment: Vercel with Turso native integration (add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` via Vercel dashboard or `vercel env pull`)
- Keep concise — no badges, no excessive formatting

---

### Phase 9 — Visual/Browser Audits (Gemini Pro 3.1 — needs browser)

These require the running app. Do after Vercel deployment.

1. **Lighthouse audit** — run on `/`, `/products`, `/products/[id]`, `/farms`, `/farms/[id]`, `/search`, `/categories/vegetables`. Targets: ≥90 Performance, ≥90 Accessibility, 100 Best Practices, ≥90 SEO.
2. **Core Web Vitals** — on home page and product listing: LCP <2.5s, INP <200ms, CLS <0.1.
3. **WCAG contrast audit** — test both light and dark themes on all pages. Report any text/background pairs failing 4.5:1 ratio with the specific CSS custom property causing the failure.
4. **Mobile responsiveness** — test every page at 375px, 768px, 1280px, 1440px. Report layout breaks, overflow, touch targets <44×44px.
5. **Cross-browser** — Chrome, Firefox, Safari. Check layout, theme toggle, forms, images, navigation.

---

## Key files reference

```
src/
  app/
    layout.tsx                    — Root layout, metadata base, fonts
    page.tsx                      — Home page
    products/page.tsx             — Product listing with category filters
    products/[id]/page.tsx        — Product detail (has generateMetadata + generateStaticParams + JSON-LD)
    farms/page.tsx                — Farm listing
    farms/[id]/page.tsx           — Farm detail (has generateMetadata + generateStaticParams + JSON-LD)
    categories/[category]/page.tsx — Category filtered products
    search/page.tsx               — Search page
    auth/signin/page.tsx          — GitHub sign-in page
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
  __tests__/                      — 76 passing unit + integration tests
.github/workflows/
  ci.yml                          — type-check → lint → test → build
  security.yml                    — gitleaks + trivy + semgrep
```

## Important notes for Gemini

- **Auth.js v5 beta** — use beta docs only. Session user type requires `session.user.id` (configured via JWT callback in `src/lib/auth.ts`).
- **`server-only` imports** — DAL files have `import "server-only"` at the top. Do not import them from client components directly — they are already called via Server Actions or RSC.
- **`CATEGORIES` enum** — imported from `src/server/db/schema.ts` as `CATEGORIES` (a `readonly string[]`). Use this when generating category metadata titles.
- **Tailwind CSS 4** — uses `@import "tailwindcss"` syntax, NOT `@tailwind base/components/utilities`. CSS custom properties defined in `src/app/globals.css`.
- **Design tokens** — colors use `var(--color-brand-600)`, `var(--color-text)`, `var(--color-border)`, etc. — defined as CSS custom properties in `globals.css`. Do not use raw Tailwind color classes like `text-blue-600`.
