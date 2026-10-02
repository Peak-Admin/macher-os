/**
 * Artikel & Material: Preise (EK/VK/Aufschlag) und CSV-Import.
 * Kernobjekt `db.artikel` – keine eigene Sammlung.
 */
import { batch, db } from '@core/db';
import type { Artikel, Cent, Einheit, ID } from '@core/objects';
import { zahlAus } from '@ui/index';

// ------------------------------------------------------------------ Preise

/** Aufschlag auf den EK in Prozent: (VK − EK) / EK */
export function aufschlagProzent(ek: Cent, vk: Cent): number | undefined {
  if (!ek) return undefined;
  return Math.round(((vk - ek) / ek) * 1000) / 10;
}

/** Marge (Anteil am VK) in Prozent: (VK − EK) / VK */
export function margeProzent(ek: Cent, vk: Cent): number | undefined {
  if (!vk) return undefined;
  return Math.round(((vk - ek) / vk) * 1000) / 10;
}

export function vkAusAufschlag(ek: Cent, prozent: number): Cent {
  return Math.round(ek * (1 + prozent / 100));
}

// ------------------------------------------------------------------ Einheiten

const EINHEITEN: Record<string, Einheit> = {
  stk: 'Stk', st: 'Stk', stück: 'Stk', stueck: 'Stk', 'st.': 'Stk', pcs: 'Stk', pce: 'Stk',
  m: 'm', meter: 'm', lfm: 'm',
  'm²': 'm²', m2: 'm²', qm: 'm²',
  'm³': 'm³', m3: 'm³', cbm: 'm³',
  h: 'h', std: 'h', stunde: 'h',
  psch: 'Psch', pauschal: 'Psch', pau: 'Psch',
  kg: 'kg', l: 'l', liter: 'l', ltr: 'l',
  pkt: 'Pkt', pak: 'Pkt', paket: 'Pkt', pack: 'Pkt', vpe: 'Pkt', ve: 'Pkt',
  km: 'km',
};

export const ALLE_EINHEITEN: Einheit[] = ['Stk', 'm', 'm²', 'm³', 'kg', 'l', 'Pkt', 'Psch', 'h', 'km'];

export function einheitAus(s: string | undefined): Einheit {
  return EINHEITEN[(s ?? '').trim().toLowerCase()] ?? 'Stk';
}

// ------------------------------------------------------------------ CSV

/** CSV mit Semikolon (Excel-Standard in DE), Anführungszeichen werden beachtet. */
export function csvParsen(text: string, trenner = ';'): string[][] {
  const zeilen: string[][] = [];
  let zeile: string[] = [];
  let feld = '';
  let inQuote = false;
  const t = text.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuote) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          feld += '"';
          i++;
        } else inQuote = false;
      } else feld += c;
    } else if (c === '"') inQuote = true;
    else if (c === trenner) {
      zeile.push(feld);
      feld = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      zeile.push(feld);
      feld = '';
      if (zeile.some((f) => f.trim())) zeilen.push(zeile);
      zeile = [];
    } else feld += c;
  }
  zeile.push(feld);
  if (zeile.some((f) => f.trim())) zeilen.push(zeile);
  return zeilen.map((z) => z.map((f) => f.trim()));
}

export type ImportFeld = 'name' | 'nummer' | 'ean' | 'herstellerNummer' | 'einheit' | 'ek' | 'vk' | 'kategorie' | 'mindestbestand';

export const IMPORT_FELDER: { feld: ImportFeld; label: string; pflicht?: boolean }[] = [
  { feld: 'name', label: 'Bezeichnung', pflicht: true },
  { feld: 'nummer', label: 'Artikelnummer' },
  { feld: 'ean', label: 'EAN' },
  { feld: 'herstellerNummer', label: 'Hersteller-Nr.' },
  { feld: 'einheit', label: 'Einheit' },
  { feld: 'ek', label: 'Einkaufspreis netto' },
  { feld: 'vk', label: 'Verkaufspreis netto' },
  { feld: 'kategorie', label: 'Kategorie' },
  { feld: 'mindestbestand', label: 'Mindestbestand' },
];

const MUSTER: Record<ImportFeld, RegExp> = {
  name: /^(bezeichnung|name|artikel(name|bezeichnung)?|beschreibung|kurztext|text)/i,
  nummer: /^(art(ikel)?[ .-]*n(umme)?r\.?|artnr\.?|nummer|nr\.?)$/i,
  ean: /^(ean|gtin|barcode)/i,
  herstellerNummer: /^(hersteller[ .-]*(art(ikel)?)?[ .-]*n(umme)?r|herst)/i,
  einheit: /^(einheit|me|mengeneinheit|unit)$/i,
  ek: /^(ek|einkauf|netto[ -]?ek|ek[ -]?preis|einkaufspreis)/i,
  vk: /^(vk|verkauf|listenpreis|vk[ -]?preis|verkaufspreis|preis)/i,
  kategorie: /^(kategorie|warengruppe|gruppe|wg)/i,
  mindestbestand: /^(mindest|min\.?[ -]?bestand|meldebestand)/i,
};

export type Zuordnung = Partial<Record<ImportFeld, number>>;

/** Spalten anhand der Überschriften erraten */
export function spaltenRaten(kopf: string[]): Zuordnung {
  const z: Zuordnung = {};
  const vergeben = new Set<number>();
  // spezifische Felder zuerst, damit „Hersteller-Nr.“ nicht als „Nr.“ landet
  const reihenfolge: ImportFeld[] = ['herstellerNummer', 'ean', 'nummer', 'einheit', 'ek', 'vk', 'kategorie', 'mindestbestand', 'name'];
  for (const feld of reihenfolge) {
    const i = kopf.findIndex((k, idx) => !vergeben.has(idx) && MUSTER[feld].test(k.trim()));
    if (i >= 0) {
      z[feld] = i;
      vergeben.add(i);
    }
  }
  return z;
}

export interface ImportZeile {
  name: string;
  nummer?: string;
  ean?: string;
  herstellerNummer?: string;
  einheit?: Einheit;
  /** leer = in der Datei nicht angegeben */
  ek?: Cent;
  vk?: Cent;
  kategorie?: string;
  mindestbestand?: number;
  fehler?: string;
}

export function zeilenUmwandeln(daten: string[][], z: Zuordnung, opts: { aufschlag?: number } = {}): ImportZeile[] {
  const wert = (zeile: string[], f: ImportFeld) => (z[f] != null ? zeile[z[f]!]?.trim() || undefined : undefined);
  return daten.map((zeile) => {
    const ekE = zahlAus(wert(zeile, 'ek'));
    const vkE = zahlAus(wert(zeile, 'vk'));
    const ek = ekE != null ? Math.round(ekE * 100) : undefined;
    const vk = vkE != null ? Math.round(vkE * 100) : opts.aufschlag != null && ek != null ? vkAusAufschlag(ek, opts.aufschlag) : undefined;
    const einheit = wert(zeile, 'einheit');
    const name = wert(zeile, 'name') ?? '';
    const mb = zahlAus(wert(zeile, 'mindestbestand'));
    return {
      name,
      nummer: wert(zeile, 'nummer'),
      ean: wert(zeile, 'ean'),
      herstellerNummer: wert(zeile, 'herstellerNummer'),
      einheit: einheit ? einheitAus(einheit) : undefined,
      ek,
      vk,
      kategorie: wert(zeile, 'kategorie'),
      mindestbestand: mb,
      fehler: !name ? 'Bezeichnung fehlt' : undefined,
    };
  });
}

/** Vorhandenen Artikel finden: Artikelnummer, dann EAN */
export function findeArtikel(z: Pick<ImportZeile, 'nummer' | 'ean'>, liste: Artikel[] = db.artikel.all()): Artikel | undefined {
  return (z.nummer && liste.find((a) => a.nummer === z.nummer)) || (z.ean && liste.find((a) => a.ean === z.ean)) || undefined;
}

/** Importiert gültige Zeilen. Vorhandene Artikel (gleiche Nummer/EAN) werden aktualisiert. */
export function artikelImportieren(zeilen: ImportZeile[], opts: { lieferantId?: ID } = {}): { neu: number; aktualisiert: number; uebersprungen: number } {
  let neu = 0;
  let aktualisiert = 0;
  let uebersprungen = 0;
  batch(() => {
    const liste = db.artikel.all();
    for (const z of zeilen) {
      if (z.fehler) {
        uebersprungen++;
        continue;
      }
      const daten = {
        name: z.name,
        nummer: z.nummer,
        ean: z.ean,
        herstellerNummer: z.herstellerNummer,
        einheit: z.einheit,
        ek: z.ek,
        vk: z.vk,
        kategorie: z.kategorie,
        ...(z.mindestbestand != null ? { mindestbestand: z.mindestbestand } : {}),
        ...(opts.lieferantId ? { lieferantId: opts.lieferantId } : {}),
      };
      const vorhanden = findeArtikel(z, liste);
      if (vorhanden) {
        // leere Felder überschreiben nichts
        const patch = Object.fromEntries(Object.entries(daten).filter(([, v]) => v !== undefined && v !== '')) as Partial<Artikel>;
        db.artikel.update(vorhanden.id, patch, { text: 'Per CSV aktualisiert' });
        aktualisiert++;
      } else {
        const a = db.artikel.create({ ...daten, einheit: z.einheit ?? 'Stk', ek: z.ek ?? 0, vk: z.vk ?? 0, aktiv: true });
        liste.push(a);
        neu++;
      }
    }
  });
  return { neu, aktualisiert, uebersprungen };
}

export function kategorien(): string[] {
  return [...new Set(db.artikel.all().map((a) => a.kategorie).filter((k): k is string => !!k))].sort((a, b) => a.localeCompare(b, 'de'));
}
