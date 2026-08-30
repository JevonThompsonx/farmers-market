import type { MetadataRoute } from "next";
import { getFarms } from "@/server/queries/farms";
import { getProducts } from "@/server/queries/products";

const BASE = "https://farmers-market.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let farms: Awaited<ReturnType<typeof getFarms>> = [];
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    [farms, products] = await Promise.all([getFarms(), getProducts()]);
  } catch {
    // DB may be unreachable at build time (e.g. CI). Emit base routes only;
    // the sitemap regenerates on the next ISR cycle in production.
  }

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
