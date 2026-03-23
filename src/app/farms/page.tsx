import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getFarms } from "@/server/queries/farms";
import { Card, CardBody } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Farms",
  description: "Discover local farms and the producers behind your food.",
};

async function FarmGrid() {
  const farms = await getFarms();

  if (farms.length === 0) {
    return (
      <p className="py-12 text-center text-[var(--color-text-muted)]">
        No farms yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {farms.map((farm) => (
        <Link key={farm.id} href={`/farms/${farm.id}`}>
          <Card className="group h-full transition-shadow hover:shadow-md">
            <div className="relative aspect-[16/9] overflow-hidden rounded-t-[var(--radius-lg)]">
              <Image
                src={farm.image}
                alt={farm.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                quality={85}
              />
            </div>
            <CardBody>
              <h2 className="font-semibold text-[var(--color-text)]">
                {farm.name}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {farm.city}, {farm.state}
              </p>
              {farm.rating ? (
                <Rating value={farm.rating} className="mt-1" />
              ) : null}
              <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-muted)]">
                {farm.description}
              </p>
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function FarmsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Farms</h1>
        <Link
          href="/farms/new"
          className="rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-700)]"
        >
          Add Farm
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)]"
              />
            ))}
          </div>
        }
      >
        <FarmGrid />
      </Suspense>
    </div>
  );
}
