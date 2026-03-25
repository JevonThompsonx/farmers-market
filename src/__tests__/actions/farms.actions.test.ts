import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  assertOwnership: vi.fn(),
}));

vi.mock("@/server/queries/farms", () => ({
  createFarm: vi.fn(),
  updateFarm: vi.fn(),
  softDeleteFarm: vi.fn(),
  getFarmById: vi.fn(),
  getAllFarmIds: vi.fn(),
  updateFarmRating: vi.fn(),
}));

vi.mock("@/server/services/image.service", () => ({
  fetchAndStoreImage: vi.fn().mockResolvedValue("https://res.cloudinary.com/test/image.webp"),
}));

import { createFarm, deleteFarm } from "@/server/actions/farms";
import { auth, assertOwnership } from "@/lib/auth";
import { createFarm as insertFarm, getFarmById, softDeleteFarm } from "@/server/queries/farms";
import { fetchAndStoreImage } from "@/server/services/image.service";
import { UnauthorizedError } from "@/lib/errors";
import { redirect } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySession = any;

const mockSession = { user: { id: "user-1", name: "Test User", email: "test@example.com" } };

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

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe("createFarm action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as AnySession);
    vi.mocked(insertFarm).mockResolvedValue(mockFarm);
    vi.mocked(fetchAndStoreImage).mockResolvedValue("https://res.cloudinary.com/test/image.webp");
    vi.mocked(redirect).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("throws UnauthorizedError when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const fd = makeFormData({
      name: "Sunrise Farm",
      city: "Portland",
      state: "OR",
      description: "A lovely organic farm.",
    });
    await expect(createFarm(undefined, fd)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("returns error when validation fails", async () => {
    const fd = makeFormData({ name: "A", city: "Portland", state: "OR", description: "Short" });
    const result = await createFarm(undefined, fd);
    expect(result?.error).toBeDefined();
  });

  it("redirects to new farm page on success", async () => {
    const fd = makeFormData({
      name: "Sunrise Farm",
      city: "Portland",
      state: "OR",
      description: "A lovely organic farm in the Pacific Northwest.",
      email: "",
      website: "",
    });
    await expect(createFarm(undefined, fd)).rejects.toThrow(/REDIRECT:\/farms\//);
    expect(insertFarm).toHaveBeenCalled();
  });
});

describe("deleteFarm action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as AnySession);
    vi.mocked(getFarmById).mockResolvedValue(mockFarm);
    vi.mocked(softDeleteFarm).mockResolvedValue(undefined);
    vi.mocked(assertOwnership).mockReturnValue(undefined);
    vi.mocked(redirect).mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
  });

  it("throws UnauthorizedError when not authenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    await expect(deleteFarm("farm-1")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("calls softDeleteFarm and redirects on success", async () => {
    await expect(deleteFarm("farm-1")).rejects.toThrow("REDIRECT:/farms");
    expect(softDeleteFarm).toHaveBeenCalledWith("farm-1");
  });
});
