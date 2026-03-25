"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { createProduct } from "@/server/actions/products";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/server/db/schema";

const categoryOptions = CATEGORIES.map((cat) => ({
  value: cat,
  label: cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" & "),
}));

export default function NewProductPage() {
  const searchParams = useSearchParams();
  const farmId = searchParams.get("farmId") ?? "";
  const [state, action, pending] = useActionState(createProduct, undefined);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-[var(--color-text)]">
        Add a New Product
      </h1>

      {state?.error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <form action={action} className="space-y-6">
        <input type="hidden" name="farmId" value={farmId} />

        <Input
          id="name"
          name="name"
          label="Product Name"
          placeholder="Organic Heirloom Tomatoes"
          required
          minLength={2}
          maxLength={150}
        />

        <Input
          id="price"
          name="price"
          label="Price ($)"
          type="number"
          step="0.01"
          min="0.01"
          max="9999"
          placeholder="4.99"
          required
        />

        <Select
          id="category"
          name="category"
          label="Category"
          options={categoryOptions}
          placeholder="Select a category"
          required
          defaultValue=""
        />

        <Textarea
          id="description"
          name="description"
          label="Description"
          placeholder="Describe your product..."
          rows={4}
          required
          minLength={10}
          maxLength={2000}
        />

        <div className="flex gap-3">
          <Button type="submit" loading={pending}>
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
}
