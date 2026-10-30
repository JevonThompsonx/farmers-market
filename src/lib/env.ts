import { z } from "zod";

const envSchema = z.object({
  // Turso
  TURSO_DATABASE_URL: z.string().min(1),
  TURSO_AUTH_TOKEN: z.string().min(1),
  // Auth.js
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  // Unsplash
  UNSPLASH_ACCESS_KEY: z.string().min(1),
  // Rate limiting (optional — only needed in prod)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // Node
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// On Cloudflare Workers `process.env` is a frozen proxy that carries plain vars
// only — Worker secrets never appear there. `worker-entry.ts` publishes the full
// binding set on `globalThis.__RUNTIME_ENV__` before the app loads.
const runtimeBridge = (
  globalThis as unknown as { __RUNTIME_ENV__?: Record<string, string> }
).__RUNTIME_ENV__;
const envSource: NodeJS.ProcessEnv = runtimeBridge
  ? { ...process.env, ...runtimeBridge }
  : process.env;

const parsed = envSchema.safeParse(envSource);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables — check .env.example");
}

export const env = parsed.data;
