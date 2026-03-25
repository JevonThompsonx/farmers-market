import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Select } from "@/components/ui/Select";

describe("Select", () => {
  const options = [
    { value: "1", label: "Option 1" },
    { value: "2", label: "Option 2" },
  ];

  it("renders with options", () => {
    render(<Select options={options} label="Choice" id="choice" />);
    expect(screen.getByLabelText("Choice")).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("fires onChange on selection", () => {
    const handleChange = vi.fn();
    render(<Select options={options} label="Choice" id="choice" onChange={handleChange} />);
    const select = screen.getByLabelText("Choice");
    fireEvent.change(select, { target: { value: "2" } });
    expect(handleChange).toHaveBeenCalled();
  });

  it("renders with a placeholder", () => {
    render(<Select options={options} placeholder="Select one" />);
    expect(screen.getByText("Select one")).toBeInTheDocument();
    expect(screen.getByText("Select one")).toBeDisabled();
  });
});
