import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { JourneyPlanner } from "@/components/JourneyPlanner";
afterEach(cleanup);
it("preserves saved journey costs without reintroducing hotel comfort controls", () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <JourneyPlanner
        brief={{
          destination: "Lisbon",
          start: "2030-06-10",
          days: 3,
          travelers: 2,
          budget: 1500,
          currency: "EUR",
          style: "Balanced",
        }}
        journey={{ departure: "Berlin", flightBudget: 350, hotelComfort: "Premium" }}
      />
    </QueryClientProvider>,
  );
  expect(screen.queryByText("Your hotel comfort")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Premium" })).not.toBeInTheDocument();
  expect(screen.getByLabelText(/Return-flight allowance/)).toHaveValue(350);
});
