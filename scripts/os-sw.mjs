// Übersetzt den Service Worker src/os/sw.ts nach public/os/sw.js (klassisches Skript, Scope /os/).
// Läuft automatisch vor `dev` und `build`. Aufruf von Hand: node scripts/os-sw.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const wurzel = new URL("..", import.meta.url).pathname;
const quelle = readFileSync(join(wurzel, "src/os/sw.ts"), "utf8")
  // `export` gibt es nur für die Tests – im Worker ist alles lokal
  .replace(/^export (const|function|async function|interface|type) /gm, "$1 ");
const { outputText } = ts.transpileModule(quelle, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, removeComments: false } });
const inhalt = `// Automatisch erzeugt aus src/os/sw.ts von scripts/os-sw.mjs – nicht von Hand bearbeiten.\n(() => {\n${outputText}})();\n`;
const ziel = join(wurzel, "public/os/sw.js");
if (!existsSync(ziel) || readFileSync(ziel, "utf8") !== inhalt) {
  writeFileSync(ziel, inhalt);
  console.log("public/os/sw.js aktualisiert");
}
