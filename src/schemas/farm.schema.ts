import { z } from "zod";

export const CreateFarmSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(2, "State is required").max(50),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const UpdateFarmSchema = CreateFarmSchema.partial();

export type CreateFarmInput = z.infer<typeof CreateFarmSchema>;
export type UpdateFarmInput = z.infer<typeof UpdateFarmSchema>;
