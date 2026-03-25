import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, getAllProductIds } from "@/server/queries/products";
import { getFarmById } from "@/server/queries/farms";
import { getReviewsForProduct } from "@/server/queries/reviews";
import { auth } from "@/lib/auth";
import { deleteProduct } from "@/server/actions/products";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Rating } from "@/components/ui/Rating";
import { ReviewForm } from "@/components/ReviewForm";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const ids = await getAllProductIds();
  return ids.map(({ id }) => ({ id }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    return {
      title: product.name,
      description: product.description.slice(0, 160),
      openGraph: {
        title: product.name,
        description: product.description.slice(0, 160),
        images: [{ url: product.image }],
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description: product.description.slice(0, 160),
      },
      alternates: { canonical: "./" },
    };
  } catch {
    return { title: "Product Not Found" };
  }
}

async function ReviewList({ productId }: { productId: string }) {
  const reviews = await getReviewsForProduct(productId);
  const session = await auth();

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No reviews yet. Be the first!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <div className="flex items-center justify-between">
            <Rating value={review.rating} />
            {session?.user?.id === review.authorId ? (
              <form
                action={async () => {
                  "use server";
                  const { deleteReview } = await import(
                    "@/server/actions/reviews"
                  );
                  await deleteReview(review.id);
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </form>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-[var(--color-text)]">{review.body}</p>
          <time className="mt-2 block text-xs text-[var(--color-text-muted)]">
            {new Date(review.createdAt).toLocaleDateString()}
          </time>
        </article>
      ))}
    </div>
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;

  let product;
  try {
    product = await getProductById(id);
  } catch {
    notFound();
  }

  const farm = await getFarmById(product.farmId);
  const session = await auth();
  const isOwner = session?.user?.id === farm.ownerId;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    ...(product.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.toFixed(1),
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Products",
        item: "https://farmers-market.vercel.app/products",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.name,
        item: `https://farmers-market.vercel.app/products/${id}`,
      },
    ],
  };

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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <li>
            <Link href="/products" className="hover:text-[var(--color-text)]">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--color-text)]">{product.name}</li>
        </ol>
      </nav>

      <article className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-[var(--radius-xl)]">
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
            quality={85}
          />
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold text-[var(--color-text)]">
              {product.name}
            </h1>
            <Badge>{categoryLabels[product.category] ?? product.category}</Badge>
          </div>

          <p className="mt-2 text-2xl font-bold text-[var(--color-brand-600)]">
            ${product.price.toFixed(2)}
          </p>

          {product.rating ? (
            <div className="mt-2 flex items-center gap-2">
              <Rating value={product.rating} />
              <span className="text-sm text-[var(--color-text-muted)]">
                ({product.rating.toFixed(1)})
              </span>
            </div>
          ) : null}

          <p className="mt-4 text-[var(--color-text-muted)]">
            {product.description}
          </p>

          <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
            <p className="text-sm text-[var(--color-text-muted)]">Sold by</p>
            <Link
              href={`/farms/${farm.id}`}
              className="font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]"
            >
              {farm.name}
            </Link>
            <p className="text-sm text-[var(--color-text-muted)]">
              {farm.city}, {farm.state}
            </p>
          </div>

          {isOwner ? (
            <div className="mt-4 flex gap-3">
              <Link href={`/products/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit Product
                </Button>
              </Link>
              <form action={deleteProduct.bind(null, id)}>
                <Button variant="destructive" size="sm" type="submit">
                  Delete
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      </article>

      <section className="mt-12" aria-labelledby="reviews-heading">
        <h2
          id="reviews-heading"
          className="mb-6 text-2xl font-bold text-[var(--color-text)]"
        >
          Reviews
        </h2>

        <Suspense
          fallback={
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)]"
                />
              ))}
            </div>
          }
        >
          <ReviewList productId={id} />
        </Suspense>

        {session?.user ? (
          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <ReviewForm productId={id} />
          </div>
        ) : (
          <p className="mt-6 text-sm text-[var(--color-text-muted)]">
            <Link
              href="/auth/signin"
              className="text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]"
            >
              Sign in
            </Link>{" "}
            to leave a review.
          </p>
        )}
      </section>
    </div>
  );
}
