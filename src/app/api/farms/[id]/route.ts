import { type NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import {
  getFarmById,
  updateFarm,
  softDeleteFarm,
} from "@/server/queries/farms";
import { UpdateFarmSchema } from "@/schemas/farm.schema";
import { ValidationError } from "@/lib/errors";
import { assertRateLimit } from "@/lib/rate-limit";
import { getUserId, assertOwnership } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export const GET = apiHandler(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const data = await getFarmById(id);
  return NextResponse.json({ data });
});

export const PATCH = apiHandler(
  async (req: NextRequest, { params }: Params) => {
    await assertRateLimit(req, "api:farms:update");

    const userId = await getUserId();
    const { id } = await params;

    const farm = await getFarmById(id);
    assertOwnership(userId, farm.ownerId);

    const body: unknown = await req.json();
    const parsed = UpdateFarmSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.flatten().fieldErrors.toString());
    }
    await updateFarm(
      id,
      Object.fromEntries(
        Object.entries(parsed.data).filter(([, v]) => v !== undefined),
      ) as Parameters<typeof updateFarm>[1],
    );
    return NextResponse.json({ data: { updated: true } });
  },
);

export const DELETE = apiHandler(
  async (req: NextRequest, { params }: Params) => {
    await assertRateLimit(req, "api:farms:delete");

    const userId = await getUserId();
    const { id } = await params;

    const farm = await getFarmById(id);
    assertOwnership(userId, farm.ownerId);

    await softDeleteFarm(id);
    return NextResponse.json({ data: { deleted: true } });
  },
);
