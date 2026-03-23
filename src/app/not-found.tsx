import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <h1 className="text-6xl font-bold text-[var(--color-brand-600)]">404</h1>
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="text-[var(--color-text-muted)] text-center max-w-md">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-brand-600)] text-white hover:bg-[var(--color-brand-700)] transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
