import { notFound } from "next/navigation";
import { getFarmById } from "@/server/queries/farms";
import { auth, assertOwnership } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FarmEditForm } from "./FarmEditForm";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const farm = await getFarmById(id);
    return { title: `Edit ${farm.name}` };
  } catch {
    return { title: "Farm Not Found" };
  }
}

export default async function EditFarmPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  let farm;
  try {
    farm = await getFarmById(id);
  } catch {
    notFound();
  }

  assertOwnership(session.user.id, farm.ownerId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-[var(--color-text)]">
        Edit {farm.name}
      </h1>
      <FarmEditForm farm={farm} />
    </div>
  );
}
