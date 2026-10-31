import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { DestinationDiscovery } from "@/components/DestinationDiscovery";
import {
  understandDiscovery,
  discoverDestinations,
  discoveryMissing,
  discoveryChoice,
} from "@/lib/destination-discovery";
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
    start: "2027-07-01",
  });
});

it("extracts group, child ages, budget, departure and dates from one message", () => {
  const needs = understandDiscovery(
    "We have five days from Berlin, two adults and two children aged 4 and 8, budget €1,200, warm weather and hiking on 2027-06-15",
    {},
  );
  expect(needs).toMatchObject({
    days: 5,
    departure: "Berlin",
    adults: 2,
    travelers: 4,
    childrenAges: [4, 8],
    budget: 1200,
    currency: "EUR",
    warm: true,
    start: "2027-06-15",
    family: true,
  });
  expect(discoveryMissing(needs)).toBeNull();
  expect(discoveryChoice(needs, "Tenerife, Spain")).toMatchObject({
    travelers: 4,
    childrenAges: [4, 8],
    budget: 1200,
    departure: "Berlin",
    start: "2027-06-15",
    persona: "family",
  });
});
it("keeps context, applies corrections and never guesses missing child ages", () => {
  const first = understandDiscovery("7 days, 2 adults and 1 child, €1.200, hiking and beaches", {});
  expect(first.budget).toBe(1200);
  expect(discoveryMissing(first)).toMatch(/ages/);
  const next = understandDiscovery("child aged 6, four days instead, no hiking", first);
  expect(next).toMatchObject({
    days: 4,
    budget: 1200,
    travelers: 3,
    childrenAges: [6],
    activities: ["beach"],
  });
  expect(discoverDestinations(next, "2027-07-01").every((d) => d.tags.includes("beach"))).toBe(
    true,
  );
});
it("converts per-person budget only with a known party and recognizes named dates and nights", () => {
  const first = understandDiscovery("4 nights, beaches, budget 300 euros per person", {});
  expect(first.days).toBe(5);
  expect(discoveryMissing(first)).toMatch(/How many people/);
  const next = understandDiscovery("3 people, leaving Paris, on 15 June 2027", first);
  expect(discoveryChoice(next, "Tenerife, Spain")).toMatchObject({
    budget: 900,
    currency: "EUR",
    start: "2027-06-15",
    departure: "Paris",
  });
});
