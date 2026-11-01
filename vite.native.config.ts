import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath, URL } from "node:url";

// Bundle the maintained app locally. No remote website is used as the app shell.
export default defineConfig({
  base: "/",
  plugins: [tanstackRouter({ autoCodeSplitting: false }), react(), tailwindcss()],
  resolve: {
    alias: {
      "@/lib/ai.functions": fileURLToPath(new URL("./src/lib/ai.edge.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "import.meta.env.VITE_STATIC_PAGES": JSON.stringify("true"),
    "import.meta.env.VITE_NATIVE_APP": JSON.stringify("true"),
  },
  build: { outDir: "dist-native", emptyOutDir: true },
  server: { host: "127.0.0.1", port: 4180 },
  preview: { host: "127.0.0.1", port: 4180 },
});
