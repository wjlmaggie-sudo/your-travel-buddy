import { describe, expect, it } from "vitest";
import { budgetAllocation, endDate, estimatedBudget, templateActivities } from "@/lib/planning";
import { TEMPLATES } from "@/lib/travel-data";

describe("group travel planning", () => {
  it("keeps fractional group budgets exact across all styles", () => {
    for (const style of ["Budget", "Balanced", "Luxury"] as const) {
      const parts = budgetAllocation(1234.57, style);
      expect(parts.reduce((sum, part) => sum + Math.round(part.amount * 100), 0)).toBe(123457);
      expect(parts.every((part) => part.amount >= 0)).toBe(true);
    }
  });
  it("scales estimates by both days and group size", () => {
    expect(estimatedBudget(5, 2, "Balanced")).toBe(1500);
    expect(estimatedBudget(5, 4, "Budget")).toBe(1400);
    expect(estimatedBudget(3, 1, "Luxury")).toBe(900);
  });
  it("counts departure as day one across months and leap days", () => {
    expect(endDate("2028-02-28", 3)).toBe("2028-03-01");
    expect(endDate("2026-12-31", 2)).toBe("2027-01-01");
    expect(endDate("2026-10-17", 1)).toBe("2026-10-17");
  });
  it("trims or extends every template to the requested trip length", () => {
    for (const t of TEMPLATES) {
      expect(templateActivities(t.id, 1)).toHaveLength(1);
      const activities = templateActivities(t.id, 30);
      expect(activities).toHaveLength(30);
      expect(activities.at(-1)?.day).toBe(30);
      expect(activities.every((a) => a.title && a.notes && a.location === t.destination)).toBe(
        true,
      );
    }
    expect(templateActivities("not-a-template", 5)).toEqual([]);
  });
});
