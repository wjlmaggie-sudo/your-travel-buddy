import { useNavigate } from "@tanstack/react-router";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import type { PdfTrip } from "@/lib/trip-pdf";
import { makeCompanionTrip, saveCompanionTrip } from "@/lib/travel-companion";
import { NATIVE_APP } from "@/lib/native-app";

export function FollowPlanButton({
  trip,
  source,
  disabled = false,
}: {
  trip: PdfTrip;
  source?: { tripId: string; ownerId: string };
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <Button
      type="button"
      disabled={disabled}
      onClick={() => {
        try {
          const copy = saveCompanionTrip(makeCompanionTrip(trip, source));
          toast.success(
            NATIVE_APP
              ? "Your itinerary is ready to follow offline on this device."
              : "Plan saved on this device. Keep this page open to follow it without internet.",
          );
          void navigate({ to: "/on-trip", search: { trip: copy.id } });
        } catch (error) {
          toast.error(
            error instanceof Error && !error.message.includes("[")
              ? error.message
              : "Could not save this plan on your device. Check activity titles and available storage.",
          );
        }
      }}
    >
      <Smartphone className="mr-2 h-4 w-4" />
      Follow this plan
    </Button>
  );
}
