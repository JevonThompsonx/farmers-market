"use client";

import { useActionState } from "react";
import { createFarm } from "@/server/actions/farms";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";

export default function NewFarmPage() {
  const [state, action, pending] = useActionState(createFarm, undefined);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-[var(--color-text)]">
        Add a New Farm
      </h1>

      {state?.error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <form action={action} className="space-y-6">
        <Input
          id="name"
          name="name"
          label="Farm Name"
          placeholder="Green Valley Farm"
          required
          minLength={2}
          maxLength={100}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="city"
            name="city"
            label="City"
            placeholder="Portland"
            required
          />
          <Input
            id="state"
            name="state"
            label="State"
            placeholder="Oregon"
            required
            minLength={2}
          />
        </div>

        <Textarea
          id="description"
          name="description"
          label="Description"
          placeholder="Tell us about your farm..."
          rows={4}
          required
          minLength={10}
          maxLength={2000}
        />

        <Input
          id="email"
          name="email"
          label="Contact Email (optional)"
          type="email"
          placeholder="farm@example.com"
        />

        <Input
          id="website"
          name="website"
          label="Website (optional)"
          type="url"
          placeholder="https://example.com"
        />

        <div className="flex gap-3">
          <Button type="submit" loading={pending}>
            Create Farm
          </Button>
        </div>
      </form>
    </div>
  );
}
