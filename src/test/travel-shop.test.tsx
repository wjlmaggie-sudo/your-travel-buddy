import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/travel-preferences", async () => {
  const { useState } = await import("react");
  return {
    useTripPreferences: () => {
      const [preference, set] = useState({
        travelers: 2,
        style: "Balanced",
        interest: "Food & culture",
        packing: [] as string[],
      });
      return {
        preference,
        save: async (next: typeof preference) => set(next),
        isPending: false,
        isError: false,
      };
    },
  };
});
import { TravelShop } from "@/components/TravelShop";
afterEach(cleanup);
describe("travel shopping", () => {
  it("searches products, builds destination searches, and updates packing", async () => {
    render(<TravelShop tripId="trip" destination="Lisbon, Portugal" />);
    fireEvent.change(screen.getByLabelText("Search products"), { target: { value: "backpack" } });
    expect(screen.getAllByRole("button", { name: "Add to packing list" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Find local shops" }).getAttribute("href")).toContain(
      "backpack%20Lisbon%2C%20Portugal",
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to packing list" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Remove Everyday travel backpack" }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Everyday travel backpack" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Remove Everyday travel backpack" }),
      ).not.toBeInTheDocument(),
    );
  });
});
