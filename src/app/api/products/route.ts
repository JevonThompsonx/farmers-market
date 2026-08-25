import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { apiHandler } from "@/lib/api-handler";
import {
  getProducts,
  createProduct,
  updateProduct,
} from "@/server/queries/products";
import { getFarmById } from "@/server/queries/farms";
import { assertOwnership } from "@/lib/auth";
import { CreateProductSchema } from "@/schemas/product.schema";
import {
  hydrateImageAsync,
  PLACEHOLDER_IMAGE,
} from "@/server/services/image.service";
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

  // Enforce that the product's farm belongs to the authenticated user.
  const farm = await getFarmById(farmId);
  assertOwnership(userId, farm.ownerId);

  const id = randomUUID();
  // Write the record immediately with a placeholder so the response never
  // blocks on the Unsplash → sharp → Cloudinary image pipeline.
  const product = await createProduct({
    id,
    name,
    price,
    description,
    category,
    image: PLACEHOLDER_IMAGE,
    farmId,
  });

  // Hydrate the real image off the request path (after the response is sent).
  hydrateImageAsync(`${name} ${category} farm fresh`, async (imageUrl) => {
    await updateProduct(id, { image: imageUrl });
    revalidateTag("products", { expire: 300 });
  });

  return NextResponse.json({ data: product }, { status: 201 });
});
