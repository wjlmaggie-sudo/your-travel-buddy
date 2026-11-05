import { createFileRoute } from "@tanstack/react-router";
import { TravelCompanion } from "@/components/TravelCompanion";

export const Route = createFileRoute("/on-trip")({
  ssr: false,
  head: () => ({ meta: [{ title: "Today — AiTravel" }] }),
  validateSearch: (search: Record<string, unknown>): { trip?: string } =>
    typeof search["trip"] === "string" ? { trip: search["trip"].slice(0, 200) } : {},
  component: () => <TravelCompanion requestedId={Route.useSearch().trip} />,
});
