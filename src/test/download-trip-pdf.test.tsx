import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { DownloadTripPdf } from "@/components/DownloadTripPdf";
import { downloadTripPdf, type PdfTrip } from "@/lib/trip-pdf";
vi.mock("@/lib/trip-pdf", () => ({ downloadTripPdf: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));
const trip: PdfTrip = {
  brief: {
    destination: "Lisbon",
    start: "2026-11-01",
    days: 1,
    travelers: 2,
    budget: 400,
    currency: "EUR",
    style: "Balanced",
  },
  days: [{ day: 1, items: [{ title: "My edited plan" }] }],
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("PDF download control", () => {
  it("exports the complete data and retains an accessible download link", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { revokeObjectURL: vi.fn() }));
    vi.mocked(downloadTripPdf).mockResolvedValueOnce({
      missingPhotos: 0,
      missingMaps: 0,
      url: "blob:pdf",
      filename: "lisbon.pdf",
    });
    render(<DownloadTripPdf trip={trip} />);
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "PDF ready · download again" })).toHaveAttribute(
        "download",
        "lisbon.pdf",
      ),
    );
    expect(downloadTripPdf).toHaveBeenCalledWith(trip, expect.any(Function));
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
  });
  it("allows retry after a generation error", async () => {
    vi.mocked(downloadTripPdf).mockRejectedValueOnce(new Error("unavailable"));
    render(<DownloadTripPdf trip={trip} />);
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled());
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
