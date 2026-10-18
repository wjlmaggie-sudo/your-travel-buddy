import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { fetchExchangeRate } from "@/lib/exchange-rates";
vi.mock("@/lib/exchange-rates", async (original) => ({
  ...(await original<typeof import("@/lib/exchange-rates")>()),
  fetchExchangeRate: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("exchange widget", () => {
  it("loads only on request, calculates locally and swaps currencies", async () => {
    vi.mocked(fetchExchangeRate).mockImplementation(async (base, quote) => ({
      base,
      quote,
      date: "2026-10-16",
      rate: base === "EUR" ? 1.1253 : 0.88865,
    }));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CurrencyConverter />
      </QueryClientProvider>,
    );
    expect(fetchExchangeRate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Check exchange rate" }));
    expect(await screen.findByText("$112.53")).toBeInTheDocument();
    expect(screen.getByText(/published 2026-10-16/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Amount to convert"), { target: { value: "200" } });
    expect(screen.getByText("$225.06")).toBeInTheDocument();
    expect(fetchExchangeRate).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Swap currencies" }));
    expect(await screen.findByText("€177.73")).toBeInTheDocument();
    expect(screen.getByLabelText("From currency")).toHaveValue("USD");
  });
});
