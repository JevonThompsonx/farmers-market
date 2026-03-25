import { notFound } from "next/navigation";
import { getProductById } from "@/server/queries/products";
import { getFarmById } from "@/server/queries/farms";
import { auth, assertOwnership } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductEditForm } from "./ProductEditForm";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    return { title: `Edit ${product.name}` };
  } catch {
    return { title: "Product Not Found" };
  }
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  let product;
  try {
    product = await getProductById(id);
  } catch {
    notFound();
  }

  const farm = await getFarmById(product.farmId);
  assertOwnership(session.user.id, farm.ownerId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-[var(--color-text)]">
        Edit {product.name}
      </h1>
      <ProductEditForm product={product} />
    </div>
  );
}
