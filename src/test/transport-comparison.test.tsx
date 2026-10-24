import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransportComparison } from "@/components/TransportComparison";
import { fetchTransport, transportEndpoint } from "@/lib/transport-routes";
vi.mock("@/lib/transport-routes", async (original) => ({
  ...(await original<typeof import("@/lib/transport-routes")>()),
  transportEndpoint: vi.fn(() => "https://example.com/transport-routes"),
  fetchTransport: vi.fn(),
}));
const places = [
  { name: "Alfama", lat: 38.71, lon: -9.13, source: "https://example.com", description: "" },
  { name: "Castle", lat: 38.72, lon: -9.14, source: "https://example.com", description: "" },
];
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.mocked(transportEndpoint).mockReturnValue("https://example.com/transport-routes");
});
describe("transport comparison", () => {
  it("keeps guest searches manual and offers all three fallback links without credentials", () => {
    vi.mocked(transportEndpoint).mockReturnValue(null);
    render(<TransportComparison places={places} destination="Lisbon" day={1} />);
    expect(fetchTransport).not.toHaveBeenCalled();
    expect(screen.getByText(/In-app journey times are not connected/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Journey details & information"));
    expect(screen.getByRole("link", { name: "Open public transport directions" })).toHaveAttribute(
      "href",
      expect.stringContaining("travelmode=transit"),
    );
    expect(screen.getByRole("link", { name: "Open walking directions" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open car directions" })).toBeInTheDocument();
  });
  it("limits clearly labeled design times to the reviewed route and clears them on edits", () => {
    vi.mocked(transportEndpoint).mockReturnValue(null);
    render(
      <TransportComparison
        places={[places[0]!, { ...places[1]!, name: "Lisbon Cathedral" }]}
        destination="Lisbon"
        day={1}
      />,
    );
    expect(
      screen.getByText("Example times for this design preview · not live route data."),
    ).toBeInTheDocument();
    expect(screen.getByText("Walk + bus")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Change route"));
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "Lisbon Airport" } });
    expect(screen.queryByText("Walk + bus")).not.toBeInTheDocument();
    expect(screen.getAllByText("Not connected")).toHaveLength(3);
    expect(fetchTransport).not.toHaveBeenCalled();
  });
  it("shows partial results without inventing missing times and clears results after an edit", async () => {
    vi.mocked(fetchTransport).mockImplementation(async ({ mode }) => {
      if (mode === "DRIVE") throw new Error("Car service unavailable.");
      return {
        mode,
        checkedAt: "2026-10-24T12:00:00Z",
        departureTime: "2026-10-24T12:00:00Z",
        route:
          mode === "TRANSIT"
            ? null
            : {
                seconds: 900,
                meters: 1000,
                normalSeconds: null,
                walkingMeters: null,
                transfers: null,
                lines: [],
                warnings: [],
              },
      };
    });
    render(<TransportComparison places={places} destination="Lisbon" day={1} />);
    expect(fetchTransport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Compare transport" }));
    await waitFor(() => expect(screen.getByText("1.0 km")).toBeInTheDocument());
    expect(fetchTransport).toHaveBeenCalledTimes(3);
    expect(vi.mocked(fetchTransport).mock.calls[0]![0]).toMatchObject({
      origin: "38.71,-9.13",
      destination: "38.72,-9.14",
      mode: "TRANSIT",
    });
    expect(screen.getByText(/No route was returned/)).toBeInTheDocument();
    expect(screen.getByText("Car service unavailable.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "Lisbon Airport, Portugal" },
    });
    expect(screen.queryByText("1.0 km")).not.toBeInTheDocument();
  });
  it("discards a response that finishes after locations change", async () => {
    const completions: Array<() => void> = [];
    vi.mocked(fetchTransport).mockImplementation(
      ({ mode }) =>
        new Promise((done) => {
          completions.push(() =>
            done({
              mode,
              checkedAt: "2026-10-24T12:00:00Z",
              departureTime: "2026-10-24T12:00:00Z",
              route: null,
            }),
          );
        }),
    );
    render(<TransportComparison places={places} destination="Lisbon" day={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Compare transport" }));
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "Lisbon Airport" } });
    expect(screen.getByRole("button", { name: "Compare transport" })).toBeEnabled();
    await act(async () => {
      completions.forEach((done) => done());
    });
    expect(screen.queryByText(/Checked /)).not.toBeInTheDocument();
  });
});
