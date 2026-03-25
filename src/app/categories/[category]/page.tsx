import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProducts } from "@/server/queries/products";
import { CATEGORIES, type Category } from "@/server/db/schema";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import type { Metadata } from "next";

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

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const label = categoryLabels[category];
  if (!label) return { title: "Category Not Found" };
  const description = `Browse fresh, local ${label.toLowerCase()} from farms near you.`;
  return {
    title: label,
    description,
    openGraph: {
      title: `${label} | Farmers Market`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} | Farmers Market`,
      description,
    },
    alternates: { canonical: "./" },
  };
}

async function CategoryProducts({ category }: { category: Category }) {
  const products = await getProducts({ category, limit: 40 });

  if (products.length === 0) {
    return (
      <p className="py-12 text-center text-[var(--color-text-muted)]">
        No products in this category yet.
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
                <Badge>{categoryLabels[product.category] ?? product.category}</Badge>
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

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;

  if (!CATEGORIES.includes(category as Category)) {
    notFound();
  }

  const label = categoryLabels[category] ?? category;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <li>
            <Link href="/products" className="hover:text-[var(--color-text)]">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-text)]">{label}</li>
        </ol>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-[var(--color-text)]">
        {label}
      </h1>

      <Suspense
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
        <CategoryProducts category={category as Category} />
      </Suspense>
    </div>
  );
}
