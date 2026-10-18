import travelLake from "@/assets/travel-lake.jpg";
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
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-semibold">
          <img src={publicAsset("ai-travel-logo.svg")} alt="" className="h-7 w-7" /> Travel Buddy
        </Link>
        <Button asChild variant="outline">
          <Link to="/trips">My trips</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <section
          aria-label="Travel inspiration"
          className="relative isolate flex min-h-[210px] items-center overflow-hidden rounded-3xl bg-secondary px-6 py-6 text-white md:min-h-[240px] md:px-10"
        >
          <img
            src={travelLake}
            alt="An alpine lake and mountains at Lago di Braies, Italy"
            width={1280}
            height={853}
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_45%]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/40 to-black/15" />
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[.22em] text-white/85">
              A world of possibilities. One simple plan.
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
              Where will your
              <br />
              <em>curiosity take you?</em>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90">
              Build a trip around your days, your people and your budget. Explore first. Save when
              you’re ready.
            </p>
          </div>
          <a
            href="https://commons.wikimedia.org/wiki/File:Lago_di_Braies_(Unsplash_VowIFDxogG4).jpg"
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-4 text-[10px] text-white/80 underline"
          >
            Lago di Braies · Luca Bravo · CC0
          </a>
        </section>
      </main>
      <TravelPlanner />
      <footer className="mx-auto max-w-7xl border-t px-6 py-8 text-xs text-muted-foreground">
        Travel Buddy · Plan thoughtfully. Explore freely. Prototype suggestions and simulated offers
        are labeled; verify prices and availability with providers.
      </footer>
    </div>
  );
}
