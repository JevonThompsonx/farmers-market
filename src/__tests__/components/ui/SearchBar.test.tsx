import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, type MockedFunction } from "vitest";
import { SearchBar } from "@/components/ui/SearchBar";
import { useRouter } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("SearchBar", () => {
  it("renders with initial value", () => {
    render(<SearchBar initialValue="test" />);
    const input = screen.getByLabelText("Search products") as HTMLInputElement;
    expect(input.value).toBe("test");
  });

  it("fires router.push on form submit with valid query", () => {
    const pushMock = vi.fn();
    (useRouter as MockedFunction<typeof useRouter>).mockReturnValue({ push: pushMock, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() });

    render(<SearchBar />);
    const input = screen.getByLabelText("Search products");
    fireEvent.change(input, { target: { value: "carrot" } });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith("/search?q=carrot");
  });

  it("does not fire router.push with query < 2 chars", () => {
    const pushMock = vi.fn();
    (useRouter as MockedFunction<typeof useRouter>).mockReturnValue({ push: pushMock, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), replace: vi.fn(), prefetch: vi.fn() });

    render(<SearchBar />);
    const input = screen.getByLabelText("Search products");
    fireEvent.change(input, { target: { value: "c" } });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).not.toHaveBeenCalled();
  });
});
