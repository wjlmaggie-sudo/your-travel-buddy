import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeCompanionTrip } from "@/lib/travel-companion";
import {
  cancelTripReminder,
  remindAboutStop,
  setupNativeApp,
  shareItinerary,
  sharePdf,
} from "@/lib/native-app";

const bridge = vi.hoisted(() => ({
  native: vi.fn(() => true),
  share: vi.fn(),
  permission: vi.fn(),
  schedule: vi.fn(),
  cancel: vi.fn(),
  addListener: vi.fn(),
  remove: vi.fn(),
  launch: vi.fn(),
  browser: vi.fn(),
  launcher: vi.fn(),
  file: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: bridge.native } }));
vi.mock("@capacitor/share", () => ({ Share: { share: bridge.share } }));
vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    requestPermissions: bridge.permission,
    schedule: bridge.schedule,
    cancel: bridge.cancel,
  },
}));
vi.mock("@capacitor/app", () => ({
  App: { addListener: bridge.addListener, getLaunchUrl: bridge.launch },
}));
vi.mock("@capacitor/browser", () => ({ Browser: { open: bridge.browser } }));
vi.mock("@capacitor/app-launcher", () => ({ AppLauncher: { openUrl: bridge.launcher } }));
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { writeFile: bridge.file },
  Directory: { Cache: "CACHE" },
}));

function trip() {
  return {
    ...makeCompanionTrip({
      brief: {
        destination: "Lisbon",
        start: "2030-06-10",
        days: 1,
        travelers: 2,
        budget: 100,
        currency: "EUR",
        style: "Balanced",
      },
      days: [{ day: 1, items: [{ title: "Alfama", time: "10:00" }] }],
    }),
    timezone: "Europe/Lisbon",
  };
}
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  bridge.native.mockReturnValue(true);
  bridge.permission.mockResolvedValue({ display: "granted" });
  bridge.addListener.mockResolvedValue({ remove: bridge.remove });
  bridge.launch.mockResolvedValue(undefined);
  bridge.file.mockResolvedValue({ uri: "file:///test-cache/plan.pdf" });
});
describe("iPhone integration adapters (mocked native bridge)", () => {
  it("shares itinerary stops without private reservation details", async () => {
    const copy = trip();
    copy.essentials.push({ id: "booking", title: "Private reference", details: "DO-NOT-SHARE" });
    await shareItinerary(copy);
    const shared = bridge.share.mock.calls[0]![0];
    expect(shared.text).toContain("Alfama");
    expect(shared.text).not.toContain("DO-NOT-SHARE");
  });
  it("schedules a reminder in the destination timezone and cancels the same identifier", async () => {
    const copy = trip();
    await remindAboutStop(copy, copy.stops[0]!);
    const notification = bridge.schedule.mock.calls[0]![0].notifications[0];
    expect(notification.schedule.at.toISOString()).toBe("2030-06-10T08:45:00.000Z");
    await cancelTripReminder(copy);
    expect(bridge.cancel).toHaveBeenCalledWith({ notifications: [{ id: notification.id }] });
  });
  it("does not schedule when notification permission is denied", async () => {
    bridge.permission.mockResolvedValue({ display: "denied" });
    const copy = trip();
    await expect(remindAboutStop(copy, copy.stops[0]!)).rejects.toThrow("Allow notifications");
    expect(bridge.schedule).not.toHaveBeenCalled();
  });
  it("rejects flexible and past stop times before prompting for permissions", async () => {
    const copy = trip();
    await expect(remindAboutStop(copy, { ...copy.stops[0]!, time: "Flexible" })).rejects.toThrow(
      "valid activity time",
    );
    await expect(remindAboutStop({ ...copy, start: "2020-01-01" }, copy.stops[0]!)).rejects.toThrow(
      "15 minutes",
    );
    expect(bridge.permission).not.toHaveBeenCalled();
  });
  it("keeps reminder permission requests out of the browser preview", async () => {
    bridge.native.mockReturnValue(false);
    const copy = trip();
    await expect(remindAboutStop(copy, copy.stops[0]!)).rejects.toThrow("installed iPhone app");
    expect(bridge.permission).not.toHaveBeenCalled();
  });
  it("writes a native PDF file and invokes the file share sheet", async () => {
    const uri = await sharePdf(new Blob(["%PDF-test"], { type: "application/pdf" }), "plan.pdf");
    expect(bridge.file).toHaveBeenCalledWith({
      path: "plan.pdf",
      directory: "CACHE",
      data: expect.any(String),
    });
    expect(bridge.share).toHaveBeenCalledWith({ title: "plan.pdf", files: [uri] });
  });
  it("accepts only the app's registered authentication callback and removes listeners", async () => {
    const auth = vi.fn().mockResolvedValue(undefined);
    const cleanup = await setupNativeApp(auth);
    const callback = bridge.addListener.mock.calls[0]![1];
    callback({ url: "https://example.com/auth/callback?code=untrusted" });
    callback({ url: "com.yourtravelbuddy.app://auth/callback?code=test-code" });
    await Promise.resolve();
    expect(auth).toHaveBeenCalledTimes(1);
    expect(auth).toHaveBeenCalledWith("test-code");
    cleanup();
    expect(bridge.remove).toHaveBeenCalled();
  });
  it("opens directions in the map app and provider links in the in-app browser", async () => {
    const cleanup = await setupNativeApp(vi.fn());
    for (const href of ["https://maps.apple.com/?daddr=Lisbon", "https://www.booking.com/"]) {
      const anchor = document.createElement("a");
      anchor.href = href;
      document.body.append(anchor);
      anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      anchor.remove();
    }
    expect(bridge.launcher).toHaveBeenCalledWith({ url: "https://maps.apple.com/?daddr=Lisbon" });
    expect(bridge.browser).toHaveBeenCalledWith({ url: "https://www.booking.com/" });
    cleanup();
  });
});
