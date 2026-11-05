import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TravelCompanion } from "@/components/TravelCompanion";
import { makeCompanionTrip, readCompanionTrips, saveCompanionTrip } from "@/lib/travel-companion";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useRouterState: () => ({ location: { pathname: "/on-trip" } }),
}));
vi.mock("@/components/DayWeather", () => ({
  DayWeather: ({ destination, date }: { destination: string; date: string }) => (
    <span role="status" aria-label="Day weather">
      {destination} · {date}
    </span>
  ),
}));
vi.mock("@/components/AppNavigation", () => ({ AppNavigation: () => null }));
vi.mock("@/lib/native-app", () => ({
  NATIVE_APP: false,
  isNative: () => false,
  cancelTripReminder: vi.fn().mockResolvedValue(undefined),
  shareItinerary: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  saveCompanionTrip(
    makeCompanionTrip({
      brief: {
        destination: "Lisbon",
        start: "2030-06-10",
        days: 1,
        travelers: 2,
        budget: 100,
        currency: "EUR",
        style: "Balanced",
      },
      days: [
        {
          day: 1,
          items: [
            { title: "Alfama", time: "10:00" },
            { title: "Belém", time: "14:00" },
          ],
        },
      ],
    }),
  );
});
afterEach(cleanup);
function show() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <TravelCompanion requestedId={undefined} />
    </QueryClientProvider>,
  );
}
it("advances the next stop and keeps progress across remounts", () => {
  const view = show();
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  expect(readCompanionTrips()[0]?.stops[0]?.status).toBe("done");
  view.unmount();
  show();
  expect(screen.getByRole("region", { name: "Next activity" })).toHaveTextContent("Belém");
});
it("records spending on the device and never describes it as cloud synced", () => {
  show();
  fireEvent.click(screen.getByRole("tab", { name: "Spending" }));
  fireEvent.change(screen.getByLabelText("Amount (EUR)"), { target: { value: "12.50" } });
  fireEvent.change(screen.getByLabelText("Note"), { target: { value: "Lunch" } });
  fireEvent.click(screen.getByRole("button", { name: "Save expense on device" }));
  expect(readCompanionTrips()[0]?.localExpenses[0]).toMatchObject({ amount: 12.5, note: "Lunch" });
  expect(screen.getByText(/separate from the cloud spending tracker/)).toBeVisible();
});

it("shows credited activity photos on Today, including previously saved stops", () => {
  show();
  const photos = screen.getAllByRole("img", { name: "Alfama" });
  expect(photos).toHaveLength(2);
  for (const photo of photos)
    expect(photo.getAttribute("src")).toContain("images/lisbon/landmark-0.jpg");
  expect(screen.getAllByRole("link", { name: /Photo: Arne/ })).toHaveLength(2);
});

it("includes destination weather for the selected itinerary date in Today", () => {
  show();
  expect(screen.getByRole("status", { name: "Day weather" })).toHaveTextContent(
    "Lisbon · 2030-06-10",
  );
});
