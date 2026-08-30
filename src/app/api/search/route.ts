import { type NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { searchProducts } from "@/server/queries/products";
import { ValidationError } from "@/lib/errors";
import { CACHE_CONTROL_SHORT } from "@/lib/cache";

export const GET = apiHandler(async (req: NextRequest) => {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    throw new ValidationError("Search query must be at least 2 characters");
  }
  const data = await searchProducts(q.trim());
  return NextResponse.json(
    { data },
    { headers: { "Cache-Control": CACHE_CONTROL_SHORT } },
  );
});
