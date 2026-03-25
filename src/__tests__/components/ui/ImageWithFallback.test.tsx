import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";

// Mock next/image since it's hard to test in jsdom
vi.mock("next/image", () => ({
  default: ({ src, alt, onError, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      onError={onError}
      {...props}
    />
  ),
}));

describe("ImageWithFallback", () => {
  it("renders with initial source", () => {
    render(<ImageWithFallback src="/test.jpg" alt="Test image" width={100} height={100} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/test.jpg");
    expect(img).toHaveAttribute("alt", "Test image");
  });

  it("switches to fallback source on error", () => {
    render(
      <ImageWithFallback
        src="/error.jpg"
        fallbackSrc="/fallback.svg"
        alt="Test image"
        width={100}
        height={100}
      />
    );
    const img = screen.getByRole("img");

    // Manually trigger error
    fireEvent.error(img);

    expect(img).toHaveAttribute("src", "/fallback.svg");
    expect(img).toHaveClass("opacity-60");
  });
});
