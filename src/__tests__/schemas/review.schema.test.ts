import { describe, it, expect } from "vitest";
import { CreateReviewSchema } from "@/schemas/review.schema";

describe("CreateReviewSchema", () => {
  const valid = {
    body: "This is a great product with excellent quality.",
    rating: "4",
  };

  it("accepts valid input", () => {
    const result = CreateReviewSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("coerces rating from string to number", () => {
    const result = CreateReviewSchema.safeParse(valid);
    expect(result.success && result.data.rating).toBe(4);
  });

  it("accepts all valid ratings 1-5", () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      const result = CreateReviewSchema.safeParse({ ...valid, rating });
      expect(result.success, `rating ${rating} should be valid`).toBe(true);
    }
  });

  it("rejects rating below 1", () => {
    const result = CreateReviewSchema.safeParse({ ...valid, rating: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = CreateReviewSchema.safeParse({ ...valid, rating: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer rating", () => {
    const result = CreateReviewSchema.safeParse({ ...valid, rating: 3.5 });
    expect(result.success).toBe(false);
  });

  it("rejects body shorter than 10 characters", () => {
    const result = CreateReviewSchema.safeParse({ ...valid, body: "Too short" });
    expect(result.success).toBe(false);
  });

  it("rejects body longer than 1000 characters", () => {
    const result = CreateReviewSchema.safeParse({ ...valid, body: "A".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("rejects missing body", () => {
    const { body: _, ...rest } = valid;
    const result = CreateReviewSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing rating", () => {
    const { rating: _, ...rest } = valid;
    const result = CreateReviewSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
