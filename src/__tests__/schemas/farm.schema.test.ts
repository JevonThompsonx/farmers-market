import { describe, it, expect } from "vitest";
import { CreateFarmSchema, UpdateFarmSchema } from "@/schemas/farm.schema";

describe("CreateFarmSchema", () => {
  const valid = {
    name: "Sunrise Farm",
    city: "Portland",
    state: "OR",
    description: "A lovely organic farm in the Pacific Northwest.",
  };

  it("accepts valid input", () => {
    const result = CreateFarmSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts optional email and website", () => {
    const result = CreateFarmSchema.safeParse({
      ...valid,
      email: "farm@example.com",
      website: "https://example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty strings for optional email and website", () => {
    const result = CreateFarmSchema.safeParse({
      ...valid,
      email: "",
      website: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = CreateFarmSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 characters", () => {
    const result = CreateFarmSchema.safeParse({ ...valid, name: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects missing city", () => {
    const { city: _, ...rest } = valid;
    const result = CreateFarmSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects description shorter than 10 characters", () => {
    const result = CreateFarmSchema.safeParse({ ...valid, description: "Too short" });
    expect(result.success).toBe(false);
  });

  it("rejects description longer than 2000 characters", () => {
    const result = CreateFarmSchema.safeParse({ ...valid, description: "A".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = CreateFarmSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid URL for website", () => {
    const result = CreateFarmSchema.safeParse({ ...valid, website: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("UpdateFarmSchema", () => {
  it("accepts partial input", () => {
    const result = UpdateFarmSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = UpdateFarmSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("still validates provided fields", () => {
    const result = UpdateFarmSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });
});
