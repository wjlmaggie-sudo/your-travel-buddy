import { SECTIONS, type TravelSection } from "@/lib/travel-workspace";
import { Sparkles, Plane, BedDouble, MapPinned, ShoppingBag } from "lucide-react";
const icons = [Sparkles, Plane, BedDouble, MapPinned, ShoppingBag];
export function TravelNavigation({
  section,
  onChange,
}: {
  section: TravelSection;
  onChange: (section: TravelSection) => void;
}) {
  return (
    <nav
      aria-label="Travel sections"
      className="travel-navigation rounded-2xl border bg-card p-1.5 shadow-sm"
    >
      <label className="block w-full px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:hidden">
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
      <div className="hidden gap-1 overflow-x-auto sm:flex">
        {SECTIONS.map((item, index) => {
          const Icon = icons[index]!;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={`flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition sm:flex-1 ${section === item.id ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
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
