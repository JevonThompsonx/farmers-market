import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  it("renders with a label", () => {
    render(<Input label="Username" id="username" />);
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
  });

  it("shows error message when error prop is provided", () => {
    render(<Input label="Username" id="username" error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("fires onChange event", () => {
    const handleChange = vi.fn();
    render(<Input label="Username" id="username" onChange={handleChange} />);
    const input = screen.getByLabelText("Username");
    fireEvent.change(input, { target: { value: "test" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("updates value based on props", () => {
    render(<Input label="Username" id="username" value="initial" readOnly />);
    const input = screen.getByLabelText("Username") as HTMLInputElement;
    expect(input.value).toBe("initial");
  });
});
