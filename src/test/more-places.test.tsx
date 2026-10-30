import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MorePlaces } from "@/components/MorePlaces";
const load = vi.hoisted(() => vi.fn());
vi.mock("@/lib/city-guides", () => ({ loadCityGuide: load }));
const other = {
  name: "Example Observatory",
  lat: 48,
  lon: 2,
  source: "https://example.test/observatory",
  description: "Observatory visit; check opening and prices.",
};
const current = {
  name: "Example Museum",
  lat: 48.1,
  lon: 2.1,
  source: "https://example.test/museum",
  description: "Museum",
};
function setup(props: Partial<React.ComponentProps<typeof MorePlaces>> = {}) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MorePlaces
        destination="Example City"
        days={3}
        current={[{ day: 1, title: current.name, location: current.name }]}
        onAdd={vi.fn(() => true)}
        {...props}
      />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  load.mockResolvedValue({ days: [[current, other]], restaurants: [], curated: false });
});
afterEach(cleanup);
it("does not request or display extra places before the user opens the section", () => {
  setup();
  expect(load).not.toHaveBeenCalled();
  expect(screen.queryByText(other.name)).not.toBeInTheDocument();
});
it("excludes planned places, selects a day, and adds once with source information", async () => {
  const onAdd = vi.fn(() => true);
  setup({ onAdd });
  fireEvent.click(screen.getByText("More places to explore"));
  await screen.findByRole("button", { name: `Add ${other.name} to day 1` });
  expect(screen.queryByRole("heading", { name: current.name })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Add to day"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: `Add ${other.name} to day 2` }));
  await screen.findByText(
    `${other.name} added to day 2. You can edit or remove it in your itinerary.`,
  );
  expect(onAdd).toHaveBeenCalledExactlyOnceWith(other, 2);
  expect(screen.queryByRole("button", { name: /Add Example Observatory/ })).not.toBeInTheDocument();
});
it("keeps a failed addition available for retry", async () => {
  setup({
    onAdd: vi.fn(async () => {
      throw new Error("offline");
    }),
  });
  fireEvent.click(screen.getByText("More places to explore"));
  fireEvent.click(await screen.findByRole("button", { name: `Add ${other.name} to day 1` }));
  await screen.findByRole("alert");
  expect(screen.getByRole("button", { name: `Add ${other.name} to day 1` })).toBeEnabled();
});
it("respects guest day capacity and saved draft-day restrictions", async () => {
  setup({ maxPerDay: 1, unavailableDays: [2] });
  fireEvent.click(screen.getByText("More places to explore"));
  expect(await screen.findByRole("button", { name: `Add ${other.name} to day 1` })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Add to day"), { target: { value: "2" } });
  expect(screen.getByText(/Day 2 is already saved/)).toBeVisible();
  expect(screen.getByRole("button", { name: `Add ${other.name} to day 2` })).toBeDisabled();
});
it("shows an honest unavailable state instead of fabricated alternatives", async () => {
  load.mockRejectedValue(new Error("offline"));
  setup();
  fireEvent.click(screen.getByText("More places to explore"));
  await waitFor(() => expect(screen.getByText(/More places are unavailable/)).toBeVisible());
});

it("shows three backup places immediately and excludes only this day's planned visits", async () => {
  const alternatives = [
    other,
    { ...other, name: "Example Garden" },
    { ...other, name: "Example Square" },
  ];
  load.mockResolvedValue({ days: [[current, ...alternatives]], restaurants: [], curated: false });
  setup({
    backups: true,
    current: [
      { day: 1, location: current.name },
      { day: 2, location: other.name },
    ],
  });
  expect(await screen.findByRole("button", { name: `Add ${other.name} to day 1` })).toBeVisible();
  expect(screen.getAllByRole("button", { name: /^Add .* to day 1$/ })).toHaveLength(3);
  expect(screen.queryByRole("heading", { name: current.name })).not.toBeInTheDocument();
});
