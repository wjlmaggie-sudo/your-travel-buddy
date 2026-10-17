import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import { AccommodationPlanner } from "@/components/AccommodationPlanner";
import type { StayChoice } from "@/lib/stay-planning";
const brief = {
  destination: "Lisbon",
  start: "2026-10-17",
  days: 5,
  travelers: 2,
  budget: 1500,
  currency: "EUR",
  style: "Balanced" as const,
};
function Preview() {
  const [choice, setChoice] = useState<StayChoice | null>(null);
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AccommodationPlanner brief={brief} choice={choice} onChoose={setChoice} />
    </QueryClientProvider>
  );
}
afterEach(cleanup);
describe("choosing accommodation", () => {
  it("compares multiple entered quotes and updates remaining group cost without booking", async () => {
    render(<Preview />);
    fireEvent.change(screen.getByLabelText("Hotel / hostel name"), {
      target: { value: "First quoted hotel" },
    });
    fireEvent.change(screen.getByLabelText("Quoted price (EUR)"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Price is for"), { target: { value: "room-night" } });
    fireEvent.click(screen.getByRole("button", { name: "Choose & recalculate" }));
    await screen.findByText("€1,100.00 left for food, tickets, local transport and buffer.");
    fireEvent.change(screen.getByLabelText("Hotel / hostel name"), {
      target: { value: "Second quoted hostel" },
    });
    fireEvent.change(screen.getByLabelText("Quoted price (EUR)"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("Price is for"), { target: { value: "person-night" } });
    fireEvent.click(screen.getByRole("button", { name: "Choose & recalculate" }));
    await screen.findByText("€1,260.00 left for food, tickets, local transport and buffer.");
    expect(screen.getByRole("heading", { name: "First quoted hotel" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Second quoted hostel" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choose this option" }));
    await screen.findByText("€1,100.00 left for food, tickets, local transport and buffer.");
  });
});
