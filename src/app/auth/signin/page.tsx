import { signIn } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Farmers Market to manage your farm or review products.",
  openGraph: {
    title: "Sign In | Farmers Market",
    description: "Sign in to Farmers Market to manage your farm or review products.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | Farmers Market",
    description: "Sign in to Farmers Market to manage your farm or review products.",
  },
  alternates: { canonical: "./" },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/";
  const authErrorMessages: Record<string, string> = {
    OAuthAccountNotLinked:
      "That email is already associated with another sign-in method. Try signing in with your original method first.",
    Configuration:
      "Authentication is temporarily misconfigured. Please try again shortly.",
    AccessDenied: "Access was denied by the provider. Please try again.",
    Verification: "Your sign-in link is invalid or expired. Please request a new one.",
    Default: "We couldn't sign you in. Please try again.",
  };
  const errorMessage = params.error
    ? (authErrorMessages[params.error] ?? authErrorMessages.Default)
    : null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm"
      >
        <h1 className="mb-2 text-2xl font-bold text-[var(--color-text)]">
          Sign in
        </h1>
        <p className="mb-6 text-sm text-[var(--color-text-muted)]">
          Use your GitHub account to continue.
        </p>
        {errorMessage ? (
          <p
            role="alert"
            className="mb-4 rounded-[var(--radius-md)] border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        ) : null}
        <form
          action={async () => {
            "use server";
            await signIn("github", {
              redirectTo: callbackUrl,
            });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-text)] px-4 py-3 text-sm font-semibold text-[var(--color-bg)] transition-opacity hover:opacity-90"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5 fill-current"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
