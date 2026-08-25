import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/queries/farms", () => ({
  getFarmById: vi.fn(),
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

vi.mock("@/server/services/image.service", () => ({
  fetchAndStoreImage: vi
    .fn()
    .mockResolvedValue("https://res.cloudinary.com/test/image.webp"),
  hydrateImageAsync: vi.fn(),
  PLACEHOLDER_IMAGE: "/placeholder.svg",
}));

vi.mock("server-only", () => ({}));

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

import { GET, POST } from "@/app/api/products/route";
import { getProducts, createProduct } from "@/server/queries/products";
import { getFarmById } from "@/server/queries/farms";
import { getUserId } from "@/lib/auth";
import { type Farm } from "@/server/db/schema";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

const mockProduct = {
  id: "product-1",
  name: "Heirloom Tomatoes",
  price: 4.99,
  description: "Ripe and juicy heirloom tomatoes.",
  category: "vegetables" as const,
  image: "https://res.cloudinary.com/test/image.webp",
  farmId: "farm-1",
  rating: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
};

function makeRequest(
  url: string,
  options?: Omit<RequestInit, "signal"> & { signal?: AbortSignal },
) {
  return new NextRequest(
    url,
    options as ConstructorParameters<typeof NextRequest>[1],
  );
}

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.mocked(getProducts).mockResolvedValue([
      {
        id: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        description: mockProduct.description,
        category: mockProduct.category,
        image: mockProduct.image,
        farmId: mockProduct.farmId,
        rating: mockProduct.rating,
        createdAt: mockProduct.createdAt,
      },
    ]);
  });

  it("returns 200 with data array", async () => {
    const req = makeRequest("http://localhost:3000/api/products");
    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("passes category filter to getProducts", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/products?category=vegetables",
    );
    await GET(req, { params: Promise.resolve({}) });
    expect(getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ category: "vegetables" }),
    );
  });

  it("passes farmId filter to getProducts", async () => {
    const req = makeRequest("http://localhost:3000/api/products?farmId=farm-1");
    await GET(req, { params: Promise.resolve({}) });
    expect(getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ farmId: "farm-1" }),
    );
  });

  it("passes pagination params to getProducts", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/products?page=2&limit=10",
    );
    await GET(req, { params: Promise.resolve({}) });
    expect(getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 }),
    );
  });
});

describe("POST /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserId).mockResolvedValue("user-1");
    vi.mocked(getFarmById).mockResolvedValue({
      ownerId: "user-1",
    } as unknown as Farm);
    vi.mocked(createProduct).mockResolvedValue(mockProduct);
  });

  const validBody = {
    name: "Heirloom Tomatoes",
    price: 4.99,
    description: "Ripe and juicy heirloom tomatoes grown without pesticides.",
    category: "vegetables",
    farmId: "farm-1",
  };

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getUserId).mockRejectedValue(new UnauthorizedError());
    const req = makeRequest("http://localhost:3000/api/products", {
      method: "POST",
      body: JSON.stringify(validBody),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(401);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("returns 403 when user does not own the farm", async () => {
    vi.mocked(getFarmById).mockResolvedValue({
      ownerId: "other-user",
    } as unknown as Farm);
    const req = makeRequest("http://localhost:3000/api/products", {
      method: "POST",
      body: JSON.stringify(validBody),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(403);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("returns 201 with created product on valid input for farm owner", async () => {
    const req = makeRequest("http://localhost:3000/api/products", {
      method: "POST",
      body: JSON.stringify(validBody),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: typeof mockProduct };
    expect(body.data.name).toBe("Heirloom Tomatoes");
  });

  it("returns 400 on invalid category", async () => {
    const req = makeRequest("http://localhost:3000/api/products", {
      method: "POST",
      body: JSON.stringify({ ...validBody, category: "snacks" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
  });

  it("returns 400 on missing required fields", async () => {
    const req = makeRequest("http://localhost:3000/api/products", {
      method: "POST",
      body: JSON.stringify({ name: "Tomatoes" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("ValidationError");
  });
});
