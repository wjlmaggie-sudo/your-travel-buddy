import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Map, Wallet, Sparkles, ShoppingBag, Users, LayoutTemplate } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Travel — Plan trips, track budgets, get ideas" },
      {
        name: "description",
        content:
          "A warm, simple travel planner: day-by-day itineraries, budget tracking and AI trip ideas.",
      },
      { property: "og:title", content: "AI Travel — Travel Planner" },
      {
        property: "og:description",
        content: "Day-by-day itineraries, budget tracking and AI trip ideas in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Map,
    title: "Day-by-day itinerary",
    text: "Lay out each day with times, places and notes.",
  },
  { icon: Wallet, title: "Budget tracker", text: "Log spending by category and see what's left." },
  {
    icon: Sparkles,
    title: "AI trip ideas",
    text: "Get ideas shaped by your interests, group size, and budget.",
  },
  {
    icon: LayoutTemplate,
    title: "Ready-made escapes",
    text: "Choose from six editable trip templates or discover one at random.",
  },
  {
    icon: Users,
    title: "A budget for everyone",
    text: "Set your travel style, group size, and per-person spending plan.",
  },
  {
    icon: ShoppingBag,
    title: "Shops & packing",
    text: "Search products and nearby shops, then save your packing list.",
  },
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl font-semibold">
          <img src="/ai-travel-logo.svg" alt="" className="h-7 w-7" /> AI Travel
        </Link>
        <Button asChild variant="outline">
          <Link to="/trips">My trips</Link>
        </Button>
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-10 md:grid-cols-2">
        <div>
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-secondary">
            Your travel journal
          </p>
          <h1 className="text-5xl font-semibold leading-tight md:text-6xl">
            Plan the trip.
            <br />
            <em className="text-primary">Live the story.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Itineraries, budgets and fresh ideas for every journey — all saved to your account.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/trips">Start planning</Link>
          </Button>
        </div>
        <img
          src={hero}
          alt="Travel journal with map, compass and photos"
          width={1600}
          height={1008}
          className="rounded-2xl shadow-card"
        />
      </main>
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border bg-card p-6 shadow-card">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
