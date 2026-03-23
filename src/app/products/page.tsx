import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/server/queries/products";
import { CATEGORIES, type Category } from "@/server/db/schema";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse all fresh, local products available at Farmers Market.",
};

async function ProductGrid({
  category,
  page,
}: {
  category?: Category;
  page: number;
}) {
  const products = await getProducts({ category, page, limit: 20 });

  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-[var(--color-text-muted)]">
        No products found in this category.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <Link key={product.id} href={`/products/${product.id}`}>
          <Card className="group h-full transition-shadow hover:shadow-md">
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-lg)]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
              {product.rating ? (
                <Rating value={product.rating} className="mt-1" />
              ) : null}
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category = CATEGORIES.includes(params.category as Category)
    ? (params.category as Category)
    : undefined;
  const page = Math.max(1, Number(params.page ?? "1"));

  const categoryLabels: Record<string, string> = {
    vegetables: "Vegetables",
    fruits: "Fruits",
    "dairy-eggs": "Dairy & Eggs",
    "meat-poultry": "Meat & Poultry",
    "herbs-spices": "Herbs & Spices",
    "honey-preserves": "Honey & Preserves",
    "baked-goods": "Baked Goods",
    "flowers-plants": "Flowers & Plants",
    "grains-legumes": "Grains & Legumes",
    beverages: "Beverages",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-[var(--color-text)]">
        {category ? (categoryLabels[category] ?? category) : "All Products"}
      </h1>

      <nav aria-label="Category filter" className="mb-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            className={cn(
              "rounded-[var(--radius-full)] px-4 py-1.5 text-sm font-medium transition-colors",
              !category
                ? "bg-[var(--color-brand-600)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-700)]",
            )}
          >
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${cat}`}
              className={cn(
                "rounded-[var(--radius-full)] px-4 py-1.5 text-sm font-medium transition-colors",
                category === cat
                  ? "bg-[var(--color-brand-600)] text-white"
                  : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-brand-300)] hover:text-[var(--color-brand-700)]",
              )}
            >
              {categoryLabels[cat] ?? cat}
            </Link>
          ))}
        </div>
      </nav>

      <Suspense
        key={`${category}-${page}`}
        fallback={
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)]"
              />
            ))}
          </div>
        }
      >
        <ProductGrid category={category} page={page} />
      </Suspense>
    </div>
  );
}
