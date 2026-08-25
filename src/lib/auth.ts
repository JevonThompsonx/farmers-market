import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/server/db";
import { users, accounts, sessions, verificationTokens } from "@/server/db/schema";
import { ForbiddenError, UnauthorizedError } from "./errors";

// Schema tables have slight column differences from the adapter's expected types
// due to exactOptionalPropertyTypes strictness — cast via unknown to satisfy adapter.
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
const adapterSchema = { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens } as any;
const adapter = DrizzleAdapter(db, adapterSchema);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    GitHub({
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
      if (user?.id) token["userId"] = user.id;
      return token;
    },
    session({ session, token }) {
      if (token["userId"] && typeof token["userId"] === "string") {
        session.user.id = token["userId"];
      }
      return session;
    },
  },
});

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
