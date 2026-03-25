import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFarmById, getAllFarmIds } from "@/server/queries/farms";
import { getProductsByFarm } from "@/server/queries/products";
import { getReviewsForFarm } from "@/server/queries/reviews";
import { auth } from "@/lib/auth";
import { deleteFarm } from "@/server/actions/farms";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { Rating } from "@/components/ui/Rating";
import { ReviewForm } from "@/components/ReviewForm";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const ids = await getAllFarmIds();
  return ids.map(({ id }) => ({ id }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const farm = await getFarmById(id);
    return {
      title: farm.name,
      description: farm.description.slice(0, 160),
      openGraph: {
        title: farm.name,
        description: farm.description.slice(0, 160),
        images: [{ url: farm.image }],
      },
      twitter: {
        card: "summary_large_image",
        title: farm.name,
        description: farm.description.slice(0, 160),
      },
      alternates: { canonical: "./" },
    };
  } catch {
    return { title: "Farm Not Found" };
  }
}

async function FarmProducts({ farmId }: { farmId: string }) {
  const products = await getProductsByFarm(farmId);

  if (products.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No products listed yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
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
  );
}

async function ReviewList({ farmId }: { farmId: string }) {
  const reviews = await getReviewsForFarm(farmId);
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

export default async function FarmDetailPage({ params }: Props) {
  const { id } = await params;

  let farm;
  try {
    farm = await getFarmById(id);
  } catch {
    notFound();
  }

  const session = await auth();
  const isOwner = session?.user?.id === farm.ownerId;

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: farm.name,
    description: farm.description,
    image: farm.image,
    address: {
      "@type": "PostalAddress",
      addressLocality: farm.city,
      addressRegion: farm.state,
      addressCountry: "US",
    },
    ...(farm.email ? { email: farm.email } : {}),
    ...(farm.website ? { url: farm.website } : {}),
    ...(farm.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: farm.rating.toFixed(1),
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
        name: "Farms",
        item: "https://farmers-market.vercel.app/farms",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: farm.name,
        item: `https://farmers-market.vercel.app/farms/${id}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <li>
            <Link href="/farms" className="hover:text-[var(--color-text)]">
              Farms
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="break-words text-[var(--color-text)]">{farm.name}</li>
        </ol>
      </nav>

      <div className="relative aspect-[21/9] overflow-hidden rounded-[var(--radius-xl)]">
        <ImageWithFallback
          src={farm.image}
          alt={farm.name}
          fill
          sizes="100vw"
          className="object-cover"
          priority
          quality={85}
        />
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">
              {farm.name}
            </h1>
            <p className="mt-1 text-[var(--color-text-muted)]">
              {farm.city}, {farm.state}
            </p>
            {farm.rating ? (
              <div className="mt-2 flex items-center gap-2">
                <Rating value={farm.rating} />
                <span className="text-sm text-[var(--color-text-muted)]">
                  ({farm.rating.toFixed(1)})
                </span>
              </div>
            ) : null}
          </div>

          {isOwner ? (
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href={`/farms/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit Farm
                </Button>
              </Link>
              <form action={deleteFarm.bind(null, id)}>
                <Button variant="destructive" size="sm" type="submit">
                  Delete
                </Button>
              </form>
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-[var(--color-text-muted)]">
          {farm.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {farm.email ? (
            <a
              href={`mailto:${farm.email}`}
              className="text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]"
            >
              {farm.email}
            </a>
          ) : null}
          {farm.website ? (
            <a
              href={farm.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]"
            >
              Website
            </a>
          ) : null}
        </div>
      </div>

      <section className="mt-12" aria-labelledby="products-heading">
        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="products-heading"
            className="text-2xl font-bold text-[var(--color-text)]"
          >
            Products
          </h2>
          {isOwner ? (
            <Link href={`/products/new?farmId=${id}`}>
              <Button size="sm">Add Product</Button>
            </Link>
          ) : null}
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)]"
                />
              ))}
            </div>
          }
        >
          <FarmProducts farmId={id} />
        </Suspense>
      </section>

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
          <ReviewList farmId={id} />
        </Suspense>

        {session?.user ? (
          <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <ReviewForm farmId={id} />
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
