import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Rating } from "@/components/ui/Rating";

describe("Rating", () => {
  it("renders correct ARIA label", () => {
    render(<Rating value={4} />);
    expect(screen.getByLabelText("Rating: 4 out of 5")).toBeInTheDocument();
  });

  it("renders 5 stars by default", () => {
    const { container } = render(<Rating value={3} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(5);
  });

  it("applies filled class correctly", () => {
    const { container } = render(<Rating value={3} />);
    const filledStars = container.querySelectorAll(".fill-amber-400");
    expect(filledStars.length).toBe(3);
  });
});
