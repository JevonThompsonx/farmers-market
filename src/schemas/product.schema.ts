import { z } from "zod";
import { CATEGORIES } from "@/server/db/schema";

export const CreateProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(150),
  price: z.coerce.number().positive("Price must be positive").max(9999),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000),
  category: z.enum(CATEGORIES, { message: "Invalid category" }),
  farmId: z.string().min(1, "Farm is required"),
});

export const UpdateProductSchema = CreateProductSchema.omit({ farmId: true }).partial();

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
