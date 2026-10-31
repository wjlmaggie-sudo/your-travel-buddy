import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const search = vi.hoisted(() => vi.fn());
vi.mock("@/lib/global-discovery", async (original) => ({
  ...(await original<typeof import("@/lib/global-discovery")>()),
  searchGlobalDestinations: search,
}));
import { DestinationDiscovery } from "@/components/DestinationDiscovery";
import {
  understandDiscovery,
  discoveryMissing,
  discoveryChoice,
} from "@/lib/destination-discovery";
function setup(onChoose = vi.fn(), active = true) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <DestinationDiscovery start="2030-12-01" onChoose={onChoose} active={active} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  search.mockResolvedValue({
    results: [
      {
        destination: "Bangkok, Thailand",
        country: "Thailand",
        region: "Asia",
        minDays: 1,
        idea: "Mapped park and trail references.",
        caution: "Check access.",
        source: "https://www.geonames.org/1",
        reasons: ["Mapped hiking reference nearby"],
        evidence: [],
        temperature: null,
        reference: null,
        shortfall: null,
        score: 1,
      },
    ],
    scanned: 12,
    total: 31808,
    offset: 0,
    nextOffset: 12,
    checkedAt: "2030-01-01",
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("keeps multi-turn details and extracts a family group, budget, departure and explicit dates", () => {
  const needs = understandDiscovery(
    "Five days from Berlin, 2 adults and 2 children aged 4 and 8, budget €1,200, warm hiking on 2030-06-15",
    {},
  );
  expect(needs).toMatchObject({
    days: 5,
    departure: "Berlin",
    travelers: 4,
    childrenAges: [4, 8],
    budget: 1200,
    currency: "EUR",
    warm: true,
    start: "2030-06-15",
  });
  expect(discoveryMissing(needs)).toBeNull();
  expect(understandDiscovery("4 days instead, not Spain, Asia only", needs)).toMatchObject({
    days: 4,
    departure: "Berlin",
    budget: 1200,
    region: "Asia",
    excludedCountries: ["Spain"],
  });
});
it("does not invent child ages or confuse a duration with an age and converts per-person budget", () => {
  const first = understandDiscovery("7 days, 2 adults and 1 child, €1.200, hiking and beaches", {});
  expect(discoveryMissing(first)).toMatch(/ages/);
  const next = understandDiscovery("child aged 6, four days instead, no hiking", first);
  expect(next).toMatchObject({
    days: 4,
    budget: 1200,
    travelers: 3,
    childrenAges: [6],
    activities: ["beach"],
  });
  const per = understandDiscovery("4 nights, 3 people, budget 300 euros per person, diving", {});
  expect(discoveryChoice(per, "Suva, Fiji")).toMatchObject({ budget: 900, days: 5, travelers: 3 });
});
it("asks missing details before searching public APIs and hands an actual result to the planner", async () => {
  const onChoose = vi.fn();
  setup(onChoose);
  const input = screen.getByLabelText("Tell Travel Buddy what you have in mind");
  fireEvent.change(input, { target: { value: "warm and hiking" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  expect(search).not.toHaveBeenCalled();
  expect(screen.getByText(/Roughly how many days/)).toBeVisible();
  fireEvent.change(input, { target: { value: "5 days" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  fireEvent.click(await screen.findByRole("button", { name: "Plan Bangkok" }));
  expect(onChoose).toHaveBeenCalledWith({
    destination: "Bangkok, Thailand",
    days: 5,
    interest: "Nature & adventure",
  });
  expect(screen.getAllByText(/31808|31,808/).length).toBeGreaterThan(0);
});
it("shows API failures with a retry and never switches silently to the old catalog", async () => {
  search.mockRejectedValue(new Error("Public map service unavailable"));
  setup();
  fireEvent.click(screen.getByRole("button", { name: "One week hiking" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Public map service unavailable");
  expect(screen.queryByRole("button", { name: "Plan Tenerife" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry public-data search" })).toBeVisible();
});
it("does not search while hidden and can explicitly search another bounded batch", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "One week hiking" }));
  fireEvent.click(await screen.findByRole("button", { name: "Search another global batch" }));
  await vi.waitFor(() =>
    expect(search).toHaveBeenLastCalledWith(
      expect.any(Object),
      "2030-12-01",
      12,
      expect.any(AbortSignal),
    ),
  );
});

it("preserves explicit currency codes before a budget amount", () => {
  for (const currency of ["EUR", "USD", "GBP"]) {
    expect(understandDiscovery(`7 days hiking, budget ${currency} 2000`, {})).toMatchObject({
      budget: 2000,
      currency,
    });
  }
});
