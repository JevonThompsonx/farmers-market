/**
 * Cloudflare Worker entry.
 *
 * vinext's fetch handler and the app both read configuration at module-eval
 * time. On Workers `process.env` is a frozen proxy populated with plain vars
 * only — Worker *secrets* never reach it and assignments to it are silently
 * ignored. So publish the binding set on `globalThis.__RUNTIME_ENV__` before
 * importing the handler; `src/lib/env.ts` merges that object over `process.env`.
 *
 * Diagnostics log binding *names* and value *lengths* only — never values.
 */
type WorkerEnv = Record<string, unknown>;
type FetchHandler = (
  request: Request,
  env: WorkerEnv,
  ctx: unknown,
) => Response | Promise<Response>;
type HandlerModule =
  FetchHandler | { default?: FetchHandler; fetch?: FetchHandler };

let handlerPromise: Promise<HandlerModule> | null = null;
let published = false;

function loadHandler(): Promise<HandlerModule> {
  if (!handlerPromise) {
    handlerPromise =
      import("vinext/server/fetch-handler") as Promise<HandlerModule>;
  }
  return handlerPromise;
}

function publishEnv(env: WorkerEnv): Record<string, string> {
  if (published) return runtimeEnv;

  const strings: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") strings[key] = value;
  }

  runtimeEnv = strings;
  published = true;
  (
    globalThis as unknown as { __RUNTIME_ENV__?: Record<string, string> }
  ).__RUNTIME_ENV__ = strings;

  const names = Object.keys(strings)
    .filter((key) => key !== "ASSETS")
    .sort();
  console.log(`[entry] bindings(${names.length}): ${names.join(",")}`);
  console.log(
    `[entry] runtimeEnv databaseLen=${(strings.DATABASE_URL ?? "").length} authLen=${(strings.AUTH_SECRET ?? "").length}`,
  );

  return strings;
}

let runtimeEnv: Record<string, string> = {};

async function invoke(
  request: Request,
  env: WorkerEnv,
  ctx: unknown,
): Promise<Response> {
  const mod = await loadHandler();
  // vinext's fetch handler can arrive as the module itself, as `default`, or as
  // an object exposing `fetch`; resolve all three shapes.
  const candidate: unknown =
    typeof mod === "function" ? mod : (mod.default ?? mod);
  const handler: unknown =
    typeof candidate === "function"
      ? candidate
      : (candidate as { fetch?: unknown } | undefined)?.fetch;

  if (typeof handler !== "function") {
    return new Response("Worker handler not found", { status: 500 });
  }
  return (handler as FetchHandler)(request, env, ctx);
}

const worker = {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: unknown,
  ): Promise<Response> {
    publishEnv(env);
    return invoke(request, env, ctx);
  },
};

export default worker;
