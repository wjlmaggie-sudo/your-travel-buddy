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
          className="flex items-center justify-between gap-5 rounded-2xl border bg-card px-5 py-4 sm:px-6"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-secondary">
              Your next adventure, made simple
            </p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              One trip. Every choice connected.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with the basics. Choose your flights, stay and favorite places.
            </p>
          </div>
          <div className="relative hidden shrink-0 sm:block">
            <img
              src={travelLake}
              alt="An alpine lake and mountains at Lago di Braies, Italy"
              width={160}
              height={88}
              className="h-20 w-36 rounded-xl object-cover"
            />
            <a
              href="https://commons.wikimedia.org/wiki/File:Lago_di_Braies_(Unsplash_VowIFDxogG4).jpg"
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-1 right-2 text-[8px] text-white underline"
            >
              Luca Bravo · CC0
            </a>
          </div>
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
