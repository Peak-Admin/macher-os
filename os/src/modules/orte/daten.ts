/**
 * Orte & Baustellen: Vor-Ort-Infos (Zugang, Parken, Schlüssel) strukturiert lesen und schreiben.
 *
 * Das Kernobjekt `Ort` hat nur ein Freitextfeld `hinweise`. Damit es genau ein Feld bleibt,
 * schreiben wir die Infos zeilenweise mit Präfix hinein („Zugang: …“, „Parken: …“, „Schlüssel: …“).
 * Freitext ohne Präfix bleibt erhalten und wird nach Stichworten zugeordnet.
 */
import { tageZwischen, datumVon, heute } from '@core/format';
import { db } from '@core/db';
import type { Auftrag, ID, Ort, Termin } from '@core/objects';

export interface OrtInfos {
  zugang?: string;
  parken?: string;
  schluessel?: string;
  /** alles andere: Hund, Baustrom, Arbeitszeiten … */
  sonstiges?: string;
}

const FELDER: { key: keyof OrtInfos; label: string; muster: RegExp }[] = [
  { key: 'schluessel', label: 'Schlüssel', muster: /schlüssel|schluessel|schlüsselsafe|code|tresor/i },
  { key: 'parken', label: 'Parken', muster: /park|zufahrt|einfahrt|stellplatz|halteverbot|anfahrt/i },
  { key: 'zugang', label: 'Zugang', muster: /zugang|klingel|eingang|\btor\b|hinterhof|aufzug|treppenhaus|etage|\bhof\b/i },
];

export const INFO_LABEL: Record<keyof OrtInfos, string> = {
  zugang: 'Zugang',
  parken: 'Parken',
  schluessel: 'Schlüssel',
  sonstiges: 'Gut zu wissen',
};

function anhaengen(i: OrtInfos, key: keyof OrtInfos, text: string) {
  i[key] = i[key] ? `${i[key]} ${text}` : text;
}

export function ortInfosLesen(text: string | undefined): OrtInfos {
  const i: OrtInfos = {};
  if (!text?.trim()) return i;
  for (const roh of text.split(/\n+/)) {
    const zeile = roh.trim();
    if (!zeile) continue;
    const praefix = zeile.match(/^(zugang|parken|schlüssel|schluessel|gut zu wissen|sonstiges)\s*:\s*(.*)$/i);
    if (praefix) {
      const p = praefix[1].toLowerCase();
      const key: keyof OrtInfos = p.startsWith('zug') ? 'zugang' : p.startsWith('park') ? 'parken' : p.startsWith('schl') ? 'schluessel' : 'sonstiges';
      if (praefix[2].trim()) anhaengen(i, key, praefix[2].trim());
      continue;
    }
    // Freitext: Satzweise nach Stichworten zuordnen
    for (const satz of zeile.split(/(?<=[.!?])\s+/)) {
      const f = FELDER.find((x) => x.muster.test(satz));
      anhaengen(i, f?.key ?? 'sonstiges', satz.trim());
    }
  }
  return i;
}

export function ortInfosSchreiben(i: OrtInfos): string | undefined {
  const zeilen = (['zugang', 'parken', 'schluessel', 'sonstiges'] as const)
    .filter((k) => i[k]?.trim())
    .map((k) => `${INFO_LABEL[k]}: ${i[k]!.trim().replace(/\s*\n\s*/g, ' ')}`);
  return zeilen.length ? zeilen.join('\n') : undefined;
}

/** Weiß der Monteur, wie er reinkommt und wen er anruft? */
export function hatVorOrtInfos(o: Pick<Ort, 'hinweise' | 'ansprechpartnerVorOrt' | 'telefonVorOrt'>): boolean {
  return !!(o.hinweise?.trim() || o.ansprechpartnerVorOrt?.trim() || o.telefonVorOrt?.trim());
}

/**
 * Termine in den nächsten `tage` Tagen an Orten ohne Vor-Ort-Infos.
 * Nur Baustellen, Gewerbe, Wohnanlagen – beim Einfamilienhaus öffnet meist der Kunde selbst.
 */
export function orteOhneInfosVorTermin(orte: Ort[], termine: Termin[], tage = 3, stichtag = heute()): { ort: Ort; termin: Termin }[] {
  const ergebnis: { ort: Ort; termin: Termin }[] = [];
  const gesehen = new Set<ID>();
  const relevant = termine
    .filter((t) => t.ortId && !['erledigt', 'abgesagt'].includes(t.status) && t.art !== 'intern')
    .filter((t) => {
      const d = tageZwischen(stichtag, datumVon(t.start));
      return d >= 0 && d <= tage;
    })
    .sort((a, b) => a.start.localeCompare(b.start));
  for (const t of relevant) {
    const o = orte.find((x) => x.id === t.ortId);
    if (!o || gesehen.has(o.id) || o.art === 'haus' || o.art === 'wohnung') continue;
    if (!hatVorOrtInfos(o)) {
      gesehen.add(o.id);
      ergebnis.push({ ort: o, termin: t });
    }
  }
  return ergebnis;
}

/**
 * Welcher Ort passt zu einem Auftrag ohne Ort?
 * Genau ein Ort beim Kunden → dieser. Sonst keiner (Mensch entscheidet).
 */
export function passenderOrt(auftrag: Pick<Auftrag, 'kundeId' | 'ortId'>, orte: Ort[]): Ort | undefined {
  if (auftrag.ortId) return undefined;
  const beimKunden = orte.filter((o) => o.kundeId === auftrag.kundeId && !o.geloeschtAm);
  return beimKunden.length === 1 ? beimKunden[0] : undefined;
}

export const ORT_ARTEN: { wert: Ort['art']; label: string }[] = [
  { wert: 'haus', label: 'Haus' },
  { wert: 'wohnung', label: 'Wohnung' },
  { wert: 'gewerbe', label: 'Gewerbe / Wohnanlage' },
  { wert: 'baustelle', label: 'Baustelle' },
  { wert: 'filiale', label: 'Filiale' },
  { wert: 'sonstiges', label: 'Sonstiges' },
];

export const ortArtLabel = (a: Ort['art']) => ORT_ARTEN.find((x) => x.wert === a)?.label ?? a;

/**
 * Erster Ort eines Privatkunden ohne Anschrift (z. B. am Telefon angelegt): Das ist seine Anschrift.
 * Sonst bleibt die Rechnung an der fehlenden Kundenadresse hängen.
 */
export function kundenAnschriftAusOrt(ort: Ort): boolean {
  const k = db.kunden.get(ort.kundeId);
  if (!k || k.art !== 'privat' || (k.adresse?.strasse && k.adresse.ort)) return false;
  if (db.orte.where((o) => o.kundeId === k.id && o.id !== ort.id).length) return false;
  db.kunden.update(k.id, { adresse: { ...ort.adresse } }, { text: `Anschrift aus Ort ${ort.bezeichnung} übernommen` });
  return true;
}
