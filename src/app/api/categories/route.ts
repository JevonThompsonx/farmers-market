import { NextResponse } from "next/server";
import { CATEGORIES } from "@/server/db/schema";
import { CACHE_CONTROL_LONG } from "@/lib/cache";

export function GET() {
  return NextResponse.json(
    { data: CATEGORIES },
    { headers: { "Cache-Control": CACHE_CONTROL_LONG } },
  );
}
