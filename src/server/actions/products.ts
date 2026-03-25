"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, assertOwnership } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import { CreateProductSchema, UpdateProductSchema } from "@/schemas/product.schema";
import {
  createProduct as insertProduct,
  updateProduct as patchProduct,
  softDeleteProduct,
  getProductById,
} from "@/server/queries/products";
import { getFarmById } from "@/server/queries/farms";
import { fetchAndStoreImage } from "@/server/services/image.service";

export async function createProduct(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError("Sign in to create a product");

  const raw = {
    name: formData.get("name"),
    price: formData.get("price"),
    description: formData.get("description"),
    category: formData.get("category"),
    farmId: formData.get("farmId"),
  };

  const parsed = CreateProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  // Verify user owns the farm
  const farm = await getFarmById(parsed.data.farmId);
  assertOwnership(session.user.id, farm.ownerId);

  let image: string;
  try {
    image = await fetchAndStoreImage(`${parsed.data.name} ${parsed.data.category} produce`);
  } catch {
    image = "/placeholder.svg";
  }

  const id = crypto.randomUUID();
  await insertProduct({
    id,
    ...parsed.data,
    image,
  });

  revalidatePath(`/farms/${parsed.data.farmId}`);
  revalidatePath("/products");
  redirect(`/products/${id}`);
}

export async function updateProduct(
  productId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError("Sign in required");

  const product = await getProductById(productId);
  const farm = await getFarmById(product.farmId);
  assertOwnership(session.user.id, farm.ownerId);

  const raw = {
    name: formData.get("name") || undefined,
    price: formData.get("price") || undefined,
    description: formData.get("description") || undefined,
    category: formData.get("category") || undefined,
  };

  const parsed = UpdateProductSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const updateData: Record<string, string | number | null> = {};
  if (parsed.data.name !== undefined) updateData["name"] = parsed.data.name;
  if (parsed.data.price !== undefined) updateData["price"] = parsed.data.price;
  if (parsed.data.description !== undefined) updateData["description"] = parsed.data.description;
  if (parsed.data.category !== undefined) updateData["category"] = parsed.data.category;

  await patchProduct(productId, updateData as Parameters<typeof patchProduct>[1]);

  revalidatePath(`/products/${productId}`);
  redirect(`/products/${productId}`);
}

export async function deleteProduct(productId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError("Sign in required");

  const product = await getProductById(productId);
  const farm = await getFarmById(product.farmId);
  assertOwnership(session.user.id, farm.ownerId);

  await softDeleteProduct(productId);
  revalidatePath("/products");
  revalidatePath(`/farms/${product.farmId}`);
  redirect(`/farms/${product.farmId}`);
}
