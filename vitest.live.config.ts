import { defineConfig } from "vitest/config";
import path from "node:path";
/** Explicit public-API smoke checks. No browser mocks, private keys or automatic CI traffic. */
export default defineConfig({
  test: { environment: "node", include: ["src/test/global-discovery-live.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
