# Farmers Market — Modernization Todo List

> Audit of `/home/hermes/Projects/farmers-market` (Next.js 16 App Router · TS 6 · Drizzle ORM · Turso/LibSQL · Auth.js v4 · Tailwind 4 · Vitest · Playwright).
> Grouped by **Security**, **Efficiency**, **Speed**, **QoL/DX**. `[!]` = confirmed issue found during audit.
> **Wave 1 status (2026-08-24)**: branch `feature/modernization/2026-08-24` @ `401d6c8d96f1f5d254c2bcd5ca3545ebb182b9a8` — 2 source commits landed (eslint repair + `@testing-library/dom`). See "🏁 Wave 1 Status" below.

## 🔒 Security

- [x] **[!] API mutation routes have no authentication.** `src/app/api/farms/route.ts` (POST), `src/app/api/products/route.ts` (POST), `src/app/api/products/[id]/route.ts` (PATCH/DELETE), `src/app/api/farms/[id]/route.ts` (PATCH/DELETE), and all three review-POST endpoints (`/api/products/[id]/reviews`, `/api/farms/[id]/reviews`, and the product one) call `assertRateLimit` but **never call `auth()`**. The Server Actions enforce auth, but the API surface does not — anyone can create farms/products/reviews unauthenticated. The auth fails open: reviews are written with `authorId: "placeholder-will-be-replaced-by-auth"` and farms with `ownerId: "placeholder-will-be-replaced-by-auth"`. Enforce `auth()` (+ ownership where applicable) inside each API handler, not just in middleware. **→ DONE (Wave 2, P0): all 8 mutation routes now call `getUserId()` (401 when unauthenticated); farms/product PATCH|DELETE + product POST + reviews enforce `assertOwnership` against the resource's farm owner; placeholder `ownerId`/`authorId` replaced with the authenticated session user id.**
- [ ] **[!] Middleware does not protect API routes.** `middleware.ts` matcher explicitly excludes `api/auth` and the matcher `/((?!_next/static|_next/image|favicon.ico|api/auth).*)` only runs the session check on _page_ paths; mutation APIs are never gated. Either expand the matcher or (preferred) enforce auth in the handlers themselves.
- [x] **[!] `allowDangerousEmailAccountLinking: true`** in `src/lib/auth.ts` (GitHub provider). This lets any OAuth identity matching an existing email take over that account — an account-takeover risk. Remove unless deliberately required, or restrict linking logic. **→ DONE (Wave 2, P0): set to `false`; account linking is now restricted (no auto-linking by email).**
- [x] **No Content-Security-Policy header.** `next.config.ts` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security`, but no CSP. Add a strict `Content-Security-Policy` (especially important since `ImageWithFallback`/Cloudinary/markdown rendering exist). **→ DONE (Wave 2, P0): added a strict CSP (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `img-src 'self' https: data: blob:`, `upgrade-insecure-requests`, etc.).**
- [ ] **Rate limiting is bypassable on Server Actions.** `assertRateLimit` is only applied to API routes; `createFarm`/`createProduct`/`createReview` Server Actions (`src/server/actions/*`) have no rate limiting — abuse vector for spam/farms creation.
- [ ] **[!] In-memory rate-limit fallback is ineffective on serverless.** `src/lib/rate-limit.ts` uses a module-level `Map` when `UPSTASH_REDIS_REST_*` is unset. On Vercel this is per-instance and resets on every cold start, so it provides no real protection unless Upstash is configured. Make Upstash mandatory in production (fail closed) or document the gap explicitly. **→ Wave 2, P0: XFF trust hardened — `getClientKey` now trusts the _rightmost_ (proxy-appended) hop instead of the spoofable leftmost `X-Forwarded-For` entry (rate-limit bypass fixed). Remaining: Upstash-mandatory / fail-closed is still open.**
- [ ] **Hardcoded production URLs in JSON-LD.** `src/app/farms/[id]/page.tsx` hardcodes `https://farmers-market.vercel.app/...` in breadcrumb `item` values. Derive from `metadataBase`/env instead so it works across preview/prod domains.
- [ ] **Validation error messages leak via `.toString()`** in several API routes (`parsed.error.flatten().fieldErrors.toString()`). Prefer a normalized, non-stack-trace error envelope.

## ⚡ Efficiency (resource use / DB)

- [ ] **[!] No caching on read queries.** `getProducts`, `getFarms`, `getFarmById`, `getProductById`, `searchProducts`, and the API GET handlers all hit Turso on every request with no `unstable_cache`, no `revalidate`, and no `Cache-Control`. For a read-heavy catalog, wrap read queries in `unstable_cache` or add ISR (`export const revalidate = N`) to listing/category/farm/products pages.
- [ ] **GET API responses send no `Cache-Control`.** Add `s-maxage`/`stale-while-revalidate` to `/api/products`, `/api/farms`, `/api/search`, `/api/categories`, and detail endpoints.
- [ ] **`getAllFarmIds()` forces full SSG of farm pages but pages are dynamic anyway.** `farms/[id]/page.tsx` has `generateStaticParams` yet queries `auth()` at render → dynamic. Either drop the SSG intent or move to ISR with cached data.
- [ ] **Rating denormalization recomputed on every review write** (`getAverageRatingForFarm/Product` + `updateFarmRating`/`updateProductRating`) — acceptable, but consider a transaction so the read/avg/update is atomic.

## 🚀 Speed (latency / UX)

- [ ] **[!] Image generation is synchronous in the request path.** `fetchAndStoreImage` (Unsplash → `sharp` → Cloudinary) runs inside `createProduct`/`createFarm` Server Actions and API POST handlers. A slow/down Unsplash or Cloudinary makes creation hang (only mitigated by a `try/catch` fallback to `/placeholder.svg`). Move image fetch to a background job/queue, or write the record first with a placeholder and hydrate the image asynchronously.
- [ ] **Fully dynamic rendering on content pages.** Because `auth()` is called in server components, `/`, `/products`, `/farms`, `/categories/[category]`, `/farms/[id]` are dynamic. Introduce ISR / `unstable_cache` to serve cached HTML and reduce TTFB.
- [ ] **[ ] Consider `experimental.optimizePackageImports`** (or rely on Next 16 defaults) to trim the client bundle of large component libs.
- [ ] **[ ] `tsconfig` `target: ES2017`.** Raising to `ES2022` yields smaller/faster output and unlocks modern runtime features.

## 🛠️ QoL / DX

- [x] **Missing dependency: `pino-pretty`.** `src/lib/logger.ts` configures `transport: { target: "pino-pretty" }`, but `pino-pretty` is **not** in `package.json` (`dependencies` or `devDependencies`). In dev this transport load will throw at runtime. Add `pino-pretty` as a devDependency (and pin it). _(Wave 1 fixed the *other* missing peer — `@testing-library/dom` — but `pino-pretty` is still absent. Still open.)_ **→ DONE (Wave 2, P0): added `pino-pretty@^13.1.3` devDependency (bun.lock updated).**
- [ ] **[!] Dependency pinning contradicts AGENTS.md.** Rule #9 says "Pin dependency versions," yet `package.json` uses caret ranges for nearly everything (`next: ^16.2.1`, `react: ^19.2.4`, `drizzle-orm: 0.45.1` is exact but many others are not). Either pin exact versions or update the convention — reproducible builds depend on this.
- [x] **[ ] CI does not enforce formatting.** `.github/workflows/ci.yml` runs type-check, lint, test, build but no `prettier --check`. Add a format gate (or a `prettier` job) to keep the repo consistent. **→ DONE: Prettier format gate now enforced in CI (`format` job + `format:check`).**
- [ ] **[!] `e2e/authenticated.spec.ts` uses a placeholder JWT** (`"mock-session-token"`) and will fail until replaced with a real signed token (documented in `docs/handoff.md` but still a broken test). Generate a fixture token in test setup.
- [ ] **[ ] Duplicated `categoryLabels` map.** The same `{ vegetables: "Vegetables", ... }` object is repeated in `page.tsx`, `products/page.tsx`, and `categories/[category]/page.tsx`. Extract to a shared constant (e.g. `src/lib/categories.ts`).
- [ ] **[ ] No `Cache-Control: no-store` on authenticated/admin data** paths — minor, but ensure private data isn't cached at the edge.
- [ ] **[ ] README / docs drift.** `docs/handoff.md` claims Sentry/trivy/security remediation and a `deploy.yml` that pushes to Vercel; verify these still match the committed `.github/workflows/*` and that deploy secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) are documented for onboarding.
- [ ] **[!] CORRECTION — no `.env*` files exist at all.** The prior claim "`.env.test.example` exists but unit tests don't run the DB" is **false**: `git ls-files` + filesystem confirm `.env`, `.env.example`, and `.env.test.example` are all absent. The Vitest suite is DB-free (mocked), but there is **no env scaffold** for contributors. Add `.env.example` / `.env.test.example` and document required vars. (Second Audit 4.6 — TODO was wrong.)

## ✅ Things already done well (keep)

- Strong Zod validation at every trust boundary (`src/schemas/*`, `src/lib/env.ts`).
- `server-only` import guards on DB/queries/actions/services.
- Append-only, idempotent Drizzle migrations; FTS5 `products_fts` with triggers + LIKE fallback.
- Security headers (HSTS, nosniff, frame-deny, referrer-policy) and `Permissions-Policy`.
- Structured `AppError` hierarchy + `apiHandler` wrapper that never leaks internals.
- `revalidatePath` after mutations; `Suspense` streaming + skeletons on listing pages.
- Accessibility-forward components, responsive grids, `next/font` with `display: swap`.
- Vitest unit/integration + Playwright e2e (3 browsers) with CI matrix.

---

_Priority order: fix the auth-less API routes first (functional/security blockers), then caching/ISR (efficiency+speed), then DX polish. (`pino-pretty` crash resolved Wave 2 — `pino-pretty@13.1.3` devDep; 2026-09-03.)_

---

## 🏁 Wave 1 Status — 2026-08-24

**Branch:** `feature/modernization/2026-08-24` · **HEAD SHA:** `401d6c8d96f1f5d254c2bcd5ca3545ebb182b9a8` (short `401d6c8`)
**Wave 1 commits (source changes, already landed):**

- `3b96e93` — fix: add `@testing-library/dom` peer (resolves the Vitest import failure that made 9 suites crash on collection).
- `401d6c8` — fix: repair eslint flat config for next 16.2 (removes the `Cannot redefine plugin "@typescript-eslint"` ConfigError so `lint` can run).

**Completed in Wave 1:**

- [x] **DX — ESLint config broken (`Cannot redefine plugin "@typescript-eslint"`)** — _was MISSED by the original TODO_; Baseline + Second Audit flagged it as a hard lint blocker. Fixed by `401d6c8` (removed the manual re-add of the TS plugin that `eslint-config-next/typescript` already provides).
- [x] **DX — missing `@testing-library/dom` peer** (`import { screen, fireEvent } from "@testing-library/react"` fails on RTL 16) — _was MISSED by the original TODO_ (it claimed the suite was "fully mocked/runnable"). Fixed by `3b96e93` + `bun.lock` update.

**NOT done in Wave 1 (still open — see Wave 2):**

- ~~`pino-pretty` still absent from `package.json`~~ — RESOLVED Wave 2: `pino-pretty@13.1.3` in devDependencies (2026-09-03; Wave 1 status note now stale).
- TS 6 ↔ `@typescript-eslint` 8 peer conflict (`npm install` ERESOLVE; needs `--legacy-peer-deps` or typescript-eslint v9) — not yet resolved.
- Test files (17 TS errors) still block `next build` — `src/__tests__/components/ui/*.test.tsx` not yet fixed or excluded.
- No `.env*` scaffold exists; security/auth/caching/efficiency items untouched.

---

## 🔧 Corrections from Baseline + Second Audit (2026-08-24)

The original TODO under-reported the DX/toolchain collapse; these refine the record:

- **`.env.test.example` does NOT exist** (original TODO #QoL claimed it did). No `.env`, `.env.example`, or `.env.test.example` in the repo at all — onboarding gap is worse than stated. (Second Audit 4.6 — see corrected line above.)
- **"Vitest suite is fully mocked" is misleading.** The suite **cannot run** on a clean checkout: missing `@testing-library/dom` peer → 9 suites fail on import. (Second Audit 4.7.)
- **ESLint config itself is broken** (`Cannot redefine plugin "@typescript-eslint"`) — lint can't run at all. _Not mentioned in the original TODO._ Fixed in Wave 1 (`401d6c8`). (Second Audit 4.8.)
- **TypeScript 6 ↔ `@typescript-eslint` 8 peer conflict** blocks `npm install` (ERESOLVE) without `--legacy-peer-deps`. (Second Audit 4.9.)
- **Test files block `next build`** — 17 TS errors, all in `src/__tests__/components/ui/*.test.tsx`, fail the build type-check gate. (Second Audit 4.10.)
- **`categoryLabels` is duplicated in 4 places**, not 3 — original TODO missed `src/app/products/[id]/page.tsx:156`. (Second Audit 4.5.)
- **NEW Security gap — `getClientKey` IP is spoofable.** `src/lib/rate-limit.ts` trusts the _first_ `X-Forwarded-For` entry, which is client-controlled; any client can reset its rate-limit bucket. Trust the proxy-set rightmost hop (or platform header). (Second Audit 1.7 — not in original TODO.)

---

## 🌊 Wave 2 Queue (priority order)

**Unblock CI first (the repo cannot type-check / lint / test / build on clean `main`):**

1. **HIGH — Make it buildable/testable:** fix `eslint.config.mjs` (done W1), add `@testing-library/dom` (done W1), resolve TS6/`@typescript-eslint` 8 conflict (upgrade typescript-eslint v9 or pin TS<6), fix the 9 test files (RTL `screen`/`fireEvent` import from `@testing-library/dom` + add `bfcacheId` to router mock) or exclude `src/__tests__` from the build type-check, add `pino-pretty` devDep (done Wave 2 — `pino-pretty@13.1.3`).

**Security blockers:** 2. **HIGH — Add `auth()` (+ ownership) to all 8 API mutation routes**; replace placeholder `ownerId`/`authorId` with real session IDs; middleware cannot secure JSON endpoints (enforce in handlers). 3. **HIGH — Add CSP** to `next.config.ts`; **remove/fence `allowDangerousEmailAccountLinking`** in `src/lib/auth.ts`. 4. **MED — Fix `getClientKey` IP spoof** (trust rightmost proxy hop). (Second Audit 1.7.) 5. **MED — Enforce `auth()` / rate-limit on Server Actions; fail closed on in-memory rate-limit fallback** (Upstash unset → no real protection on serverless).

**Efficiency / Speed:** 6. **MED — `unstable_cache` / ISR + `Cache-Control`** on read queries & GET API endpoints; resolve `generateStaticParams`+dynamic conflict. 7. **MED — Move `fetchAndStoreImage` off the request path** (queue or write-then-hydrate).

**DX polish:** 8. **LOW — Extract `categoryLabels` (4 → 1)** into `src/lib/categories.ts`; add CI Prettier gate. 9. **LOW — Add `.env.example` / `.env.test.example`**; refresh AGENTS.md (says "Next.js 15", repo is 16) + `docs/handoff.md` drift. 10. **LOW — Replace E2E placeholder JWT** with a real signed fixture; derive JSON-LD URLs from `metadataBase`.
