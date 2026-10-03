/**
 * Wache: In der Software steht nirgends Browser-Standard-Oberfläche (eigenes Design immer, siehe CLAUDE.md).
 * Erlaubt sind nur die Bausteine in src/os/ui, die den Browser-Standard ersetzen.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function dateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((n) => {
    const p = join(ordner, n);
    if (statSync(p).isDirectory()) return dateien(p);
    return /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [p] : [];
  });
}

const VERBOTEN: [RegExp, string][] = [
  [/<select[\s>]/, 'native Auswahlliste – nimm <Auswahl>'],
  [/<datalist[\s>]/, 'Browser-Vorschlagsliste – nimm <Eingabe vorschlaege={…}>'],
  [/<input[^>]*type="(time|date|datetime-local|month|week|color|range)"/, 'Browser-Wähler – nimm <Eingabe type="…"> (eigene Wahl)'],
  [/<input[^>]*type="checkbox"/, 'Browser-Checkbox – nimm <Checkbox>'],
  [/<input[^>]*type="radio"(?![^>]*mm-radio)/, 'Browser-Radio – Klasse mm-radio oder <Segmente>'],
  [/(?<!<iframe[^>]*)\stitle=[{"]/, 'System-Tooltip – nimm data-tipp="…"'],
  [/\b(window\.)?(alert|confirm)\(/, 'Browser-Dialog – nimm Dialog oder useBestaetigen'],
  [/<details>/, 'Aufklapper ohne Gestaltung – className="mm-aufklapper"'],
];

/** Diese Dateien bauen den Ersatz und dürfen das native Element intern nutzen */
const ERSATZ = new Set(['src/os/ui/index.tsx', 'src/os/ui/eingaben.tsx']);

describe('kein Browser-Standard in der Software', () => {
  it('nutzt überall die eigenen Bausteine', () => {
    const funde: string[] = [];
    for (const p of dateien('src/os')) {
      const datei = p.replaceAll('\\', '/');
      readFileSync(p, 'utf8')
        .split('\n')
        .forEach((zeile, i) => {
          if (/^(\*|\/\*|\/\/)/.test(zeile.trim())) return;
          for (const [muster, grund] of VERBOTEN) {
            if (!muster.test(zeile)) continue;
            if (ERSATZ.has(datei) && /checkbox|select/.test(muster.source)) continue;
            funde.push(`${datei}:${i + 1} ${grund}`);
          }
        });
    }
    expect(funde).toEqual([]);
  });
});
