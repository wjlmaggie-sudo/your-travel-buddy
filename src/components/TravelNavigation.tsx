import { SECTIONS, type TravelSection } from "@/lib/travel-workspace";
import { useState } from "react";
import { NATIVE_APP } from "@/lib/native-app";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import {
  Sparkles,
  MessageCircle,
  Plane,
  BedDouble,
  MapPinned,
  ShoppingBag,
  Coins,
  CloudSun,
  CarFront,
  LayoutGrid,
  ReceiptText,
} from "lucide-react";
const icons = [
  Sparkles,
  MessageCircle,
  Plane,
  BedDouble,
  CarFront,
  MapPinned,
  ShoppingBag,
  Coins,
  CloudSun,
  ReceiptText,
];
export function TravelNavigation({
  section,
  onChange,
}: {
  section: TravelSection;
  onChange: (section: TravelSection) => void;
}) {
  const [toolsOpen, setToolsOpen] = useState(false);
  if (NATIVE_APP) {
    const main = [
      { id: "planner", label: "Plan", Icon: Sparkles },
      { id: "chat", label: "Discover", Icon: MessageCircle },
      { id: "attractions", label: "Itinerary", Icon: MapPinned },
    ] as const;
    const labels: Record<string, string> = {
      flights: "Flights",
      hotels: "Hotels",
      cars: "Car rental",
      shopping: "Shopping",
      currency: "Currency",
      weather: "Weather",
      review: "Final budget",
    };
    return (
      <nav aria-label="Travel sections" className="mobile-section-nav">
        {main.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={section === id ? "page" : undefined}
            onClick={() => onChange(id)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={toolsOpen}
          aria-current={!["planner", "chat", "attractions"].includes(section) ? "page" : undefined}
          onClick={() => setToolsOpen(true)}
        >
          <LayoutGrid size={18} />
          Tools
        </button>
        <Dialog open={toolsOpen} onOpenChange={setToolsOpen}>
          <DialogContent className="mobile-tools-sheet">
            <DialogHeader>
              <DialogTitle>Everything for the journey</DialogTitle>
              <DialogDescription>Find what you need, then get back to your trip.</DialogDescription>
            </DialogHeader>
            <div className="mobile-tools-grid">
              {SECTIONS.map((item, index) => ({ ...item, Icon: icons[index]! }))
                .filter((item) => labels[item.id])
                .map(({ id, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onChange(id);
                      setToolsOpen(false);
                    }}
                  >
                    <Icon size={24} />
                    <span>{labels[id]}</span>
                  </button>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      </nav>
    );
  }
  return (
    <nav aria-label="Travel sections" className="travel-navigation p-3">
      <label className="block w-full px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:hidden">
        Travel section
        <select
          aria-label="Travel section"
          value={section}
          onChange={(e) => onChange(e.target.value as TravelSection)}
          className="mt-1 h-10 w-full rounded-xl border-0 bg-secondary px-3 text-sm font-medium normal-case tracking-normal text-secondary-foreground"
        >
          {SECTIONS.map((item) => (
            <option value={item.id} key={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <div className="hidden flex-col gap-1 md:flex">
        {SECTIONS.map((item, index) => {
          const Icon = icons[index]!;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${section === item.id ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
