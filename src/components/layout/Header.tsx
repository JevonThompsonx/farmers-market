import Link from "next/link";
import { Nav } from "./Nav";

export function Header() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-[var(--color-brand-700)] hover:text-[var(--color-brand-600)]"
          >
            🌿 Farmers Market
          </Link>
          <Nav />
        </div>
      </div>
    </header>
  );
}
