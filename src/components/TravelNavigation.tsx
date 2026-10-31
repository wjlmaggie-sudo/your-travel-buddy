import { SECTIONS, type TravelSection } from "@/lib/travel-workspace";
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
];
export function TravelNavigation({
  section,
  onChange,
}: {
  section: TravelSection;
  onChange: (section: TravelSection) => void;
}) {
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
