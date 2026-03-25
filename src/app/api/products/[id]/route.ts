import { type NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import {
  getProductById,
  updateProduct,
  softDeleteProduct,
} from "@/server/queries/products";
import { UpdateProductSchema } from "@/schemas/product.schema";
import { ValidationError } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

export const GET = apiHandler(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const data = await getProductById(id);
  return NextResponse.json({ data });
});

export const PATCH = apiHandler(async (req: NextRequest, { params }: Params) => {
  await assertRateLimit(req, "api:products:update");

  const { id } = await params;
  const body: unknown = await req.json();
  const parsed = UpdateProductSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.flatten().fieldErrors.toString(),
    );
  }
  await updateProduct(id, Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined)) as Parameters<typeof updateProduct>[1]);
  return NextResponse.json({ data: { updated: true } });
});

export const DELETE = apiHandler(async (req: NextRequest, { params }: Params) => {
  await assertRateLimit(req, "api:products:delete");

  const { id } = await params;
  await softDeleteProduct(id);
  return NextResponse.json({ data: { deleted: true } });
});
