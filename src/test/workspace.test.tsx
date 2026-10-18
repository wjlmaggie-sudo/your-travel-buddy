import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { useState } from "react";
import { TravelWorkspace, WorkspacePanel } from "@/components/TravelWorkspace";
import type { TravelSection } from "@/lib/travel-workspace";
afterEach(cleanup);
it("preserves each mounted view and its scroll offset while switching", () => {
  function Example() {
    const [section, setSection] = useState<TravelSection>("planner");
    return (
      <TravelWorkspace section={section} onChange={setSection}>
        <WorkspacePanel active={section === "planner"} label="Overview">
          Plan
        </WorkspacePanel>
        <WorkspacePanel active={section === "flights"} label="Flights view">
          Flight cards
        </WorkspacePanel>
      </TravelWorkspace>
    );
  }
  render(<Example />);
  const first = screen.getByRole("region", { name: "Overview" });
  first.scrollTop = 320;
  fireEvent.click(screen.getByRole("button", { name: "Flights" }));
  expect(first).toHaveAttribute("hidden");
  const flight = screen.getByRole("region", { name: "Flights view" });
  flight.scrollTop = 120;
  fireEvent.click(screen.getByRole("button", { name: "AI Travel Planner" }));
  expect(screen.getByRole("region", { name: "Overview" })).toBe(first);
  expect(first.scrollTop).toBe(320);
  fireEvent.click(screen.getByRole("button", { name: "Flights" }));
  expect(flight.scrollTop).toBe(120);
});
