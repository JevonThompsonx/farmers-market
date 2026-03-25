import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/Card";

describe("Card", () => {
  it("renders children in each slot", () => {
    render(
      <Card>
        <CardHeader>Header Content</CardHeader>
        <CardBody>Body Content</CardBody>
        <CardFooter>Footer Content</CardFooter>
      </Card>
    );
    expect(screen.getByText("Header Content")).toBeInTheDocument();
    expect(screen.getByText("Body Content")).toBeInTheDocument();
    expect(screen.getByText("Footer Content")).toBeInTheDocument();
  });

  it("applies custom class names", () => {
    const { container } = render(<Card className="custom-card" />);
    expect(container.firstChild).toHaveClass("custom-card");
  });
});
