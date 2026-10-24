import { expect, it } from "vitest";
import { roomRecommendation } from "@/lib/room-recommendation";
const brief = {
  destination: "Lisbon",
  start: "2030-06-10",
  days: 3,
  travelers: 2,
  budget: 1500,
  currency: "EUR",
  style: "Balanced" as const,
};
it("distinguishes sharing a double bed from separate twin beds, and changes advice for single occupancy", () => {
  expect(roomRecommendation(brief)).toMatchObject({ title: "Double or twin room" });
  expect(roomRecommendation(brief).detail).toContain("two separate beds");
  expect(roomRecommendation({ ...brief, hotelRooms: 2 }).title).toBe("Single-occupancy room");
});
it("suggests family arrangements without claiming room capacity or cots are included", () => {
  const advice = roomRecommendation({
    ...brief,
    travelers: 3,
    childrenAgeRanges: ["0-3"],
    hotelRooms: 1,
  });
  expect(advice.title).toBe("Family room or suite");
  expect(advice.detail).toContain("Confirm child beds, cots");
  expect(roomRecommendation({ ...brief, travelers: 4, hotelRooms: 1 }).title).toBe(
    "Group room, suite or apartment",
  );
});
