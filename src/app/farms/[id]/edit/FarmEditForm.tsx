"use client";

import { useActionState } from "react";
import { updateFarm } from "@/server/actions/farms";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Farm } from "@/server/db/schema";

export function FarmEditForm({ farm }: { farm: Farm }) {
  const boundAction = updateFarm.bind(null, farm.id);
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
          label="Farm Name"
          defaultValue={farm.name}
          required
          minLength={2}
          maxLength={100}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="city"
            name="city"
            label="City"
            defaultValue={farm.city}
            required
          />
          <Input
            id="state"
            name="state"
            label="State"
            defaultValue={farm.state}
            required
            minLength={2}
          />
        </div>

        <Textarea
          id="description"
          name="description"
          label="Description"
          defaultValue={farm.description}
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
          defaultValue={farm.email ?? ""}
        />

        <Input
          id="website"
          name="website"
          label="Website (optional)"
          type="url"
          defaultValue={farm.website ?? ""}
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
