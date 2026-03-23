import { type NextRequest, NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { getFarmById, updateFarm, softDeleteFarm } from "@/server/queries/farms";
import { UpdateFarmSchema } from "@/schemas/farm.schema";
import { ValidationError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export const GET = apiHandler(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const data = await getFarmById(id);
  return NextResponse.json({ data });
});

export const PATCH = apiHandler(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const body: unknown = await req.json();
  const parsed = UpdateFarmSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.flatten().fieldErrors.toString(),
    );
  }
  await updateFarm(id, parsed.data);
  return NextResponse.json({ data: { updated: true } });
});

export const DELETE = apiHandler(async (_req: NextRequest, { params }: Params) => {
  const { id } = await params;
  await softDeleteFarm(id);
  return NextResponse.json({ data: { deleted: true } });
});
