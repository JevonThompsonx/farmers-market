import { type NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getProducts, createProduct } from "@/server/queries/products";
import { CreateProductSchema } from "@/schemas/product.schema";
import { fetchAndStoreImage } from "@/server/services/image.service";
import { ValidationError } from "@/lib/errors";
import { type Category } from "@/server/db/schema";
import { randomUUID } from "crypto";

export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") as Category | null;
  const farmId = searchParams.get("farmId") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const data = await getProducts({ category: category ?? undefined, farmId, page, limit });
  return NextResponse.json({ data });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body: unknown = await req.json();
  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.flatten().fieldErrors.toString(),
    );
  }
  const { name, price, description, category, farmId } = parsed.data;
  const image = await fetchAndStoreImage(`${name} ${category} farm fresh`);
  const product = await createProduct({
    id: randomUUID(),
    name,
    price,
    description,
    category,
    image,
    farmId,
  });
  return NextResponse.json({ data: product }, { status: 201 });
});
