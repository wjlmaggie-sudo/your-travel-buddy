import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// A client-only build of the same routes and components, without Start/Nitro.
// The separate Lovable config remains untouched for editor previews and hosting.
export default defineConfig(() => {
  return {
    base: process.env["PAGES_BASE_PATH"] || "/your-travel-buddy/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@/lib/ai.functions": fileURLToPath(new URL("./src/lib/ai.edge.ts", import.meta.url)),
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: { "import.meta.env.VITE_STATIC_PAGES": JSON.stringify("true") },
    build: { outDir: "dist", emptyOutDir: true },
    server: { host: "127.0.0.1", port: 4175 },
  };
});
