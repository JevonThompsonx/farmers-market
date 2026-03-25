import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  assertOwnership: vi.fn(),
}));

vi.mock("@/server/queries/reviews", () => ({
  createReview: vi.fn(),
  deleteReview: vi.fn(),
  getAverageRatingForFarm: vi.fn().mockResolvedValue(4.5),
  getAverageRatingForProduct: vi.fn().mockResolvedValue(4.0),
}));

vi.mock("@/server/queries/farms", () => ({
  updateFarmRating: vi.fn(),
  getFarmById: vi.fn(),
  getAllFarmIds: vi.fn(),
}));

vi.mock("@/server/queries/products", () => ({
  updateProductRating: vi.fn(),
  getProductById: vi.fn(),
  getAllProductIds: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

import { createReview, deleteReview } from "@/server/actions/reviews";
import { auth } from "@/lib/auth";
import { createReview as insertReview } from "@/server/queries/reviews";
import { UnauthorizedError } from "@/lib/errors";

const mockSession = { user: { id: "user-1", name: "Test User", email: "test@example.com" } };

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe("createReview action", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(mockSession as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
    vi.mocked(insertReview).mockResolvedValue(undefined);
  });

  it("throws UnauthorizedError when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const fd = makeFormData({ body: "Great product!", rating: "5" });
    await expect(createReview({ farmId: "farm-1" }, undefined, fd)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("returns error when validation fails", async () => {
    const fd = makeFormData({ body: "Short", rating: "5" });
    const result = await createReview({ farmId: "farm-1" }, undefined, fd);
    expect(result?.error).toBeDefined();
  });

  it("returns error when rating is out of range", async () => {
    const fd = makeFormData({ body: "This is a valid review body.", rating: "6" });
    const result = await createReview({ farmId: "farm-1" }, undefined, fd);
    expect(result?.error).toBeDefined();
  });

  it("returns success on valid input for farm review", async () => {
    const fd = makeFormData({
      body: "This farm has wonderful produce and friendly staff.",
      rating: "5",
    });
    const result = await createReview({ farmId: "farm-1" }, undefined, fd);
    expect(result?.success).toBe(true);
    expect(insertReview).toHaveBeenCalled();
  });

  it("returns success on valid input for product review", async () => {
    const fd = makeFormData({
      body: "Excellent quality tomatoes, will buy again.",
      rating: "4",
    });
    const result = await createReview({ productId: "product-1" }, undefined, fd);
    expect(result?.success).toBe(true);
  });
});

describe("deleteReview action", () => {
  it("throws UnauthorizedError when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    await expect(deleteReview("review-1")).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
