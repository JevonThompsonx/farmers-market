import { z } from "zod";

export const CreateReviewSchema = z.object({
  body: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(1000),
  rating: z.coerce
    .number()
    .int("Rating must be a whole number")
    .min(1, "Minimum rating is 1")
    .max(5, "Maximum rating is 5"),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
