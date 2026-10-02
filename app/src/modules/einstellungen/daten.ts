/** Einstellungen: Datensicherung, Beispieldaten, Papierkorb und Prüfungen der Betriebsdaten – reine Logik. */
import { exportieren } from '@core/db';
import { OBJEKT_LABEL, type Basis, type Betrieb, type ObjektTyp } from '@core/objects';

type Daten = Record<string, Record<string, Basis>>;

export const SICHERUNG_FORMAT = 'macher-os-sicherung';
export const LETZTE_SICHERUNG_KEY = 'einstellungen.letzteSicherung';

export function sicherungErstellen(daten: Daten = exportieren(), jetzt = new Date().toISOString()) {
  const betrieb = daten.betrieb?.betrieb as Betrieb | undefined;
  return { format: SICHERUNG_FORMAT, version: 1, erstelltAm: jetzt, betrieb: betrieb?.name, daten };
}

export type PruefErgebnis =
  | { ok: true; daten: Daten; erstelltAm?: string; betrieb?: string; anzahl: number }
  | { ok: false; fehler: string };

const istObjekt = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

/** Prüft eine eingelesene Sicherung, bevor sie alles ersetzt */
export function sicherungPruefen(json: unknown): PruefErgebnis {
  if (!istObjekt(json)) return { ok: false, fehler: 'Die Datei ist keine Macher-Sicherung.' };
  const verpackt = json.format === SICHERUNG_FORMAT;
  if (json.format === 'macher-os-export') return { ok: false, fehler: 'Das ist ein JSON-Export für andere Programme, keine Sicherung. Nimm die Datei aus „Sicherung herunterladen“.' };
  const daten = verpackt ? json.daten : json;
  if (!istObjekt(daten)) return { ok: false, fehler: 'In der Datei stehen keine Daten.' };
  let anzahl = 0;
  for (const [name, tabelle] of Object.entries(daten)) {
    if (!istObjekt(tabelle)) return { ok: false, fehler: `Die Sammlung „${name}“ ist beschädigt.` };
    for (const [id, obj] of Object.entries(tabelle)) {
      if (!istObjekt(obj) || obj.id !== id) return { ok: false, fehler: `Ein Eintrag in „${name}“ ist beschädigt.` };
      anzahl++;
    }
  }
  const betrieb = istObjekt(daten.betrieb) ? (daten.betrieb.betrieb as Betrieb | undefined) : undefined;
  if (!betrieb || !betrieb.name) return { ok: false, fehler: 'In der Sicherung fehlen die Betriebsdaten.' };
  return { ok: true, daten: daten as Daten, erstelltAm: verpackt ? String(json.erstelltAm ?? '') || undefined : undefined, betrieb: betrieb.name, anzahl };
}

/** Beispieldaten aus allen Sammlungen (auch denen der Module) entfernen. Gibt die bereinigten Daten und die Anzahl zurück. */
export function ohneBeispiele(daten: Daten): { daten: Daten; entfernt: number } {
  let entfernt = 0;
  const neu: Daten = {};
  for (const [name, tabelle] of Object.entries(daten)) {
    neu[name] = {};
    for (const [id, obj] of Object.entries(tabelle)) {
      if (obj.beispiel) entfernt++;
      else neu[name][id] = obj;
    }
  }
  return { daten: neu, entfernt };
}

export function beispielAnzahl(daten: Daten): number {
  return Object.values(daten).reduce((s, t) => s + Object.values(t).filter((x) => x.beispiel).length, 0);
}

// ------------------------------------------------------------------ Papierkorb

/** Sammlungen ohne Papierkorb-Anzeige */
const NICHT_IM_PAPIERKORB = new Set(['ereignisse', 'einstellungen', 'erledigungen', 'benachrichtigungen', 'schnittstellen']);

/** Aufbewahrungspflicht (GoBD): nicht endgültig löschbar */
export const AUFBEWAHREN = new Set(['rechnungen', 'zahlungen', 'belege', 'angebote']);

const EIGENE_LABEL: Record<string, string> = { vorlagen: 'Vorlage', wissen: 'Anleitung', subunternehmer: 'Subunternehmer' };

export function sammlungLabel(name: string): string {
  return OBJEKT_LABEL[name as ObjektTyp] ?? EIGENE_LABEL[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

/** Lesbarer Titel für beliebige Objekte */
export function objektTitel(o: Record<string, unknown>): string {
  const s = (k: string) => (typeof o[k] === 'string' && (o[k] as string).trim() ? (o[k] as string).trim() : undefined);
  const person = s('vorname') || s('nachname') ? [s('vorname'), s('nachname')].filter(Boolean).join(' ') : undefined;
  const nummer = s('nummer');
  const titel = s('name') ?? s('titel') ?? person ?? s('bezeichnung') ?? s('typ') ?? s('text')?.slice(0, 60);
  if (nummer && titel) return `${nummer} · ${titel}`;
  return titel ?? nummer ?? 'Ohne Titel';
}

export interface PapierkorbEintrag {
  sammlung: string;
  id: string;
  titel: string;
  art: string;
  geloeschtAm: string;
  aufbewahren: boolean;
}

export function papierkorbEintraege(daten: Daten): PapierkorbEintrag[] {
  const liste: PapierkorbEintrag[] = [];
  for (const [name, tabelle] of Object.entries(daten)) {
    if (NICHT_IM_PAPIERKORB.has(name)) continue;
    for (const obj of Object.values(tabelle)) {
      if (!obj.geloeschtAm) continue;
      liste.push({ sammlung: name, id: obj.id, titel: objektTitel(obj as unknown as Record<string, unknown>), art: sammlungLabel(name), geloeschtAm: obj.geloeschtAm, aufbewahren: AUFBEWAHREN.has(name) });
    }
  }
  return liste.sort((a, b) => b.geloeschtAm.localeCompare(a.geloeschtAm));
}

// ------------------------------------------------------------------ Betriebsdaten

/** IBAN-Prüfsumme (ISO 13616, Modulo 97) */
export function ibanGueltig(iban: string): boolean {
  const s = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  if (s.startsWith('DE') && s.length !== 22) return false;
  const umgestellt = s.slice(4) + s.slice(0, 4);
  const ziffern = umgestellt.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const z of ziffern) rest = (rest * 10 + Number(z)) % 97;
  return rest === 1;
}

/** USt-IdNr. Deutschland: DE + 9 Ziffern (nur Format) */
export function ustIdFormatOk(ustId: string): boolean {
  const s = ustId.replace(/\s/g, '').toUpperCase();
  return !s.startsWith('DE') || /^DE\d{9}$/.test(s);
}

/** Was fehlt für ordentliche Rechnungen? (§ 14 UStG: Name, Anschrift, Steuernummer oder USt-IdNr.) */
export function fehlendeRechnungsangaben(b: Betrieb | undefined): string[] {
  if (!b) return [];
  const fehlt: string[] = [];
  if (!b.adresse?.strasse || !b.adresse?.plz || !b.adresse?.ort) fehlt.push('Anschrift');
  if (!b.steuernummer?.trim() && !b.ustId?.trim()) fehlt.push('Steuernummer oder USt-IdNr.');
  if (!b.iban?.trim()) fehlt.push('Bankverbindung');
  if (!b.telefon?.trim() && !b.email?.trim()) fehlt.push('Telefon oder E-Mail');
  return fehlt;
}
