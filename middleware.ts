import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED_PATHS = [
  "/products/new",
  "/farms/new",
];

const PROTECTED_PATTERNS = [
  /^\/products\/[^/]+\/edit$/,
  /^\/farms\/[^/]+\/edit$/,
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  const isProtected =
    PROTECTED_PATHS.some((p) => pathname.startsWith(p)) ||
    PROTECTED_PATTERNS.some((r) => r.test(pathname));

  if (isProtected && !session) {
    const signInUrl = new URL("/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
