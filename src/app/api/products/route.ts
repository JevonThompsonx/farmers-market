import { type NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getProducts, createProduct } from "@/server/queries/products";
import { getFarmById } from "@/server/queries/farms";
import { assertOwnership } from "@/lib/auth";
import { CreateProductSchema } from "@/schemas/product.schema";
import { fetchAndStoreImage } from "@/server/services/image.service";
import { ValidationError } from "@/lib/errors";
import { type Category } from "@/server/db/schema";
import { assertRateLimit } from "@/lib/rate-limit";
import { getUserId } from "@/lib/auth";
import { randomUUID } from "crypto";
import { CACHE_CONTROL_MEDIUM } from "@/lib/cache";

export const GET = apiHandler(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") as Category | null;
  const farmIdParam = searchParams.get("farmId");
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");
  const filters: Parameters<typeof getProducts>[0] = { page, limit };
  if (farmIdParam !== null) filters.farmId = farmIdParam;
  if (category !== null) filters.category = category;
  const data = await getProducts(filters);
  return NextResponse.json(
    { data },
    { headers: { "Cache-Control": CACHE_CONTROL_MEDIUM } },
  );
});

export const POST = apiHandler(async (req: NextRequest) => {
  await assertRateLimit(req, "api:products:create");

  const userId = await getUserId();

  const body: unknown = await req.json();
  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.flatten().fieldErrors.toString());
  }
  const { name, price, description, category, farmId } = parsed.data;
  const image = await fetchAndStoreImage(`${name} ${category} farm fresh`);

  // Enforce that the product's farm belongs to the authenticated user.
  const farm = await getFarmById(farmId);
  assertOwnership(userId, farm.ownerId);

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
