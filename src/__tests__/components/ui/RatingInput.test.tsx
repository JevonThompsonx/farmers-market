import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RatingInput } from "@/components/ui/RatingInput";

describe("RatingInput", () => {
  it("clicking a star sets the rating value", () => {
    const handleChange = vi.fn();
    render(<RatingInput name="rating" value={0} onChange={handleChange} />);
    const thirdStar = screen.getByLabelText("3 stars");
    fireEvent.click(thirdStar);
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it("highlights stars on hover", () => {
    const { container } = render(<RatingInput name="rating" value={0} />);
    const fourthStar = screen.getByLabelText("4 stars");
    fireEvent.mouseEnter(fourthStar);
    const filledStars = container.querySelectorAll(".fill-amber-400");
    expect(filledStars.length).toBe(4);
  });

  it("displays current value stars", () => {
    const { container } = render(<RatingInput name="rating" value={4} />);
    const filledStars = container.querySelectorAll(".fill-amber-400");
    expect(filledStars.length).toBe(4);
  });
});
