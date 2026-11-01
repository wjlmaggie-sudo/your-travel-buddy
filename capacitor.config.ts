import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yourtravelbuddy.app",
  appName: "Travel Buddy",
  webDir: "dist-native",
  backgroundColor: "#faf6ed",
  ios: { contentInset: "never", backgroundColor: "#faf6ed" },
};

export default config;
