import type { MetadataRoute } from "next";
import { getFarms } from "@/server/queries/farms";
import { getProducts } from "@/server/queries/products";

const BASE = "https://farmers-market.vercel.app";

// Static fallback entries returned when the database is unreachable
// (e.g. during CI builds where TURSO credentials are absent or invalid).
const fallback: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date() },
  { url: `${BASE}/products`, lastModified: new Date() },
  { url: `${BASE}/farms`, lastModified: new Date() },
  { url: `${BASE}/search`, lastModified: new Date() },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const [farms, products] = await Promise.all([getFarms(), getProducts()]);

    const farmEntries = farms.map((f) => ({
      url: `${BASE}/farms/${f.id}`,
      lastModified: new Date(f.createdAt),
    }));

    const productEntries = products.map((p) => ({
      url: `${BASE}/products/${p.id}`,
      lastModified: new Date(p.createdAt),
    }));

    return [...fallback, ...farmEntries, ...productEntries];
  } catch {
    // The database may be unreachable (CI, missing credentials, etc.).
    // Return the static fallback so the build still succeeds.
    return fallback;
  }
}
