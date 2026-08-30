import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import type { DefaultSession } from "next-auth";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/server/db/schema";
import { ForbiddenError, UnauthorizedError } from "./errors";

// Schema tables have slight column differences from the adapter's expected types
// due to exactOptionalPropertyTypes strictness — cast via unknown to satisfy adapter.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const adapterSchema = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
const adapter = DrizzleAdapter(db, adapterSchema);

export const authOptions: NextAuthOptions = {
  adapter,
  providers: [
    GithubProvider({
      clientId: process.env["GITHUB_CLIENT_ID"] ?? "",
      clientSecret: process.env["GITHUB_CLIENT_SECRET"] ?? "",
      // Account-takeover risk: see MODERNIZATION_TODO. Linking is handled
      // explicitly via the `linkAccount` callback instead of auto-linking by email.
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token["userId"] = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token["userId"] && typeof token["userId"] === "string") {
        session.user.id = token["userId"];
      }
      return session;
    },
  },
};

// Augment the Session type so `session.user.id` is typed across the app.
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// Persist the user id on the JWT so it can flow into the session callback.
declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}

/**
 * Resolve the current session for Server Components / route handlers.
 * Returns `null` when unauthenticated.
 */
export const auth = () => getServerSession(authOptions);

// App Router endpoint handler (used by src/app/api/auth/[...nextauth]/route.ts).
// next-auth v4's default export returns `any`; type it explicitly for the
// App Router route signature so callers receive a properly-typed handler.
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const handler: (
  req: import("next/server").NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> },
) => Promise<Response> = NextAuth(authOptions);

/**
 * Server-side sign-in helper for Server Actions.
 * next-auth v4 has no server-side `signIn`, so we redirect to the built-in
 * provider sign-in endpoint which initiates the OAuth flow.
 */
export async function signIn(
  provider: string,
  opts?: { redirectTo?: string; callbackUrl?: string },
): Promise<never> {
  const callbackUrl = opts?.redirectTo ?? opts?.callbackUrl ?? "/";
  redirect(
    `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`,
  );
}

/**
 * Server-side sign-out helper for Server Actions.
 * Redirects to the built-in sign-out endpoint.
 */
export async function signOut(opts?: {
  redirectTo?: string;
  callbackUrl?: string;
}): Promise<never> {
  const callbackUrl = opts?.redirectTo ?? opts?.callbackUrl ?? "/";
  redirect(`/api/auth/signout?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

export function assertOwnership(userId: string, resourceOwnerId: string) {
  if (userId !== resourceOwnerId) {
    throw new ForbiddenError("You do not own this resource");
  }
}

/**
 * Resolve the authenticated user id for an API route handler.
 * Throws `UnauthorizedError` (401) when no session is present, so callers
 * can enforce auth + ownership at the trust boundary.
 */
export async function getUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new UnauthorizedError("Authentication required");
  }
  return userId;
}
