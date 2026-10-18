import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LocalShopping } from "@/components/LocalShopping";
import { nearbyPlaces, searchDestinations } from "@/lib/place-directory";
vi.mock("@/lib/place-directory", () => ({ nearbyPlaces: vi.fn(), searchDestinations: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("separates mapped store results from verified product stock and prices", async () => {
  vi.mocked(searchDestinations).mockResolvedValue([
    { name: "Barcelona", lat: 41.4, lon: 2.1, source: "https://en.wikipedia.org/wiki/Barcelona" },
  ]);
  vi.mocked(nearbyPlaces).mockResolvedValue([
    {
      id: "node/1",
      name: "Example Beauty Shop",
      category: "Shops",
      kind: "cosmetics",
      lat: 41.4,
      lon: 2.1,
      address: "Example street",
      openingHours: "",
      source: "https://www.openstreetmap.org/node/1",
    },
  ]);
  render(<LocalShopping destination="Barcelona" />);
  fireEvent.change(screen.getByLabelText("Product or store"), {
    target: { value: "skincare serum" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Find local shops" }));
  fireEvent.click(await screen.findByRole("button", { name: "Barcelona" }));
  expect(await screen.findByText("Example Beauty Shop")).toBeVisible();
  expect(screen.getByText(/Product availability unknown · Price unknown/)).toBeVisible();
  expect(screen.getByRole("link", { name: /Directions/ })).toHaveAttribute(
    "href",
    "https://www.google.com/maps/dir/?api=1&destination=41.4,2.1",
  );
  expect(screen.getByText(/A result is not evidence/)).toBeVisible();
});
