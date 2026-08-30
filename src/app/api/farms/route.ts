import { type NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { apiHandler } from "@/lib/api-handler";
import { getFarms, createFarm, updateFarm } from "@/server/queries/farms";
import { CreateFarmSchema } from "@/schemas/farm.schema";
import {
  hydrateImageAsync,
  PLACEHOLDER_IMAGE,
} from "@/server/services/image.service";
import { ValidationError } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { getUserId } from "@/lib/auth";
import { randomUUID } from "crypto";
import { CACHE_CONTROL_MEDIUM } from "@/lib/cache";

export const GET = apiHandler(async () => {
  const data = await getFarms();
  return NextResponse.json(
    { data },
    { headers: { "Cache-Control": CACHE_CONTROL_MEDIUM } },
  );
});

export const POST = apiHandler(async (req: NextRequest) => {
  await assertRateLimit(req, "api:farms:create");

  const userId = await getUserId();

  const body: unknown = await req.json();
  const parsed = CreateFarmSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.flatten().fieldErrors.toString());
  }
  const { name, city, state, description, email, website } = parsed.data;
  const id = randomUUID();
  // Write the farm immediately with a placeholder so the response never blocks
  // on the Unsplash → sharp → Cloudinary image pipeline.
  const farm = await createFarm({
    id,
    name,
    city,
    state,
    description,
    email: email ?? null,
    website: website ?? null,
    image: PLACEHOLDER_IMAGE,
    ownerId: userId,
  });

  // Hydrate the real image off the request path (after the response is sent).
  hydrateImageAsync(`${name} farm ${city}`, async (imageUrl) => {
    await updateFarm(id, { image: imageUrl });
    revalidateTag("farms", { expire: 300 });
  });

  return NextResponse.json({ data: farm }, { status: 201 });
});
