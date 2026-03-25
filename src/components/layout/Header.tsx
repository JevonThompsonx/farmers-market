import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/lib/auth";
import { Nav } from "./Nav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-2 py-2">
          <Link
            href="/"
            className="whitespace-nowrap text-lg font-bold text-[var(--color-brand-700)] transition-colors hover:text-[var(--color-brand-600)] sm:text-xl"
          >
            Farmers Market
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Nav />
            <ThemeToggle className="min-h-11 min-w-11" />
            {session?.user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "User avatar"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-sm font-medium text-[var(--color-brand-700)]">
                    {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                )}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] px-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
