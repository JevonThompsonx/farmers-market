"use client";

import { useActionState } from "react";
import { updateProduct } from "@/server/actions/products";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CATEGORIES, type Product } from "@/server/db/schema";

const categoryOptions = CATEGORIES.map((cat) => ({
  value: cat,
  label: cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" & "),
}));

export function ProductEditForm({ product }: { product: Product }) {
  const boundAction = updateProduct.bind(null, product.id);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <>
      {state?.error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <form action={action} className="space-y-6">
        <Input
          id="name"
          name="name"
          label="Product Name"
          defaultValue={product.name}
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
          defaultValue={product.price}
          required
        />

        <Select
          id="category"
          name="category"
          label="Category"
          options={categoryOptions}
          defaultValue={product.category}
          required
        />

        <Textarea
          id="description"
          name="description"
          label="Description"
          defaultValue={product.description}
          rows={4}
          required
          minLength={10}
          maxLength={2000}
        />

        <div className="flex gap-3">
          <Button type="submit" loading={pending}>
            Save Changes
          </Button>
        </div>
      </form>
    </>
  );
}
