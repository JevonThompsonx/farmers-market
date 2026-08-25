/**
 * Behavioral security tests for the API mutation routes.
 *
 * Required coverage:
 *  - anonymous mutation rejected (401)
 *  - authenticated mutation accepted (2xx, real user id used)
 *  - user cannot mutate another user's resource (403)
 *  - public reads still work (200, no auth)
 *  - auth callbacks still work (session -> user id wiring)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("server-only", () => ({}));

vi.mock("@/server/queries/farms", () => ({
  getFarms: vi.fn(),
  createFarm: vi.fn(),
  getFarmById: vi.fn(),
  updateFarm: vi.fn(),
  softDeleteFarm: vi.fn(),
  getAllFarmIds: vi.fn(),
  updateFarmRating: vi.fn(),
}));

vi.mock("@/server/queries/products", () => ({
  getProducts: vi.fn(),
  createProduct: vi.fn(),
  getProductById: vi.fn(),
  updateProduct: vi.fn(),
  softDeleteProduct: vi.fn(),
  getAllProductIds: vi.fn(),
  updateProductRating: vi.fn(),
  searchProducts: vi.fn(),
}));

vi.mock("@/server/queries/reviews", () => ({
  getReviewsForFarm: vi.fn(),
  getReviewsForProduct: vi.fn(),
  createReview: vi.fn(),
  deleteReview: vi.fn(),
  getAverageRatingForFarm: vi.fn().mockResolvedValue(4.5),
  getAverageRatingForProduct: vi.fn().mockResolvedValue(4.0),
}));

vi.mock("@/server/services/image.service", () => ({
  fetchAndStoreImage: vi
    .fn()
    .mockResolvedValue("https://res.cloudinary.com/test/image.webp"),
}));

vi.mock("@/lib/auth", () => {
  const assertOwnership = vi.fn((userId: string, resourceOwnerId: string) => {
    if (userId !== resourceOwnerId) {
      throw new ForbiddenError("You do not own this resource");
    }
  });
  return {
    auth: vi.fn(),
    assertOwnership,
    getUserId: vi.fn(),
  };
});

import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getUserId } from "@/lib/auth";
import { type Farm, type Product } from "@/server/db/schema";

import { POST as farmsPOST } from "@/app/api/farms/route";
import { GET as farmsGET } from "@/app/api/farms/route";
import {
  PATCH as farmPATCH,
  DELETE as farmDELETE,
} from "@/app/api/farms/[id]/route";
import { GET as farmItemGET } from "@/app/api/farms/[id]/route";
import { POST as productsPOST } from "@/app/api/products/route";
import { GET as productsGET } from "@/app/api/products/route";
import {
  PATCH as productPATCH,
  DELETE as productDELETE,
} from "@/app/api/products/[id]/route";
import { GET as productItemGET } from "@/app/api/products/[id]/route";
import { POST as farmReviewsPOST } from "@/app/api/farms/[id]/reviews/route";
import { GET as farmReviewsGET } from "@/app/api/farms/[id]/reviews/route";
import { POST as productReviewsPOST } from "@/app/api/products/[id]/reviews/route";
import { GET as productReviewsGET } from "@/app/api/products/[id]/reviews/route";

import {
  getFarms,
  createFarm,
  getFarmById,
  updateFarm,
  softDeleteFarm,
  updateFarmRating,
} from "@/server/queries/farms";
import {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  softDeleteProduct,
  updateProductRating,
} from "@/server/queries/products";
import {
  getReviewsForFarm,
  getReviewsForProduct,
  getAverageRatingForFarm,
  getAverageRatingForProduct,
} from "@/server/queries/reviews";

const OWNER = "owner-1";
const OTHER = "other-user";

const mockFarm = {
  id: "farm-1",
  name: "Sunrise Farm",
  city: "Portland",
  state: "OR",
  description: "A lovely organic farm.",
  email: null,
  website: null,
  image: "https://res.cloudinary.com/test/image.webp",
  ownerId: OWNER,
  rating: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
} as unknown as Farm;

const mockProduct = {
  id: "product-1",
  name: "Heirloom Tomatoes",
  price: 4.99,
  description: "Ripe heirloom tomatoes.",
  category: "vegetables" as const,
  image: "https://res.cloudinary.com/test/image.webp",
  farmId: "farm-1",
  rating: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
} as unknown as Product;

function makeRequest(
  url: string,
  options?: Omit<RequestInit, "signal"> & { signal?: AbortSignal },
) {
  return new NextRequest(
    url,
    options as ConstructorParameters<typeof NextRequest>[1],
  );
}

/** Helper that runs the anon/owner/other matrix for a single mutation handler. */
async function callWithSession(
  handler: (
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
  ) => Promise<Response>,
  url: string,
  body: unknown,
  opts: { method: string; id?: string },
) {
  const init: Omit<RequestInit, "signal"> & { signal?: AbortSignal } = {
    method: opts.method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const req = makeRequest(url, init);
  const ctx = { params: Promise.resolve({ id: opts.id ?? "x" }) } as {
    params: Promise<{ id: string }>;
  };
  return handler(req, ctx);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUserId).mockResolvedValue(OWNER);
  vi.mocked(getAverageRatingForFarm).mockResolvedValue(4.5);
  vi.mocked(getAverageRatingForProduct).mockResolvedValue(4.0);
  vi.mocked(getFarmById).mockResolvedValue({ ...mockFarm, ownerId: OWNER });
  vi.mocked(getProductById).mockResolvedValue({
    ...mockProduct,
    farmId: "farm-1",
  });
  vi.mocked(createFarm).mockResolvedValue(mockFarm);
  vi.mocked(createProduct).mockResolvedValue(mockProduct);
  vi.mocked(getFarms).mockResolvedValue([mockFarm]);
  vi.mocked(getProducts).mockResolvedValue([mockProduct]);
  vi.mocked(getReviewsForFarm).mockResolvedValue([]);
  vi.mocked(getReviewsForProduct).mockResolvedValue([]);
});

describe("anonymous mutations are rejected", () => {
  it("POST /api/farms -> 401", async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());
    const res = await farmsPOST(
      makeRequest("http://localhost:3000/api/farms", {
        method: "POST",
        body: JSON.stringify({
          name: "X",
          city: "Y",
          state: "OR",
          description: "d",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(res.status).toBe(401);
    expect(createFarm).not.toHaveBeenCalled();
  });

  it("POST /api/products -> 401", async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());
    const res = await productsPOST(
      makeRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: "X",
          price: 1,
          description: "d",
          category: "vegetables",
          farmId: "farm-1",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(res.status).toBe(401);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("PATCH /api/farms/[id] -> 401", async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());
    const res = await callWithSession(
      farmPATCH,
      "http://localhost:3000/api/farms/farm-1",
      { name: "X" },
      { method: "PATCH", id: "farm-1" },
    );
    expect(res.status).toBe(401);
    expect(updateFarm).not.toHaveBeenCalled();
  });

  it("DELETE /api/farms/[id] -> 401", async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());
    const res = await callWithSession(
      farmDELETE,
      "http://localhost:3000/api/farms/farm-1",
      undefined,
      { method: "DELETE", id: "farm-1" },
    );
    expect(res.status).toBe(401);
    expect(softDeleteFarm).not.toHaveBeenCalled();
  });

  it("PATCH /api/products/[id] -> 401", async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());
    const res = await callWithSession(
      productPATCH,
      "http://localhost:3000/api/products/product-1",
      { name: "X" },
      { method: "PATCH", id: "product-1" },
    );
    expect(res.status).toBe(401);
    expect(updateProduct).not.toHaveBeenCalled();
  });

  it("DELETE /api/products/[id] -> 401", async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());
    const res = await callWithSession(
      productDELETE,
      "http://localhost:3000/api/products/product-1",
      undefined,
      { method: "DELETE", id: "product-1" },
    );
    expect(res.status).toBe(401);
    expect(softDeleteProduct).not.toHaveBeenCalled();
  });

  it("POST /api/farms/[id]/reviews -> 401", async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());
    const res = await farmReviewsPOST(
      makeRequest("http://localhost:3000/api/farms/farm-1/reviews", {
        method: "POST",
        body: JSON.stringify({ body: "nice", rating: 5 }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "farm-1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("POST /api/products/[id]/reviews -> 401", async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());
    const res = await productReviewsPOST(
      makeRequest("http://localhost:3000/api/products/product-1/reviews", {
        method: "POST",
        body: JSON.stringify({ body: "nice", rating: 5 }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "product-1" }) },
    );
    expect(res.status).toBe(401);
  });
});

describe("authenticated mutations are accepted and use the real user id", () => {
  it("POST /api/farms -> 201 with session ownerId", async () => {
    const res = await farmsPOST(
      makeRequest("http://localhost:3000/api/farms", {
        method: "POST",
        body: JSON.stringify({
          name: "Sunrise",
          city: "Portland",
          state: "OR",
          description: "A lovely organic farm in the Pacific Northwest.",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(res.status).toBe(201);
    expect(createFarm).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: OWNER }),
    );
  });

  it("POST /api/products -> 201 and verifies farm ownership", async () => {
    const res = await productsPOST(
      makeRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: "Tomatoes",
          price: 4.99,
          description:
            "Ripe and juicy heirloom tomatoes grown without pesticides.",
          category: "vegetables",
          farmId: "farm-1",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(res.status).toBe(201);
    expect(getFarmById).toHaveBeenCalledWith("farm-1");
    expect(createProduct).toHaveBeenCalled();
  });

  it("PATCH /api/farms/[id] -> 200", async () => {
    const res = await callWithSession(
      farmPATCH,
      "http://localhost:3000/api/farms/farm-1",
      { name: "New" },
      { method: "PATCH", id: "farm-1" },
    );
    expect(res.status).toBe(200);
    expect(updateFarm).toHaveBeenCalled();
  });

  it("DELETE /api/farms/[id] -> 200", async () => {
    const res = await callWithSession(
      farmDELETE,
      "http://localhost:3000/api/farms/farm-1",
      undefined,
      { method: "DELETE", id: "farm-1" },
    );
    expect(res.status).toBe(200);
    expect(softDeleteFarm).toHaveBeenCalledWith("farm-1");
  });

  it("PATCH /api/products/[id] -> 200", async () => {
    const res = await callWithSession(
      productPATCH,
      "http://localhost:3000/api/products/product-1",
      { name: "New" },
      { method: "PATCH", id: "product-1" },
    );
    expect(res.status).toBe(200);
    expect(updateProduct).toHaveBeenCalled();
  });

  it("DELETE /api/products/[id] -> 200", async () => {
    const res = await callWithSession(
      productDELETE,
      "http://localhost:3000/api/products/product-1",
      undefined,
      { method: "DELETE", id: "product-1" },
    );
    expect(res.status).toBe(200);
    expect(softDeleteProduct).toHaveBeenCalledWith("product-1");
  });

  it("POST /api/farms/[id]/reviews -> 201 with session authorId", async () => {
    const res = await farmReviewsPOST(
      makeRequest("http://localhost:3000/api/farms/farm-1/reviews", {
        method: "POST",
        body: JSON.stringify({
          body: "Fresh produce and friendly staff!",
          rating: 5,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "farm-1" }) },
    );
    expect(res.status).toBe(201);
    expect(updateFarmRating).toHaveBeenCalled();
  });

  it("POST /api/products/[id]/reviews -> 201 with session authorId", async () => {
    const res = await productReviewsPOST(
      makeRequest("http://localhost:3000/api/products/product-1/reviews", {
        method: "POST",
        body: JSON.stringify({
          body: "Great quality and fast delivery!",
          rating: 5,
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ id: "product-1" }) },
    );
    expect(res.status).toBe(201);
    expect(updateProductRating).toHaveBeenCalled();
  });
});

describe("a user cannot mutate another user's resource", () => {
  beforeEach(() => {
    vi.mocked(getFarmById).mockResolvedValue({ ...mockFarm, ownerId: OTHER });
    vi.mocked(getProductById).mockResolvedValue({
      ...mockProduct,
      farmId: "farm-1",
    });
    // product PATCH/DELETE look up the product's farm ownership
    (getFarmById as ReturnType<typeof vi.fn>).mockImplementation(
      (id: string) => {
        if (id === "farm-1")
          return Promise.resolve({ ...mockFarm, ownerId: OTHER });
        return Promise.resolve({ ...mockFarm, ownerId: OTHER });
      },
    );
  });

  it("PATCH /api/farms/[id] -> 403 when not owner", async () => {
    const res = await callWithSession(
      farmPATCH,
      "http://localhost:3000/api/farms/farm-1",
      { name: "X" },
      { method: "PATCH", id: "farm-1" },
    );
    expect(res.status).toBe(403);
    expect(updateFarm).not.toHaveBeenCalled();
  });

  it("DELETE /api/farms/[id] -> 403 when not owner", async () => {
    const res = await callWithSession(
      farmDELETE,
      "http://localhost:3000/api/farms/farm-1",
      undefined,
      { method: "DELETE", id: "farm-1" },
    );
    expect(res.status).toBe(403);
    expect(softDeleteFarm).not.toHaveBeenCalled();
  });

  it("PATCH /api/products/[id] -> 403 when not farm owner", async () => {
    const res = await callWithSession(
      productPATCH,
      "http://localhost:3000/api/products/product-1",
      { name: "X" },
      { method: "PATCH", id: "product-1" },
    );
    expect(res.status).toBe(403);
    expect(updateProduct).not.toHaveBeenCalled();
  });

  it("DELETE /api/products/[id] -> 403 when not farm owner", async () => {
    const res = await callWithSession(
      productDELETE,
      "http://localhost:3000/api/products/product-1",
      undefined,
      { method: "DELETE", id: "product-1" },
    );
    expect(res.status).toBe(403);
    expect(softDeleteProduct).not.toHaveBeenCalled();
  });

  it("POST /api/products -> 403 when not farm owner", async () => {
    const res = await productsPOST(
      makeRequest("http://localhost:3000/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: "Tomatoes",
          price: 4.99,
          description:
            "Ripe and juicy heirloom tomatoes grown without pesticides.",
          category: "vegetables",
          farmId: "farm-1",
        }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({}) },
    );
    expect(res.status).toBe(403);
    expect(createProduct).not.toHaveBeenCalled();
  });
});

describe("public reads still work without auth", () => {
  it("GET /api/farms -> 200", async () => {
    const res = await farmsGET(makeRequest("http://localhost:3000/api/farms"), {
      params: Promise.resolve({}),
    });
    expect(res.status).toBe(200);
  });

  it("GET /api/products -> 200", async () => {
    const res = await productsGET(
      makeRequest("http://localhost:3000/api/products"),
      { params: Promise.resolve({}) },
    );
    expect(res.status).toBe(200);
  });

  it("GET /api/farms/[id] -> 200", async () => {
    const res = await farmItemGET(
      makeRequest("http://localhost:3000/api/farms/farm-1"),
      { params: Promise.resolve({ id: "farm-1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("GET /api/products/[id] -> 200", async () => {
    const res = await productItemGET(
      makeRequest("http://localhost:3000/api/products/product-1"),
      { params: Promise.resolve({ id: "product-1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("GET /api/farms/[id]/reviews -> 200", async () => {
    const res = await farmReviewsGET(
      makeRequest("http://localhost:3000/api/farms/farm-1/reviews"),
      { params: Promise.resolve({ id: "farm-1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("GET /api/products/[id]/reviews -> 200", async () => {
    const res = await productReviewsGET(
      makeRequest("http://localhost:3000/api/products/product-1/reviews"),
      { params: Promise.resolve({ id: "product-1" }) },
    );
    expect(res.status).toBe(200);
  });
});
