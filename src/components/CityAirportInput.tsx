import { useEffect, useId, useRef, useState } from "react";
import { airportLabel, suggestFlightAirports, type FlightAirport } from "@/lib/flight-airports";
export function CityAirportInput({
  label,
  value,
  onChange,
  onSelect,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
}) {
  const id = useId(),
    root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false),
    [options, setOptions] = useState<FlightAirport[]>([]),
    [highlight, setHighlight] = useState(-1);
  useEffect(() => {
    let cancelled = false;
    if (!open) return;
    void suggestFlightAirports(value).then((items) => {
      if (!cancelled) {
        setOptions(items);
        setHighlight(-1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [value, open]);
  const choose = (airport: FlightAirport) => {
    const text = airportLabel(airport);
    onChange(text);
    onSelect(text);
    setOpen(false);
  };
  return (
    <div
      ref={root}
      className="relative min-w-0"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && options.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={highlight >= 0 ? `${id}-${highlight}` : undefined}
        autoComplete="off"
        value={value}
        maxLength={160}
        required
        placeholder="City or airport"
        className="mt-2 h-12 w-full rounded-xl border bg-background px-3"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((i) => Math.min(options.length - 1, i + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((i) => Math.max(0, i - 1));
          }
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter" && open && options.length) {
            e.preventDefault();
            choose(options[highlight >= 0 ? highlight : 0]!);
          }
        }}
      />
      {open && options.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-lg"
        >
          {options.map((airport, index) => (
            <li
              key={airport.code}
              id={`${id}-${index}`}
              role="option"
              aria-selected={highlight === index}
            >
              <button
                type="button"
                tabIndex={-1}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${highlight === index ? "bg-muted" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(airport)}
              >
                <span className="block font-medium">{airportLabel(airport)}</span>
                <span className="text-xs text-muted-foreground">{airport.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
