import { Capacitor } from "@capacitor/core";
import type { CompanionStop, CompanionTrip } from "./travel-companion";
import { companionText, stopInstant, tripDate } from "./travel-companion";

export const NATIVE_APP = import.meta.env["VITE_NATIVE_APP"] === "true";
export const AUTH_CALLBACK = "com.yourtravelbuddy.app://auth/callback";
export const isNative = () => Capacitor.isNativePlatform();

export async function shareItinerary(trip: CompanionTrip) {
  // Only the itinerary is shared. Reservation references, spending and private notes stay local.
  const text = companionText(trip);
  if (isNative()) {
    const { Share } = await import("@capacitor/share");
    await Share.share({ title: `${trip.destination} itinerary`, text });
  } else if (navigator.share) {
    await navigator.share({ title: `${trip.destination} itinerary`, text });
  } else {
    await navigator.clipboard.writeText(text);
  }
}

export async function sharePdf(blob: Blob, filename: string) {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]!);
    reader.onerror = () => reject(new Error("Could not prepare the PDF."));
    reader.readAsDataURL(blob);
  });
  const file = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
  await Share.share({ title: filename, files: [file.uri] });
  return file.uri;
}

function notificationId(trip: CompanionTrip) {
  return (
    (Array.from(trip.id).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0) %
      2000000000) +
    1
  );
}
export async function remindAboutStop(trip: CompanionTrip, stop: CompanionStop) {
  if (!isNative()) throw new Error("Reminders are available in the installed iPhone app.");
  const when = stopInstant(tripDate(trip, stop.day), stop.time, trip.timezone);
  if (!when) throw new Error("Set a valid activity time and trip timezone first.");
  const at = new Date(when.getTime() - 15 * 60000);
  if (at.getTime() <= Date.now())
    throw new Error("Choose an activity more than 15 minutes from now.");
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== "granted")
    throw new Error("Allow notifications in iPhone Settings to set a reminder.");
  const id = notificationId(trip);
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title: "Your next stop",
        body: `${stop.title} · ${stop.time} (${trip.timezone})`,
        schedule: { at },
        extra: { tripId: trip.id },
      },
    ],
  });
}
export async function cancelTripReminder(trip: CompanionTrip) {
  if (!isNative()) return;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.cancel({ notifications: [{ id: notificationId(trip) }] });
}

/** Register once per mounted app; remove listeners on teardown (including React StrictMode). */
export async function setupNativeApp(onAuthCode: (code: string) => Promise<void>) {
  if (!isNative()) return () => {};
  const [{ App }, { Browser }, { AppLauncher }] = await Promise.all([
    import("@capacitor/app"),
    import("@capacitor/browser"),
    import("@capacitor/app-launcher"),
  ]);
  async function handleUrl(value: string) {
    const url = new URL(value);
    if (
      url.protocol !== "com.yourtravelbuddy.app:" ||
      url.hostname !== "auth" ||
      url.pathname !== "/callback"
    )
      return;
    const code = url.searchParams.get("code");
    if (code) await onAuthCode(code);
  }
  const listener = await App.addListener("appUrlOpen", ({ url }) => {
    void handleUrl(url);
  });
  const launch = await App.getLaunchUrl();
  if (launch?.url) await handleUrl(launch.url);
  const openExternal = (event: MouseEvent) => {
    const anchor = (event.target as Element | null)?.closest?.("a");
    if (!anchor || anchor.hasAttribute("download")) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin === location.origin || !["https:", "http:"].includes(url.protocol)) return;
    event.preventDefault();
    if (url.hostname === "maps.apple.com") {
      void AppLauncher.openUrl({ url: anchor.href });
    } else if (url.protocol === "https:") {
      void Browser.open({ url: anchor.href });
    }
  };
  document.addEventListener("click", openExternal);
  return () => {
    void listener.remove();
    document.removeEventListener("click", openExternal);
  };
}
