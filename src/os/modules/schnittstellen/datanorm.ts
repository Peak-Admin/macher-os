/**
 * DATANORM 4 und 5 lesen (Artikelstammdaten vom Großhandel).
 *
 * Unterstützt die Satzarten
 * - `V` Vorlaufsatz (Version, Lieferant – nur zur Erkennung),
 * - `A` Artikelsatz: Verarbeitungskennzeichen, Artikelnummer, Kurztexte, Preiskennzeichen, Preiseinheit,
 *   Mengeneinheit, Preis, Rabattgruppe, Warengruppe,
 * - `B` Artikel-Zusatzsatz: Matchcode, EAN.
 * Andere Satzarten (Langtexte `T`, Preisänderungen `P`, Rabatte `R` …) werden gezählt und übersprungen.
 *
 * Felder sind durch Semikolon getrennt (DATANORM 4 und 5). Preise ohne Komma haben zwei Nachkommastellen
 * („4800“ = 48,00 €) und gelten je Preiseinheit (0 = 1, 1 = 10, 2 = 100, 3 = 1000 Stück/Meter …).
 * Preiskennzeichen 1 = Listenpreis (Verkauf, vor deinem Rabatt), 2 = Nettopreis (dein Einkauf).
 *
 * Ergebnis sind `ImportZeile`n des Artikel-Imports – gespeichert wird mit `artikelImportieren`, dieselbe
 * Logik wie beim CSV-Import (vorhandene Artikel mit gleicher Nummer/EAN werden aktualisiert, nicht verdoppelt).
 */
import { einheitAus, type ImportZeile } from '@modules/artikel/daten';
import type { Cent, Einheit } from '@core/objects';

export interface DatanormErgebnis {
  version?: 4 | 5;
  lieferant?: string;
  zeilen: ImportZeile[];
  /** Artikelnummern mit Kennzeichen „L“ (löschen) */
  loeschen: string[];
  /** übersprungene Sätze je Satzart, z. B. { T: 120, P: 3 } */
  uebersprungen: Record<string, number>;
  fehler?: string;
}

const CP850 =
  'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ ';

/** DOS-Zeichensatz CP850, in dem viele DATANORM-Dateien geliefert werden */
export function cp850(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += b < 0x80 ? String.fromCharCode(b) : CP850[b - 0x80];
  return s;
}

/** Text einer DATANORM-Datei: UTF-8, sonst CP850 (DOS) oder Windows-1252 – je nachdem, was nach Umlauten aussieht */
export function datanormText(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    /* kein UTF-8 */
  }
  let dos = 0;
  let win = 0;
  for (const b of bytes) {
    if (b === 0x81 || b === 0x84 || b === 0x8e || b === 0x94 || b === 0x99 || b === 0x9a || b === 0xe1) dos++;
    if (b === 0xe4 || b === 0xf6 || b === 0xfc || b === 0xc4 || b === 0xd6 || b === 0xdc || b === 0xdf) win++;
  }
  return dos > win ? cp850(bytes) : new TextDecoder('windows-1252').decode(bytes);
}

const EINHEITEN: Record<string, Einheit> = {
  stck: 'Stk', 'stck.': 'Stk', stk: 'Stk', st: 'Stk', 'st.': 'Stk', stück: 'Stk', stueck: 'Stk', paar: 'Stk', satz: 'Stk', rol: 'Stk', rolle: 'Stk',
  m: 'm', mtr: 'm', lfm: 'm', lm: 'm', meter: 'm',
  m2: 'm²', 'm²': 'm²', qm: 'm²',
  m3: 'm³', 'm³': 'm³', cbm: 'm³',
  kg: 'kg', l: 'l', ltr: 'l', liter: 'l',
  pak: 'Pkt', pack: 'Pkt', pkt: 'Pkt', ve: 'Pkt', karton: 'Pkt', ktn: 'Pkt', bund: 'Pkt',
  h: 'h', std: 'h',
  psch: 'Psch', pauschal: 'Psch',
};

export function datanormEinheit(s: string | undefined): Einheit {
  const k = (s ?? '').trim().toLowerCase();
  return EINHEITEN[k] ?? einheitAus(k);
}

/** Preis in Cent je Einheit. `roh` ohne Komma = zwei Nachkommastellen. */
export function datanormPreis(roh: string | undefined, preiseinheit: string | undefined): Cent | undefined {
  const s = (roh ?? '').trim();
  if (!s) return undefined;
  const zahl = /[.,]/.test(s) ? Number(s.replace(/\./g, '').replace(',', '.')) * 100 : Number(s);
  if (!Number.isFinite(zahl) || zahl < 0) return undefined;
  const teiler = [1, 10, 100, 1000][Number(preiseinheit?.trim() || 0)] ?? 1;
  return Math.round(zahl / teiler);
}

/** Version aus dem Vorlaufsatz, sonst aus dem Aufbau der Artikelsätze */
function versionAus(v: string | undefined): 4 | 5 | undefined {
  if (!v) return undefined;
  if (v.includes(';')) {
    const n = Number(v.split(';')[1]?.trim().slice(0, 2));
    return n === 4 || n === 40 ? 4 : n === 5 || n === 50 ? 5 : n >= 50 ? 5 : n >= 4 ? 4 : undefined;
  }
  const fest = v.slice(123, 125);
  return fest === '04' ? 4 : fest === '05' ? 5 : undefined;
}

const leer = (s: string | undefined) => !s || !s.trim();

/**
 * DATANORM-Text lesen. `rabattProzent`: dein Rabatt auf den Listenpreis – damit wird bei Listenpreisen
 * auch der Einkaufspreis gesetzt (sonst bleibt der vorhandene Einkaufspreis unverändert).
 */
export function datanormLesen(text: string, opts: { rabattProzent?: number } = {}): DatanormErgebnis {
  const zeilen = text.replace(/^﻿/, '').split(/\r?\n/).filter((z) => z.trim());
  const ergebnis: DatanormErgebnis = { zeilen: [], loeschen: [], uebersprungen: {} };
  if (!zeilen.length) return { ...ergebnis, fehler: 'Die Datei ist leer.' };
  const vorlauf = zeilen.find((z) => z[0] === 'V');
  ergebnis.version = versionAus(vorlauf);
  if (vorlauf?.includes(';')) ergebnis.lieferant = vorlauf.split(';').slice(2).find((f) => /[a-zäöü]{3}/i.test(f) && !/^\d/.test(f.trim()))?.trim();

  const artikel = new Map<string, ImportZeile>();
  const zusatz = new Map<string, { ean?: string; matchcode?: string; warengruppe?: string }>();
  let festeBreite = 0;
  for (const z of zeilen) {
    const satz = z[0];
    if (satz === 'V') continue;
    if ((satz === 'A' || satz === 'B') && !z.includes(';')) {
      festeBreite++;
      continue;
    }
    const f = z.split(';');
    if (satz === 'A' && f.length >= 10) {
      const nummer = f[2]?.trim();
      if (!nummer) continue;
      const kennz = f[1]?.trim().toUpperCase();
      if (kennz === 'L') {
        ergebnis.loeschen.push(nummer);
        continue;
      }
      const name = [f[4], f[5]].map((t) => t?.trim()).filter(Boolean).join(' ');
      const preis = datanormPreis(f[9], f[7]);
      const liste = f[6]?.trim() === '1';
      const ek = liste ? (preis != null && opts.rabattProzent != null ? Math.round((preis * (100 - opts.rabattProzent)) / 100) : undefined) : preis;
      artikel.set(nummer, {
        name,
        nummer,
        einheit: leer(f[8]) ? undefined : datanormEinheit(f[8]),
        ek,
        vk: liste ? preis : undefined,
        kategorie: f[11]?.trim() ? `Warengruppe ${f[11].trim()}` : undefined,
        fehler: name ? undefined : 'Bezeichnung fehlt',
      });
      continue;
    }
    if (satz === 'B' && f.length >= 3) {
      const nummer = f[2]?.trim();
      if (!nummer) continue;
      const ean = [f[8], f[6], f[7], f[9]].map((x) => x?.trim()).find((x) => !!x && /^\d{8,14}$/.test(x) && !/^0+$/.test(x));
      zusatz.set(nummer, { ean, matchcode: f[3]?.trim() || undefined });
      continue;
    }
    ergebnis.uebersprungen[satz] = (ergebnis.uebersprungen[satz] ?? 0) + 1;
  }
  if (!artikel.size && !ergebnis.loeschen.length) {
    if (festeBreite) return { ...ergebnis, fehler: 'Diese Datei hat feste Spaltenbreiten (DATANORM 3). Bitte frag deinen Großhändler nach DATANORM 4 oder 5.' };
    return { ...ergebnis, fehler: 'In der Datei stehen keine Artikel (Satzart A). Ist das eine DATANORM-Datei?' };
  }
  for (const [nummer, b] of zusatz) {
    const a = artikel.get(nummer);
    if (!a) continue;
    if (b.ean) a.ean = b.ean;
    if (!a.name && b.matchcode) {
      a.name = b.matchcode;
      a.fehler = undefined;
    }
  }
  ergebnis.zeilen = [...artikel.values()];
  if (!ergebnis.version) ergebnis.version = 4;
  return ergebnis;
}
