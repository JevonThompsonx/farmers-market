import { type NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { createReview, getReviewsForProduct, getAverageRatingForProduct } from "@/server/queries/reviews";
import { updateProductRating } from "@/server/queries/products";
import { CreateReviewSchema } from "@/schemas/review.schema";
import { ValidationError } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

type Params = { params: Promise<{ id: string }> };

export const GET = apiHandler(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const data = await getReviewsForProduct(id);
  return NextResponse.json({ data });
});

export const POST = apiHandler(async (req: NextRequest, { params }: Params) => {
  await assertRateLimit(req, "api:products:reviews:create");

  const { id } = await params;
  const body: unknown = await req.json();
  const parsed = CreateReviewSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.flatten().fieldErrors.toString(),
    );
  }
  await createReview({
    id: randomUUID(),
    body: parsed.data.body,
    rating: parsed.data.rating,
    authorId: "placeholder-will-be-replaced-by-auth",
    productId: id,
  });
  const newRating = await getAverageRatingForProduct(id);
  await updateProductRating(id, newRating);
  return NextResponse.json({ data: { created: true } }, { status: 201 });
});
