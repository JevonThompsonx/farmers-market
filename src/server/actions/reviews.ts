"use server";

import { revalidatePath } from "next/cache";
import { auth, assertOwnership } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import { CreateReviewSchema } from "@/schemas/review.schema";
import {
  createReview as insertReview,
  deleteReview as removeReview,
  getAverageRatingForFarm,
  getAverageRatingForProduct,
} from "@/server/queries/reviews";
import { updateFarmRating } from "@/server/queries/farms";
import { updateProductRating } from "@/server/queries/products";
import { reviews } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";

export async function createReview(
  target: { farmId?: string; productId?: string },
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError("Sign in to leave a review");

  const raw = {
    body: formData.get("body"),
    rating: formData.get("rating"),
  };

  const parsed = CreateReviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const id = crypto.randomUUID();
  await insertReview({
    id,
    body: parsed.data.body,
    rating: parsed.data.rating,
    authorId: session.user.id,
    farmId: target.farmId ?? null,
    productId: target.productId ?? null,
  });

  // Update average rating
  if (target.farmId) {
    const avg = await getAverageRatingForFarm(target.farmId);
    await updateFarmRating(target.farmId, avg);
    revalidatePath(`/farms/${target.farmId}`);
  }
  if (target.productId) {
    const avg = await getAverageRatingForProduct(target.productId);
    await updateProductRating(target.productId, avg);
    revalidatePath(`/products/${target.productId}`);
  }

  return { success: true };
}

export async function deleteReview(reviewId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError("Sign in required");

  // Get the review to check ownership and find parent
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);
  const review = rows[0];
  if (!review) return;

  assertOwnership(session.user.id, review.authorId);

  await removeReview(reviewId);

  // Update average rating
  if (review.farmId) {
    const avg = await getAverageRatingForFarm(review.farmId);
    await updateFarmRating(review.farmId, avg);
    revalidatePath(`/farms/${review.farmId}`);
  }
  if (review.productId) {
    const avg = await getAverageRatingForProduct(review.productId);
    await updateProductRating(review.productId, avg);
    revalidatePath(`/products/${review.productId}`);
  }
}
