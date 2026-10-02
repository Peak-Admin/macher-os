/**
 * Kleinster Excel-Leser (.xlsx) ohne Abhängigkeit: ZIP-Verzeichnis lesen, Einträge mit
 * `DecompressionStream('deflate-raw')` entpacken, erstes Tabellenblatt in Zeilen aus Text zerlegen.
 * Reicht für Kundenlisten (Text und Zahlen); Formeln liefern ihren zuletzt berechneten Wert.
 */

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

interface Eintrag {
  name: string;
  methode: number;
  groesse: number;
  offset: number;
}

function verzeichnis(b: Uint8Array): Eintrag[] {
  let ende = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 66000); i--) {
    if (u32(b, i) === 0x06054b50) {
      ende = i;
      break;
    }
  }
  if (ende < 0) throw new Error('Keine gültige Excel-Datei.');
  const anzahl = u16(b, ende + 10);
  let p = u32(b, ende + 16);
  const liste: Eintrag[] = [];
  const dec = new TextDecoder();
  for (let n = 0; n < anzahl; n++) {
    if (u32(b, p) !== 0x02014b50) break;
    const nameLen = u16(b, p + 28);
    liste.push({
      methode: u16(b, p + 10),
      groesse: u32(b, p + 20),
      offset: u32(b, p + 42),
      name: dec.decode(b.subarray(p + 46, p + 46 + nameLen)),
    });
    p += 46 + nameLen + u16(b, p + 30) + u16(b, p + 32);
  }
  return liste;
}

async function entpacken(b: Uint8Array, e: Eintrag): Promise<string> {
  const start = e.offset + 30 + u16(b, e.offset + 26) + u16(b, e.offset + 28);
  const roh = b.slice(start, start + e.groesse);
  if (e.methode === 0) return new TextDecoder().decode(roh);
  if (e.methode !== 8) throw new Error('Unbekannte Kompression in der Excel-Datei.');
  if (typeof DecompressionStream !== 'function') throw new Error('Dein Browser kann Excel-Dateien nicht öffnen. Speichere die Liste als CSV.');
  const strom = new Blob([roh]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return await new Response(strom).text();
}

const ENTITAETEN: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
export function xmlText(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITAETEN[e] ?? m;
  });
}

/** Alle <t>-Inhalte eines Elements (Rich Text besteht aus mehreren Läufen) */
const texte = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => xmlText(m[1])).join('');

function spalteIndex(ref: string): number {
  const buchstaben = ref.replace(/\d+$/, '');
  let n = 0;
  for (const c of buchstaben) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/** Tabellenblatt-XML + gemeinsame Texte → Zeilen */
export function blattZeilen(blatt: string, gemeinsam: string[]): string[][] {
  const zeilen: string[][] = [];
  for (const z of blatt.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const zeile: string[] = [];
    let naechste = 0;
    for (const c of z[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attr = c[1];
      const inhalt = c[2] ?? '';
      const ref = /\br="([A-Z]+\d+)"/.exec(attr)?.[1];
      const i = ref ? spalteIndex(ref) : naechste;
      const typ = /\bt="(\w+)"/.exec(attr)?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(inhalt)?.[1];
      let wert = '';
      if (typ === 's') wert = gemeinsam[Number(v)] ?? '';
      else if (typ === 'inlineStr') wert = texte(inhalt);
      else if (v != null) wert = xmlText(v);
      while (zeile.length < i) zeile.push('');
      zeile[i] = wert.trim();
      naechste = i + 1;
    }
    zeilen.push(zeile);
  }
  return zeilen;
}

/** Erstes Tabellenblatt einer .xlsx-Datei als Zeilen */
export async function xlsxZeilen(daten: ArrayBuffer): Promise<string[][]> {
  const b = new Uint8Array(daten);
  const eintraege = verzeichnis(b);
  const finde = (name: string) => eintraege.find((e) => e.name === name);
  const blaetter = eintraege.filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name)).sort((a, z) => Number(a.name.replace(/\D/g, '')) - Number(z.name.replace(/\D/g, '')));
  if (!blaetter.length) throw new Error('In der Excel-Datei wurde keine Tabelle gefunden.');
  const ss = finde('xl/sharedStrings.xml');
  const gemeinsam = ss ? [...(await entpacken(b, ss)).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texte(m[1])) : [];
  return blattZeilen(await entpacken(b, blaetter[0]), gemeinsam);
}

/** Ist das eine ZIP-Datei (xlsx)? */
export const istXlsx = (daten: ArrayBuffer) => {
  const b = new Uint8Array(daten.slice(0, 4));
  return b[0] === 0x50 && b[1] === 0x4b && b[2] === 3 && b[3] === 4;
};
