#!/usr/bin/env node
/**
 * Deploy the blog to Cloudflare Workers, then (re)apply Worker secrets.
 *
 * `cf deploy` rewrites a Worker's binding list, which drops secrets added by an
 * earlier `cf workers secrets bulk`. Doing both steps in one command is what
 * keeps the deployed Worker working — never run the code deploy on its own.
 *
 * Usage:
 *   node scripts/deploy-cloudflare.mjs            # preview worker
 *   CLOUDFLARE_WORKER_NAME=jsquared-blog node scripts/deploy-cloudflare.mjs
 *
 * Environment: values are read from the repo-root `.env` (and `.env.local` if
 * present). Nothing is printed.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const WORKER = process.env.CLOUDFLARE_WORKER_NAME ?? "farmers-market";
const REPO_ROOT = path.resolve(process.cwd(), ".");
const PM =
  existsSync(path.join(REPO_ROOT, "bun.lock")) ||
  existsSync(path.join(REPO_ROOT, "bun.lockb"))
    ? "bun"
    : existsSync(path.join(REPO_ROOT, "pnpm-lock.yaml"))
      ? "pnpm"
      : "npm";

const CONFIG_KEYS = [
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "NEXTAUTH_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "UNSPLASH_ACCESS_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

// Local import shim so the script stays dependency-free.
loadEnvFile(path.join(REPO_ROOT, ".env"));
loadEnvFile(path.join(REPO_ROOT, ".env.local"));
loadEnvFile(path.join(REPO_ROOT, ".env.production.local"));

const REQUIRED_KEYS = [
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "NEXTAUTH_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "UNSPLASH_ACCESS_KEY",
];

const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `Refusing to deploy: missing required values in the environment: ${missing.join(", ")}`,
  );
  process.exit(1);
}

// Optional values (empty in `.env`) are simply not uploaded.
const presentKeys = CONFIG_KEYS.filter((key) => process.env[key]);

console.log(`[1/3] building and deploying ${WORKER}`);
const deploy = spawnSync(PM, ["run", "deploy:vinext"], {
  stdio: "inherit",
  env: { ...process.env, CLOUDFLARE_WORKER_NAME: WORKER },
});
if (deploy.status !== 0) {
  console.error("Deploy failed; secrets were not touched.");
  process.exit(deploy.status ?? 1);
}

console.log(`[2/3] applying ${presentKeys.length} Worker secrets`);

// `cf workers secrets bulk` accepts a payload but stores empty values in this
// CLI version, so talk to the documented REST endpoint directly.
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
if (!ACCOUNT || !API_TOKEN) {
  console.error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required.");
  process.exit(1);
}

let secretsFailed = 0;
for (const key of presentKeys) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/scripts/${WORKER}/secrets`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: key,
        text: process.env[key],
        type: "secret_text",
      }),
    },
  );
  if (!response.ok) {
    secretsFailed += 1;
    console.error(`  ${key}: HTTP ${response.status}`);
  }
}
if (secretsFailed > 0) {
  console.error(`${secretsFailed} secret(s) failed to upload.`);
  process.exit(1);
}
console.log(`  ${presentKeys.length} secrets applied`);

console.log("[3/3] verifying");
const url =
  process.env.PUBLIC_WORKER_URL ??
  `https://${WORKER}.servicesorsubscriptions-natural894.workers.dev`;

const health = spawnSync(
  "curl",
  [
    "-sS",
    "-o",
    "/dev/null",
    "-w",
    "%{http_code}",
    "--max-time",
    "30",
    `${url}/`,
  ],
  { encoding: "utf8" },
);
const code = (health.stdout ?? "").trim();
if (code !== "200") {
  console.error(`Health check failed: ${url}/api/posts -> ${code}`);
  process.exit(1);
}
console.log(`Deployed ${WORKER}; ${url}/api/posts -> ${code}`);
