import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** Tests der Software (src/os). Die Tests der Website-Rechner laufen separat, siehe CLAUDE.md. */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@core": r("./src/os/core"),
      "@ui": r("./src/os/ui"),
      "@modules": r("./src/os/modules"),
      "@": r("./src"),
    },
  },
  test: { environment: "jsdom", globals: false, include: ["src/os/**/*.test.{ts,tsx}", "src/lib/ki/**/*.test.ts", "src/lib/link/**/*.test.ts", "src/app/api/**/*.test.ts", "src/server/**/*.test.ts"] },
});
