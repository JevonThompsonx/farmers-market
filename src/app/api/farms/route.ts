import { type NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getFarms, createFarm } from "@/server/queries/farms";
import { CreateFarmSchema } from "@/schemas/farm.schema";
import { fetchAndStoreImage } from "@/server/services/image.service";
import { ValidationError } from "@/lib/errors";
import { randomUUID } from "crypto";

export const GET = apiHandler(async () => {
  const data = await getFarms();
  return NextResponse.json({ data });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const body: unknown = await req.json();
  const parsed = CreateFarmSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.flatten().fieldErrors.toString(),
    );
  }
  const { name, city, state, description, email, website } = parsed.data;
  const image = await fetchAndStoreImage(`${name} farm ${city}`);
  const farm = await createFarm({
    id: randomUUID(),
    name,
    city,
    state,
    description,
    email: email ?? null,
    website: website ?? null,
    image,
    ownerId: "placeholder-will-be-replaced-by-auth",
  });
  return NextResponse.json({ data: farm }, { status: 201 });
});
