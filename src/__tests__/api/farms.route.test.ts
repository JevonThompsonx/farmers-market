import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock logger to avoid pino-pretty transport error in test env
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock the DAL and image service before importing route handlers
vi.mock("@/server/queries/farms", () => ({
  getFarms: vi.fn(),
  createFarm: vi.fn(),
  getFarmById: vi.fn(),
  updateFarm: vi.fn(),
  softDeleteFarm: vi.fn(),
  getAllFarmIds: vi.fn(),
  updateFarmRating: vi.fn(),
}));

vi.mock("@/server/services/image.service", () => ({
  fetchAndStoreImage: vi.fn().mockResolvedValue("https://res.cloudinary.com/test/image.webp"),
}));

// Mock server-only so it doesn't throw in test environment
vi.mock("server-only", () => ({}));

// Mock next-auth so auth() doesn't attempt real session lookup
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
  assertOwnership: vi.fn(),
}));

import { GET, POST } from "@/app/api/farms/route";
import { getFarms, createFarm } from "@/server/queries/farms";

const mockFarm = {
  id: "farm-1",
  name: "Sunrise Farm",
  city: "Portland",
  state: "OR",
  description: "A lovely organic farm.",
  email: null,
  website: null,
  image: "https://res.cloudinary.com/test/image.webp",
  ownerId: "user-1",
  rating: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
};

function makeRequest(url: string, options?: Omit<RequestInit, "signal"> & { signal?: AbortSignal }) {
  return new NextRequest(url, options as ConstructorParameters<typeof NextRequest>[1]);
}

describe("GET /api/farms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFarms).mockResolvedValue([
      { id: mockFarm.id, name: mockFarm.name, city: mockFarm.city, state: mockFarm.state,
        description: mockFarm.description, image: mockFarm.image, rating: mockFarm.rating,
        createdAt: mockFarm.createdAt },
    ]);
  });

  it("returns 200 with data array", async () => {
    const req = makeRequest("http://localhost:3000/api/farms");
    const res = await GET(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(200);
    const body = await res.json() as { data: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it("calls getFarms once", async () => {
    const req = makeRequest("http://localhost:3000/api/farms");
    await GET(req, { params: Promise.resolve({}) });
    expect(getFarms).toHaveBeenCalledOnce();
  });
});

describe("POST /api/farms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createFarm).mockResolvedValue(mockFarm);
  });

  const validBody = {
    name: "Sunrise Farm",
    city: "Portland",
    state: "OR",
    description: "A lovely organic farm in the Pacific Northwest.",
  };

  it("returns 201 with created farm on valid input", async () => {
    const req = makeRequest("http://localhost:3000/api/farms", {
      method: "POST",
      body: JSON.stringify(validBody),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(201);
    const body = await res.json() as { data: typeof mockFarm };
    expect(body.data.name).toBe("Sunrise Farm");
  });

  it("returns 400 on invalid input", async () => {
    const req = makeRequest("http://localhost:3000/api/farms", {
      method: "POST",
      body: JSON.stringify({ name: "A" }), // too short, missing required fields
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, { params: Promise.resolve({}) });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("ValidationError");
  });
});
