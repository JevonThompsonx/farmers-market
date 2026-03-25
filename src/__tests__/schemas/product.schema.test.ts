import { describe, it, expect } from "vitest";
import { CreateProductSchema, UpdateProductSchema } from "@/schemas/product.schema";

describe("CreateProductSchema", () => {
  const valid = {
    name: "Heirloom Tomatoes",
    price: "4.99",
    description: "Ripe and juicy heirloom tomatoes grown without pesticides.",
    category: "vegetables",
    farmId: "farm-123",
  };

  it("accepts valid input", () => {
    const result = CreateProductSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("coerces price from string to number", () => {
    const result = CreateProductSchema.safeParse(valid);
    expect(result.success && result.data.price).toBe(4.99);
  });

  it("rejects negative price", () => {
    const result = CreateProductSchema.safeParse({ ...valid, price: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects zero price", () => {
    const result = CreateProductSchema.safeParse({ ...valid, price: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects price over 9999", () => {
    const result = CreateProductSchema.safeParse({ ...valid, price: "10000" });
    expect(result.success).toBe(false);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = CreateProductSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 150 characters", () => {
    const result = CreateProductSchema.safeParse({ ...valid, name: "A".repeat(151) });
    expect(result.success).toBe(false);
  });

  it("rejects description shorter than 10 characters", () => {
    const result = CreateProductSchema.safeParse({ ...valid, description: "Short" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = CreateProductSchema.safeParse({ ...valid, category: "snacks" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid categories", () => {
    const categories = [
      "vegetables", "fruits", "dairy-eggs", "meat-poultry", "herbs-spices",
      "honey-preserves", "baked-goods", "flowers-plants", "grains-legumes", "beverages",
    ];
    for (const category of categories) {
      const result = CreateProductSchema.safeParse({ ...valid, category });
      expect(result.success, `category "${category}" should be valid`).toBe(true);
    }
  });

  it("rejects missing farmId", () => {
    const { farmId: _, ...rest } = valid;
    const result = CreateProductSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("UpdateProductSchema", () => {
  it("accepts partial input", () => {
    const result = UpdateProductSchema.safeParse({ name: "Better Tomatoes" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = UpdateProductSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("does not include farmId", () => {
    const result = UpdateProductSchema.safeParse({ farmId: "farm-456" });
    // farmId is omitted from UpdateProductSchema — unknown keys are stripped
    expect(result.success).toBe(true);
    if (result.success) {
      expect("farmId" in result.data).toBe(false);
    }
  });

  it("still validates provided fields", () => {
    const result = UpdateProductSchema.safeParse({ price: "-5" });
    expect(result.success).toBe(false);
  });
});
