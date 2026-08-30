import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-6xl font-bold text-[var(--color-brand-600)]">404</h1>
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="max-w-md text-center text-[var(--color-text-muted)]">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link
        href="/"
        className="rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-4 py-2 text-white transition-colors hover:bg-[var(--color-brand-700)]"
      >
        Back to home
      </Link>
    </div>
  );
}
