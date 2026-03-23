import { NextResponse } from "next/server";
import { CATEGORIES } from "@/server/db/schema";

export function GET() {
  return NextResponse.json({ data: CATEGORIES });
}
