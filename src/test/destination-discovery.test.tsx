import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { DestinationDiscovery } from "@/components/DestinationDiscovery";
import { understandDiscovery, discoverDestinations } from "@/lib/destination-discovery";
afterEach(cleanup);
it("remembers weather and duration across replies and refines activities", () => {
  const first = understandDiscovery("five days somewhere warm", {});
  expect(first).toMatchObject({ days: 5, warm: true });
  const next = understandDiscovery("hiking", first);
  expect(next).toMatchObject({ days: 5, warm: true, activity: "hiking" });
  expect(discoverDestinations(next, "2026-12-01").map((d) => d.destination)).toEqual([
    "Tenerife, Spain",
  ]);
  expect(understandDiscovery("two weeks", next).days).toBe(14);
});
it("does not promise unrelated places for unsupported activities or invent a length", () => {
  expect(discoverDestinations(understandDiscovery("7 days skiing", {}), "2026-12-01")).toEqual([]);
  expect(understandDiscovery("50 days warm", {}).days).toBeUndefined();
});
it("asks for duration then carries an explicit selection into the planner", () => {
  const onChoose = vi.fn();
  render(<DestinationDiscovery start="2026-12-01" onChoose={onChoose} />);
  const input = screen.getByLabelText("Tell Travel Buddy what you have in mind");
  fireEvent.change(input, { target: { value: "warm weather and hiking" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(screen.getByText(/Roughly how many days/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Plan Tenerife" })).not.toBeInTheDocument();
  fireEvent.change(input, { target: { value: "5 days" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(screen.getByText(/curated matching, not live AI/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Plan Tenerife" }));
  expect(onChoose).toHaveBeenCalledWith({
    destination: "Tenerife, Spain",
    days: 5,
    interest: "Nature & adventure",
  });
  fireEvent.click(screen.getByRole("button", { name: "Start over" }));
  expect(screen.queryByRole("button", { name: "Plan Tenerife" })).not.toBeInTheDocument();
});
it("lets a guest adjust the season and carries the family persona without guessing child ages", () => {
  const onChoose = vi.fn(),
    onStartChange = vi.fn();
  render(
    <DestinationDiscovery start="2026-12-01" onChoose={onChoose} onStartChange={onStartChange} />,
  );
  fireEvent.change(screen.getByLabelText("Rough departure date"), {
    target: { value: "2027-07-01" },
  });
  expect(onStartChange).toHaveBeenCalledWith("2027-07-01");
  fireEvent.click(screen.getByRole("button", { name: "3 days with family" }));
  fireEvent.click(screen.getByRole("button", { name: "Plan Lisbon" }));
  expect(onChoose).toHaveBeenCalledWith({
    destination: "Lisbon, Portugal",
    days: 3,
    interest: "Food & culture",
    persona: "family",
  });
});
