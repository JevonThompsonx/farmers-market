import "server-only";
import { eq, isNull, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { products, type NewProduct, type Category } from "../db/schema";
import { NotFoundError } from "@/lib/errors";
import { normalizeImageUrl } from "./image-url";

function isMissingProductsFtsTableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return false;
  }

  const message = error.message;
  return typeof message === "string" && message.includes("no such table: products_fts");
}

function normalizeProductImage<T extends { image: string }>(product: T): T {
  return {
    ...product,
    image: normalizeImageUrl(product.image),
  };
}

export async function getProducts(filters?: {
  category?: Category;
  farmId?: string;
  page?: number;
  limit?: number;
}) {
  const { category, farmId, page = 1, limit = 20 } = filters ?? {};
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      description: products.description,
      category: products.category,
      image: products.image,
      farmId: products.farmId,
      rating: products.rating,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(
      sql`${products.deletedAt} IS NULL
        ${category ? sql` AND ${products.category} = ${category}` : sql``}
        ${farmId ? sql` AND ${products.farmId} = ${farmId}` : sql``}`,
    )
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map(normalizeProductImage);
}

export async function getProductById(id: string) {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  const product = rows[0];
  if (!product || product.deletedAt !== null) {
    throw new NotFoundError(`Product ${id} not found`);
  }
  return normalizeProductImage(product);
}

export async function getProductsByFarm(farmId: string) {
  const rows = await db
    .select()
    .from(products)
    .where(sql`${products.farmId} = ${farmId} AND ${products.deletedAt} IS NULL`)
    .orderBy(desc(products.createdAt));

  return rows.map(normalizeProductImage);
}

export async function searchProducts(query: string) {
  const wildcardQuery = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => `${term}*`)
    .join(" ");

  try {
    const rows = await db.all(
      sql`SELECT p.id, p.name, p.price, p.description, p.category, p.image, p.farm_id, p.rating, p.created_at
          FROM products_fts
          JOIN products p ON p.rowid = products_fts.rowid
          WHERE products_fts MATCH ${wildcardQuery}
            AND p.deleted_at IS NULL
          ORDER BY bm25(products_fts)
          LIMIT 50`,
    );

    return rows.map((row) => {
      if (typeof row !== "object" || row === null || !("image" in row)) {
        return row;
      }

      const image = row.image;
      if (typeof image !== "string") {
        return row;
      }

      return {
        ...row,
        image: normalizeImageUrl(image),
      };
    });
  } catch (error) {
    if (!isMissingProductsFtsTableError(error)) {
      throw error;
    }

    const fallbackPattern = `%${query.trim()}%`;
    const rows = await db.all(
      sql`SELECT p.id, p.name, p.price, p.description, p.category, p.image, p.farm_id, p.rating, p.created_at
          FROM products p
          WHERE p.deleted_at IS NULL
            AND (p.name LIKE ${fallbackPattern} OR p.description LIKE ${fallbackPattern})
          ORDER BY p.created_at DESC
          LIMIT 50`,
    );

    return rows.map((row) => {
      if (typeof row !== "object" || row === null || !("image" in row)) {
        return row;
      }

      const image = row.image;
      if (typeof image !== "string") {
        return row;
      }

      return {
        ...row,
        image: normalizeImageUrl(image),
      };
    });
  }
}

export async function createProduct(data: NewProduct) {
  await db.insert(products).values(data);
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, data.id))
    .limit(1);
  const product = rows[0];
  if (!product) throw new Error("Product insert failed");
  return normalizeProductImage(product);
}

export async function updateProduct(
  id: string,
  data: Partial<Pick<NewProduct, "name" | "price" | "description" | "category" | "image">>,
) {
  await db
    .update(products)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(products.id, id));
}

export async function softDeleteProduct(id: string) {
  await db
    .update(products)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(products.id, id));
}

export async function getAllProductIds() {
  return db
    .select({ id: products.id })
    .from(products)
    .where(isNull(products.deletedAt));
}

export async function updateProductRating(productId: string, rating: number) {
  await db
    .update(products)
    .set({ rating, updatedAt: new Date().toISOString() })
    .where(eq(products.id, productId));
}
