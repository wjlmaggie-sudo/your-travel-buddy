import { findWeatherPlaces } from "./weather";

export type FlightAirport = {
  code: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  large: boolean;
};
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
let airports: Promise<FlightAirport[]> | undefined;
async function airportDirectory() {
  return (airports ??= import("../data/flight-airports.json").then(({ default: rows }) =>
    rows.map((row) => {
      const [code, name, city, country, latitude, longitude, large] = row as [
        string,
        string,
        string,
        string,
        number,
        number,
        boolean,
      ];
      return { code, name, city, country, latitude, longitude, large };
    }),
  ));
}
const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
export function matchFlightAirport(query: string, directory: FlightAirport[]) {
  const input = query.trim();
  const code = /(?:^|[\s(])([A-Za-z]{3})(?:\)|$)/.exec(input)?.[1]?.toUpperCase();
  if (code) {
    const exact = directory.find((a) => a.code === code);
    if (exact) return exact;
  }
  const [city = "", country = ""] = input.split(",").map(normalize);
  const candidates = directory.filter(
    (a) =>
      (!country ||
        normalize(a.country) === country ||
        normalize(countryNames.of(a.country) ?? "") === country) &&
      (normalize(a.city) === city || normalize(a.name) === city),
  );
  return candidates.sort(
    (a, b) => Number(b.large) - Number(a.large) || a.code.localeCompare(b.code),
  )[0];
}
export function nearbyFlightAirport(
  latitude: number,
  longitude: number,
  directory: FlightAirport[],
  country?: string,
) {
  const radians = (n: number) => (n * Math.PI) / 180;
  const distance = (a: FlightAirport) => {
    const dLat = radians(a.latitude - latitude),
      dLon = radians(a.longitude - longitude);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(radians(latitude)) * Math.cos(radians(a.latitude)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  return directory
    .filter((a) => !country || a.country === country)
    .map((airport) => ({ airport, km: distance(airport) }))
    .filter((a) => a.km <= 150)
    .sort((a, b) => a.km - b.km)[0]?.airport;
}
export async function resolveFlightAirport(query: string, signal: AbortSignal) {
  const directory = await airportDirectory();
  signal.throwIfAborted();
  const exact = matchFlightAirport(query, directory);
  if (exact) return exact;
  const parts = query.split(",").map((v) => v.trim());
  const places = await findWeatherPlaces(parts[0] ?? query, signal).catch((cause) => {
    if (signal.aborted) throw cause;
    throw new Error("City lookup is unavailable. Try again or enter a three-letter airport code.");
  });
  const country = normalize(parts[1] ?? "");
  const place = places.find(
    (p) =>
      !country ||
      normalize(p.country ?? "") === country ||
      normalize(p.country_code ?? "") === country,
  );
  if (place) {
    const nearby = nearbyFlightAirport(
      place.latitude,
      place.longitude,
      directory,
      place.country_code,
    );
    if (nearby) return nearby;
  }
  throw new Error(
    `We couldn't find a suitable airport for ${query}. Change the city or enter its three-letter airport code.`,
  );
}
