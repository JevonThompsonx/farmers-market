import "server-only";
import { eq, isNull, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { products, type NewProduct, type Category } from "../db/schema";
import { NotFoundError } from "@/lib/errors";

export async function getProducts(filters?: {
  category?: Category;
  farmId?: string;
  page?: number;
  limit?: number;
}) {
  const { category, farmId, page = 1, limit = 20 } = filters ?? {};
  const offset = (page - 1) * limit;

  return db
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
  return product;
}

export async function getProductsByFarm(farmId: string) {
  return db
    .select()
    .from(products)
    .where(sql`${products.farmId} = ${farmId} AND ${products.deletedAt} IS NULL`)
    .orderBy(desc(products.createdAt));
}

export async function searchProducts(query: string) {
  // FTS5 search via raw SQL — the products_fts virtual table is created in migrations
  return db.all(
    sql`SELECT p.id, p.name, p.price, p.description, p.category, p.image, p.farm_id, p.rating, p.created_at
        FROM products_fts fts
        JOIN products p ON p.id = fts.rowid
        WHERE fts.products_fts MATCH ${query + "*"}
          AND p.deleted_at IS NULL
        ORDER BY rank
        LIMIT 50`,
  );
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
  return product;
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

export async function updateProductRating(productId: string, rating: number) {
  await db
    .update(products)
    .set({ rating, updatedAt: new Date().toISOString() })
    .where(eq(products.id, productId));
}
