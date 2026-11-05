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
    const tabs: TravelSection[] = ["planner", "chat", "attractions"];
    const items = SECTIONS.map((item, index) => ({ ...item, Icon: icons[index]! }));
    return (
      <nav aria-label="Travel sections" className="mobile-section-nav">
        {items
          .filter(({ id }) => tabs.includes(id))
          .map(({ id, label, Icon }) => (
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
          aria-current={!tabs.includes(section) ? "page" : undefined}
          onClick={() => setToolsOpen(true)}
        >
          <LayoutGrid size={18} />
          Tools
        </button>
        <Dialog open={toolsOpen} onOpenChange={setToolsOpen}>
          <DialogContent placement="bottom" className="mobile-tools-sheet">
            <DialogHeader>
              <DialogTitle>Trip tools</DialogTitle>
              <DialogDescription>Choose a tool for your trip.</DialogDescription>
            </DialogHeader>
            <div className="mobile-tools-grid">
              {items
                .filter(({ id }) => !tabs.includes(id))
                .map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    aria-current={section === id ? "page" : undefined}
                    type="button"
                    onClick={() => {
                      onChange(id);
                      setToolsOpen(false);
                    }}
                  >
                    <Icon size={24} />
                    <span>{label}</span>
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
              className="section-nav-link"
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
