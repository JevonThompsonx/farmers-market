import { bindings, defineConfig, defineWorker } from "cf/config";
import { createWorkersCacheConfig } from "@vinext/cloudflare/cache/config";

const cache = await createWorkersCacheConfig();

const workerName = process.env.CLOUDFLARE_WORKER_NAME ?? "farmers-market";

const siteUrl =
  process.env.NEXTAUTH_URL ?? "https://market.jsquaredadventures.com";

/**
 * Runtime configuration.
 *
 * Everything the app reads from `process.env` at runtime is uploaded as a
 * Worker **secret** by `tools/deploy-cloudflare.mjs` *after* the code deploy
 * (`cf deploy` rewrites the binding list). Only non-secret values live here.
 */
export default defineConfig({
  worker: defineWorker({
    ...cache,
    name: workerName,
    entrypoint: "./worker-entry.ts",
    compatibilityDate: "2026-10-30",
    compatibilityFlags: ["nodejs_compat", "nodejs_compat_populate_process_env"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ...cache.env,
      ASSETS: bindings.assets(),
      NEXTAUTH_URL: bindings.text(siteUrl),
    },
  }),
});
