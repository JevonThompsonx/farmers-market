# Cloudflare Workers — readiness and blockers

**Status: NOT DEPLOYED (checked 2026-10-30).** The Worker `farmers-market` does
not exist yet — `https://farmers-market.servicesorsubscriptions-natural894.workers.dev`
answers **HTTP 404**. The old Vercel deployment is dead: the account is
suspended, and `https://farmers-market-alpha.vercel.app` answers **HTTP 402
(DEPLOYMENT_DISABLED)**.

## Blocker: three values only ever lived in Vercel

`src/lib/env.ts` validates the environment with zod at startup and throws
before the app can serve a request. These are required and are not available
anywhere else, because the Vercel dashboard that held them is inaccessible:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `UNSPLASH_ACCESS_KEY`

Until they are supplied, the Worker cannot boot, so deploying would only
produce a 500. Everything else is ready (below).

## Already prepared (branch `feat/cloudflare-workers`)

| File                          | Purpose                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `cloudflare.config.ts`        | Worker `farmers-market`, entry `worker-entry.ts`, `nodejs_compat`, asset routing, plain `NEXTAUTH_URL` binding                |
| `worker-entry.ts`             | Publishes string bindings on `globalThis.__RUNTIME_ENV__` before the app loads — Worker secrets never appear in `process.env` |
| `src/lib/env.ts`              | Reads config through the bridged source, falling back to `process.env`                                                        |
| `src/lib/auth.ts`             | next-auth v4 CJS/ESM interop resolver; reads config through the bridge                                                        |
| `tools/deploy-cloudflare.mjs` | `bun run deploy:cf`: build + deploy, re-apply secrets, health check                                                           |

`bun run build:vinext` passes on this branch (verified 2026-10-30). The deploy
script refuses to start if any of its nine required keys is missing, so a
half-configured environment fails before anything is uploaded.

## Database

Turso, own account, group `webdevjev`, database `farmers-market`. Created and
loaded: 624 rows across 7 tables, with row counts checked against the
Vercel-managed `database-sky` at load time. The URL and token live in the
owner's `.env` (mode 600) and are never committed — `.env*` is gitignored.

## To finish

1. Put the three missing values in `.env` (mode 600), alongside
   `NEXTAUTH_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`,
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and
   `NEXTAUTH_URL=https://farmers-market.servicesorsubscriptions-natural894.workers.dev`.
   `NEXTAUTH_URL` is baked in as a plain var at deploy time; its default is
   `https://market.jsquaredadventures.com`.
2. Export `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` for the deploy
   script (it uploads secrets over the REST API, because
   `cf workers secrets bulk` stores empty values in this CLI version).
3. Run `bun run deploy:cf`. It deploys, uploads secrets, then requires
   `HTTP 200` from the Worker URL. Never run `deploy:vinext` on its own — it
   rewrites the binding list and drops the secrets.

## Notes

- **GitHub OAuth:** each OAuth app has a single callback URL, so a new app (or
  a dedicated callback) is needed for
  `https://farmers-market.servicesorsubscriptions-natural894.workers.dev/api/auth/callback/github`.
- **Admin gating (optional):** once the public site works, Cloudflare Access can
  cover admin routes. Pattern and pitfalls:
  `jsquared_blog/docs/CLOUDFLARE-HOSTING.md`.
- **Local dev is not a substitute for the deploy check.** `env.ts` applies the
  same validation in every environment.
