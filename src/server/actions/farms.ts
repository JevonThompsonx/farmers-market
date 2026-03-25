"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, assertOwnership } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/errors";
import { CreateFarmSchema, UpdateFarmSchema } from "@/schemas/farm.schema";
import {
  createFarm as insertFarm,
  updateFarm as patchFarm,
  softDeleteFarm,
  getFarmById,
} from "@/server/queries/farms";
import { fetchAndStoreImage } from "@/server/services/image.service";

export async function createFarm(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError("Sign in to create a farm");

  const raw = {
    name: formData.get("name"),
    city: formData.get("city"),
    state: formData.get("state"),
    description: formData.get("description"),
    email: formData.get("email"),
    website: formData.get("website"),
  };

  const parsed = CreateFarmSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  let image: string;
  try {
    image = await fetchAndStoreImage(`${parsed.data.name} farm ${parsed.data.state}`);
  } catch {
    image = "/placeholder.svg";
  }

  const id = crypto.randomUUID();
  await insertFarm({
    id,
    ...parsed.data,
    email: parsed.data.email || null,
    website: parsed.data.website || null,
    image,
    ownerId: session.user.id,
  });

  revalidatePath("/farms");
  redirect(`/farms/${id}`);
}

export async function updateFarm(
  farmId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError("Sign in required");

  const farm = await getFarmById(farmId);
  assertOwnership(session.user.id, farm.ownerId);

  const raw = {
    name: formData.get("name") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    description: formData.get("description") || undefined,
    email: formData.get("email") || undefined,
    website: formData.get("website") || undefined,
  };

  const parsed = UpdateFarmSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const updateData: Record<string, string | null> = {};
  if (parsed.data.name !== undefined) updateData["name"] = parsed.data.name;
  if (parsed.data.city !== undefined) updateData["city"] = parsed.data.city;
  if (parsed.data.state !== undefined) updateData["state"] = parsed.data.state;
  if (parsed.data.description !== undefined) updateData["description"] = parsed.data.description;
  if (parsed.data.email !== undefined) updateData["email"] = parsed.data.email || null;
  if (parsed.data.website !== undefined) updateData["website"] = parsed.data.website || null;

  await patchFarm(farmId, updateData);

  revalidatePath(`/farms/${farmId}`);
  redirect(`/farms/${farmId}`);
}

export async function deleteFarm(farmId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError("Sign in required");

  const farm = await getFarmById(farmId);
  assertOwnership(session.user.id, farm.ownerId);

  await softDeleteFarm(farmId);
  revalidatePath("/farms");
  redirect("/farms");
}
