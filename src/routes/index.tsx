import { publicAsset } from "@/lib/deployment";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TravelPlanner } from "@/components/TravelPlanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Travel Buddy — One connected travel plan" },
      {
        name: "description",
        content:
          "A warm, simple travel planner: day-by-day itineraries, budget tracking and template trip ideas.",
      },
      { property: "og:title", content: "Travel Buddy — Travel Planner" },
      {
        property: "og:description",
        content: "Day-by-day itineraries, budget tracking and template trip ideas in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-semibold">
          <img src={publicAsset("ai-travel-logo.svg")} alt="" className="h-7 w-7" /> Travel Buddy
        </Link>
        <Button asChild variant="outline">
          <Link to="/trips">My trips</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-5 rounded-3xl bg-secondary px-6 py-7 text-secondary-foreground md:px-9">
          <div>
            <p className="text-xs uppercase tracking-[.22em] opacity-75">
              One trip. Every possibility.
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
              Less searching. More <em>going.</em>
            </h1>
            <p className="mt-3 max-w-xl text-sm opacity-85">
              Your route, your stay, your discoveries — connected by one clear budget.
            </p>
          </div>
          <span className="rounded-full border border-white/25 px-4 py-2 text-xs">
            Free planning prototype · yours to edit
          </span>
        </div>
      </main>
      <TravelPlanner />
      <footer className="mx-auto max-w-6xl border-t px-6 py-8 text-xs text-muted-foreground">
        Travel Buddy · Plan thoughtfully. Explore freely. Prototype suggestions and simulated offers
        are labeled; verify prices and availability with providers.
      </footer>
    </div>
  );
}
