import "server-only";
import { eq, isNull, desc } from "drizzle-orm";
import { db } from "../db";
import { farms, type NewFarm } from "../db/schema";
import { NotFoundError } from "@/lib/errors";
import { normalizeImageUrl } from "./image-url";

export async function getFarms() {
  const rows = await db
    .select({
      id: farms.id,
      name: farms.name,
      city: farms.city,
      state: farms.state,
      description: farms.description,
      image: farms.image,
      rating: farms.rating,
      createdAt: farms.createdAt,
    })
    .from(farms)
    .where(isNull(farms.deletedAt))
    .orderBy(desc(farms.createdAt));

  return rows.map((farm) => ({
    ...farm,
    image: normalizeImageUrl(farm.image),
  }));
}

export async function getFarmById(id: string) {
  const rows = await db
    .select()
    .from(farms)
    .where(eq(farms.id, id))
    .limit(1);

  const farm = rows[0];
  if (!farm || farm.deletedAt !== null) {
    throw new NotFoundError(`Farm ${id} not found`);
  }
  return {
    ...farm,
    image: normalizeImageUrl(farm.image),
  };
}

export async function createFarm(data: NewFarm) {
  await db.insert(farms).values(data);
  const rows = await db
    .select()
    .from(farms)
    .where(eq(farms.id, data.id))
    .limit(1);
  const farm = rows[0];
  if (!farm) throw new Error("Farm insert failed");
  return {
    ...farm,
    image: normalizeImageUrl(farm.image),
  };
}

export async function updateFarm(
  id: string,
  data: Partial<Pick<NewFarm, "name" | "city" | "state" | "description" | "email" | "website" | "image">>,
) {
  await db
    .update(farms)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(farms.id, id));
}

export async function softDeleteFarm(id: string) {
  await db
    .update(farms)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(farms.id, id));
}

export async function getAllFarmIds() {
  return db
    .select({ id: farms.id })
    .from(farms)
    .where(isNull(farms.deletedAt));
}

export async function updateFarmRating(farmId: string, rating: number) {
  await db
    .update(farms)
    .set({ rating, updatedAt: new Date().toISOString() })
    .where(eq(farms.id, farmId));
}
