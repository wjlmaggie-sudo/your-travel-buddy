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
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
          className="travel-hero relative isolate overflow-hidden rounded-3xl bg-secondary text-white"
        >
          <img
            src={travelLake}
            alt="An alpine lake and mountains at Lago di Braies, Italy"
            width={1600}
            height={900}
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
          <div className="max-w-2xl px-6 py-10 sm:px-10 sm:py-14">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-white/80">
              Less searching. More exploring.
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Your next adventure
              <br />
              starts here.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/90">
              Flights, beautiful stays and days worth remembering. Bring every choice into one
              simple plan.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">
                Plan as a guest
              </span>
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">
                Keep your budget in view
              </span>
            </div>
          </div>
          <a
            href="https://commons.wikimedia.org/wiki/File:Lago_di_Braies_(Unsplash_VowIFDxogG4).jpg"
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-4 text-[9px] text-white/80 underline"
          >
            Luca Bravo · CC0
          </a>
        </section>
      </main>
      <TravelPlanner />
      <footer className="mx-auto max-w-7xl border-t px-6 py-8 text-xs text-muted-foreground">
        Travel Buddy · Plan thoughtfully. Explore freely. Confirm prices, availability and booking
        terms with providers.
      </footer>
    </div>
  );
}
