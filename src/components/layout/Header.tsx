import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/lib/auth";
import { Nav } from "./Nav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-[var(--color-brand-700)] hover:text-[var(--color-brand-600)]"
          >
            Farmers Market
          </Link>
          <div className="flex items-center gap-4">
            <Nav />
            <ThemeToggle />
            {session?.user ? (
              <div className="flex items-center gap-3">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "User avatar"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-sm font-medium text-[var(--color-brand-700)]">
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
                    className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-700)]"
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
