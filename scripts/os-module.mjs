// Erzeugt src/os/shell/module-liste.ts: alle Module unter src/os/modules/<id>/index.ts(x).
// Läuft automatisch vor `dev`, `build` und `test`. Aufruf von Hand: node scripts/os-module.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const wurzel = new URL("..", import.meta.url).pathname;
const modulOrdner = join(wurzel, "src/os/modules");
const ziel = join(wurzel, "src/os/shell/module-liste.ts");

const ids = readdirSync(modulOrdner, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((id) => ["index.ts", "index.tsx"].some((f) => existsSync(join(modulOrdner, id, f))))
  .sort();

const name = (id) => "m_" + id.replace(/[^a-zA-Z0-9]/g, "_");
const inhalt = `// Automatisch erzeugt von scripts/os-module.mjs – nicht von Hand bearbeiten.
import type { ModulDef } from '@core/modul';
${ids.map((id) => `import ${name(id)} from '../modules/${id}';`).join("\n")}

export const modulListe: [string, ModulDef][] = [
${ids.map((id) => `  ['${id}', ${name(id)}],`).join("\n")}
];
`;

if (!existsSync(ziel) || readFileSync(ziel, "utf8") !== inhalt) {
  writeFileSync(ziel, inhalt);
  console.log(`module-liste.ts aktualisiert (${ids.length} Module)`);
}
