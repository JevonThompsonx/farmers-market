/**
 * Canonical public site origin.
 *
 * Set NEXT_PUBLIC_SITE_URL in the environment (Vercel: production + preview).
 * The literal fallback keeps local/dev builds working; the value must be the
 * project's real Vercel domain — the bare `farmers-market.vercel.app` belongs
 * to another account and 404s, so it is never a valid canonical host.
 */
export const SITE_URL =
  process.env["NEXT_PUBLIC_SITE_URL"] ??
  "https://farmers-market-alpha.vercel.app";
