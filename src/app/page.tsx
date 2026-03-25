import { Suspense } from "react";
import Link from "next/link";
import { getProducts } from "@/server/queries/products";
import { CATEGORIES } from "@/server/db/schema";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Rating } from "@/components/ui/Rating";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Farmers Market — Fresh Local Produce",
  description:
    "Discover fresh, local produce from farms near you. Browse products, connect with farmers, and support your local food community.",
  openGraph: {
    title: "Farmers Market — Fresh Local Produce",
    description:
      "Discover fresh, local produce from farms near you. Browse products, connect with farmers, and support your local food community.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Farmers Market — Fresh Local Produce",
    description:
      "Discover fresh, local produce from farms near you. Browse products, connect with farmers, and support your local food community.",
  },
  alternates: { canonical: "./" },
};

async function FeaturedProducts() {
  const products = await getProducts({ limit: 6 });
  return (
    <section aria-labelledby="featured-heading">
      <h2
        id="featured-heading"
        className="mb-6 text-2xl font-bold text-[var(--color-text)]"
      >
        Fresh Today
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <Card className="group h-full transition-shadow hover:shadow-md">
              <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-lg)]">
                <ImageWithFallback
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
                  <h3 className="font-semibold text-[var(--color-text)]">
                    {product.name}
                  </h3>
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
    </section>
  );
}

function CategoryLinks() {
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
    <section aria-labelledby="categories-heading" className="mb-12">
      <h2
        id="categories-heading"
        className="mb-4 text-2xl font-bold text-[var(--color-text)]"
      >
        Browse by Category
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/categories/${cat}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-[var(--radius-full)] border border-[var(--color-brand-300)] px-4 text-sm font-medium text-[var(--color-brand-700)] transition-colors hover:bg-[var(--color-brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
          >
            {categoryLabels[cat] ?? cat}
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)]"
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-5xl">
          Farm Fresh, <span className="text-[var(--color-brand-600)]">Locally Sourced</span>
        </h1>
        <p className="mt-4 text-lg text-[var(--color-text-muted)]">
          Discover seasonal produce, artisan goods, and farm-direct products
          from growers in your community.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/products"
            className="rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
          >
            Browse Products
          </Link>
          <Link
            href="/farms"
            className="rounded-[var(--radius-md)] border border-[var(--color-brand-300)] px-6 py-3 font-semibold text-[var(--color-brand-700)] transition-colors hover:bg-[var(--color-brand-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
          >
            Find Farms
          </Link>
        </div>
      </header>

      <CategoryLinks />

      <Suspense fallback={<ProductSkeleton />}>
        <FeaturedProducts />
      </Suspense>
    </div>
  );
}
