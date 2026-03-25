"use client";

import { useActionState, useState } from "react";
import { createReview } from "@/server/actions/reviews";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { RatingInput } from "@/components/ui/RatingInput";

interface ReviewFormProps {
  farmId?: string;
  productId?: string;
}

export function ReviewForm({ farmId, productId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const target: { farmId?: string; productId?: string } = {};
  if (farmId) target.farmId = farmId;
  if (productId) target.productId = productId;
  const boundAction = createReview.bind(null, target);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-text)]">
        Leave a Review
      </h3>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <p className="text-sm text-green-600" role="status">
          Review submitted!
        </p>
      ) : null}

      <RatingInput
        name="rating"
        value={rating}
        onChange={setRating}
        error={!rating && state?.error ? "Please select a rating" : ""}
      />

      <Textarea
        id="review-body"
        name="body"
        label="Your review"
        placeholder="Share your experience... (at least 10 characters)"
        rows={4}
        required
        minLength={10}
        maxLength={1000}
      />

      <Button type="submit" loading={pending}>
        Submit Review
      </Button>
    </form>
  );
}
