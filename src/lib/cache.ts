/**
 * Shared Cache-Control header values for GET API responses.
 *
 * These target the CDN / edge layer (Vercel) via `s-maxage` while keeping a
 * `stale-while-revalidate` window so that revalidation happens in the
 * background without blocking user requests.
 */

/** Long-lived, rarely-changing public data (e.g. category list). */
export const CACHE_CONTROL_LONG = "s-maxage=3600, stale-while-revalidate=86400";

/** Catalog listings / detail pages — refreshed frequently enough. */
export const CACHE_CONTROL_MEDIUM = "s-maxage=300, stale-while-revalidate=3600";

/** User-driven / queryable responses (e.g. search). */
export const CACHE_CONTROL_SHORT = "s-maxage=60, stale-while-revalidate=300";
