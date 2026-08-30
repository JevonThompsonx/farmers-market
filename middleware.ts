import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

const PROTECTED_PATHS = ["/products/new", "/farms/new"];

const PROTECTED_PATTERNS = [
  /^\/products\/[^/]+\/edit$/,
  /^\/farms\/[^/]+\/edit$/,
];

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  const token = await getToken({
    req,
    secret: env.NEXTAUTH_SECRET,
  });

  const pathname = nextUrl.pathname;

  const isProtected =
    PROTECTED_PATHS.some((p) => pathname.startsWith(p)) ||
    PROTECTED_PATTERNS.some((r) => r.test(pathname));

  if (isProtected && !token) {
    const signInUrl = new URL("/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
