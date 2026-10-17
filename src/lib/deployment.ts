/** Vite replaces these constants at build time. Lovable keeps its native server build. */
export const STATIC_PAGES = import.meta.env["VITE_STATIC_PAGES"] === "true";
export const publicAsset = (name: string) =>
  `${import.meta.env.BASE_URL}${name.replace(/^\/+/, "")}`;
export function authRedirectUrl(origin: string, baseUrl = import.meta.env.BASE_URL) {
  // Email confirmation returns to the real static index, never a server-only route.
  return new URL(baseUrl, origin).href;
}
