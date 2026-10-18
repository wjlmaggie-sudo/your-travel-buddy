import { useEffect, useRef, useState } from "react";
import { publicAsset } from "@/lib/deployment";
import type { VisualPlace } from "@/lib/city-guides";

type MapInstance = {
  remove: () => void;
  fitBounds: (bounds: number[][], options: object) => void;
  setView: (point: number[], zoom: number) => void;
  invalidateSize: () => void;
};
type Leaflet = {
  map: (node: HTMLElement, options: object) => MapInstance;
  tileLayer: (url: string, options: object) => { addTo: (map: MapInstance) => unknown };
  divIcon: (options: object) => unknown;
  marker: (
    point: number[],
    options: object,
  ) => { addTo: (map: MapInstance) => { bindPopup: (node: HTMLElement) => unknown } };
};
let library: Promise<Leaflet> | undefined;
function leaflet() {
  if (!library)
    library = new Promise<Leaflet>((resolve, reject) => {
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.href = publicAsset("vendor/leaflet/leaflet.css");
      document.head.append(style);
      const script = document.createElement("script");
      script.src = publicAsset("vendor/leaflet/leaflet.js");
      script.onload = () => resolve((window as unknown as { L: Leaflet }).L);
      script.onerror = () => {
        script.remove();
        style.remove();
        library = undefined;
        reject(new Error("Map library unavailable"));
      };
      document.head.append(script);
    });
  return library;
}
export function DayRouteMap({ places, day }: { places: VisualPlace[]; day: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false,
      map: MapInstance | undefined,
      resize: ResizeObserver | undefined;
    void leaflet()
      .then((L) => {
        if (disposed || !container.current || !places.length) return;
        map = L.map(container.current, { scrollWheelZoom: false });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        }).addTo(map);
        places.forEach((place, index) => {
          const popup = document.createElement("div");
          popup.textContent = `${index + 1}. ${place.name}`;
          L.marker([place.lat, place.lon], {
            title: `Stop ${index + 1}: ${place.name}`,
            icon: L.divIcon({
              html: `<span class="travel-map-pin"><b>${index + 1}</b></span>`,
              className: "travel-map-marker",
              iconSize: [30, 36],
              iconAnchor: [15, 36],
            }),
          })
            .addTo(map!)
            .bindPopup(popup);
        });
        if (places.length === 1) map.setView([places[0]!.lat, places[0]!.lon], 14);
        else
          map.fitBounds(
            places.map((place) => [place.lat, place.lon]),
            { padding: [35, 35], maxZoom: 15 },
          );
        resize = new ResizeObserver(() => map?.invalidateSize());
        resize.observe(container.current);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      resize?.disconnect();
      map?.remove();
    };
  }, [places]);
  if (failed)
    return (
      <p className="flex h-64 items-center justify-center rounded-xl bg-muted p-4 text-sm text-muted-foreground sm:h-72">
        The map is unavailable. Use the place and directions links below.
      </p>
    );
  return (
    <div
      ref={container}
      className="relative z-0 h-64 w-full rounded-xl bg-muted sm:h-72"
      role="region"
      aria-label={`Map of suggested stops for day ${day}`}
    />
  );
}
