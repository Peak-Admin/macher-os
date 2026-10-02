import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Arbeitskopien paralleler Agenten (gitignored)
    ".claude/**",
  ]),
  {
    // Macher OS (src/os) wurde bis zur Zusammenführung nicht mit diesen Regeln geprüft.
    // Bestehende Funde erst als Warnung zeigen und schrittweise abbauen.
    files: ["src/os/**"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-assign-module-variable": "warn",
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
