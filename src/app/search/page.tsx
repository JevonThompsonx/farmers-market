import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { searchProducts } from "@/server/queries/products";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/ui/SearchBar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Products",
  description: "Search for fresh, local products from your favorite farms.",
  openGraph: {
    title: "Search Products | Farmers Market",
    description: "Search for fresh, local products from your favorite farms.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search Products | Farmers Market",
    description: "Search for fresh, local products from your favorite farms.",
  },
  alternates: { canonical: "./" },
};

async function SearchResults({ query }: { query: string }) {
  if (query.length < 2) {
    return (
      <p className="text-[var(--color-text-muted)]">
        Enter at least 2 characters to search.
      </p>
    );
  }

  const results = await searchProducts(query) as Array<{
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    image: string;
    farm_id: string;
  }>;

  if (results.length === 0) {
    return (
      <p className="text-[var(--color-text-muted)]">
        No products found for &ldquo;{query}&rdquo;.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((product) => (
        <Link key={product.id} href={`/products/${product.id}`}>
          <Card className="group h-full transition-shadow hover:shadow-md">
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-lg)]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                quality={85}
              />
            </div>
            <CardBody>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-[var(--color-text)]">
                  {product.name}
                </h2>
                <Badge>{product.category}</Badge>
              </div>
              <p className="mt-1 text-lg font-bold text-[var(--color-brand-600)]">
                ${product.price.toFixed(2)}
              </p>
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-[var(--color-text)]">Search</h1>
      <SearchBar initialValue={query} className="mb-8" />
      {query ? (
        <>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            Results for <strong>&ldquo;{query}&rdquo;</strong>
          </p>
          <Suspense
            key={query}
            fallback={
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)]"
                  />
                ))}
              </div>
            }
          >
            <SearchResults query={query} />
          </Suspense>
        </>
      ) : null}
    </div>
  );
}
