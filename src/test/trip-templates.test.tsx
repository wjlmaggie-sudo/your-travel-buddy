import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TripTemplates } from "@/components/TripTemplates";

afterEach(cleanup);
describe("trip discovery", () => {
  it("filters templates and selects the requested trip", () => {
    const select = vi.fn();
    render(<TripTemplates onSelect={select} />);
    expect(screen.getAllByRole("button", { name: "Use template" })).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Food & culture" }));
    expect(screen.getAllByRole("button", { name: "Use template" })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "A taste of Kyoto" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use template" }));
    expect(select).toHaveBeenCalledWith("kyoto");
  });
});
