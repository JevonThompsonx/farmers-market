import "server-only";
import { eq, desc, avg } from "drizzle-orm";
import { db } from "../db";
import { reviews, type NewReview } from "../db/schema";

export async function getReviewsForFarm(farmId: string) {
  return db
    .select({
      id: reviews.id,
      body: reviews.body,
      rating: reviews.rating,
      authorId: reviews.authorId,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(eq(reviews.farmId, farmId))
    .orderBy(desc(reviews.createdAt));
}

export async function getReviewsForProduct(productId: string) {
  return db
    .select({
      id: reviews.id,
      body: reviews.body,
      rating: reviews.rating,
      authorId: reviews.authorId,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(data: NewReview) {
  await db.insert(reviews).values(data);
}

export async function deleteReview(id: string) {
  await db.delete(reviews).where(eq(reviews.id, id));
}

export async function getAverageRatingForFarm(
  farmId: string,
): Promise<number> {
  const result = await db
    .select({ avg: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.farmId, farmId));
  return Number(result[0]?.avg ?? 0);
}

export async function getAverageRatingForProduct(
  productId: string,
): Promise<number> {
  const result = await db
    .select({ avg: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.productId, productId));
  return Number(result[0]?.avg ?? 0);
}
