import { childCount } from "../../supabase/functions/_shared/travel-persona";
import { requestedRooms, type StayBrief } from "./stay-planning";

/** Planning advice only: hotel search results do not confirm room categories or beds. */
export function roomRecommendation(brief: StayBrief) {
  const rooms = requestedRooms(brief);
  if (childCount(brief))
    return {
      title: rooms === 1 ? "Family room or suite" : "Family rooms or connecting rooms",
      detail:
        "Look for space for every adult and child. Confirm child beds, cots, maximum occupancy and any connecting-room guarantee with the hotel.",
    };
  const perRoom = Math.ceil(brief.travelers / rooms);
  if (perRoom === 1)
    return {
      title: "Single-occupancy room",
      detail:
        "One traveler per room. The actual room may contain a single or larger bed; confirm the bed offered by the hotel.",
    };
  if (perRoom === 2)
    return {
      title: "Double or twin room",
      detail:
        "Double means one shared bed; twin means two separate beds. Confirm which configuration the quoted rate includes. Room sizes can vary if your group is split unevenly.",
    };
  if (perRoom === 3)
    return {
      title: "Triple room or suite",
      detail:
        "Look for capacity for three guests per room. Confirm whether the third bed is a standard bed, sofa bed or extra bed, and whether it costs more.",
    };
  return {
    title: "Group room, suite or apartment",
    detail:
      "Confirm enough beds and legal occupancy for the full group. A standard double room may not fit everyone; separate rooms may be needed.",
  };
}
