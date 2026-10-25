import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { useState } from "react";
import { TravelWorkspace, WorkspacePanel } from "@/components/TravelWorkspace";
import type { TravelSection } from "@/lib/travel-workspace";
afterEach(cleanup);
it("preserves edits in mounted views while switching document sections", () => {
  function Example() {
    const [section, setSection] = useState<TravelSection>("planner");
    return (
      <TravelWorkspace section={section} onChange={setSection}>
        <WorkspacePanel active={section === "planner"} label="Overview">
          <input aria-label="Trip notes" defaultValue="Plan" />
        </WorkspacePanel>
        <WorkspacePanel active={section === "flights"} label="Flights view">
          Flight cards
        </WorkspacePanel>
      </TravelWorkspace>
    );
  }
  render(<Example />);
  const first = screen.getByRole("region", { name: "Overview" });
  fireEvent.change(screen.getByLabelText("Trip notes"), { target: { value: "My edited plan" } });
  fireEvent.click(screen.getByRole("button", { name: "Flights" }));
  expect(first).toHaveAttribute("hidden");
  const flight = screen.getByRole("region", { name: "Flights view" });

  fireEvent.click(screen.getByRole("button", { name: "AI Travel Planner" }));
  expect(screen.getByRole("region", { name: "Overview" })).toBe(first);
  expect(screen.getByLabelText("Trip notes")).toHaveValue("My edited plan");
  fireEvent.click(screen.getByRole("button", { name: "Flights" }));
  expect(screen.getByRole("region", { name: "Flights view" })).toBe(flight);
});
