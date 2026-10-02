/** Formatierung & Rechnen – überall dieselben Regeln. */
import type { Adresse, Cent, Datum, Position } from './objects';

const euroFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const zahlFmt = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

export const euro = (c: Cent | undefined) => (c == null ? '–' : euroFmt.format(c / 100));
export const zahl = (n: number | undefined) => (n == null ? '–' : zahlFmt.format(n));
/** "12,50" → 1250 Cent */
export function centAus(eingabe: string): Cent {
  const n = Number(eingabe.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
export const centAlsEingabe = (c: Cent | undefined) => (c == null ? '' : (c / 100).toFixed(2).replace('.', ','));

// ------------------------------------------------------------------ Datum

export const heute = (): Datum => isoDatum(new Date());
export function isoDatum(d: Date): Datum {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function plusTage(datum: Datum, tage: number): Datum {
  const d = new Date(datum + 'T12:00:00');
  d.setDate(d.getDate() + tage);
  return isoDatum(d);
}
export function tageZwischen(von: Datum, bis: Datum): number {
  const a = new Date(von + 'T12:00:00').getTime();
  const b = new Date(bis + 'T12:00:00').getTime();
  return Math.round((b - a) / 86_400_000);
}
/** Zeitpunkt aus Datum + "HH:MM" (lokale Zeit) */
export function zeitpunkt(datum: Datum, uhrzeit: string): string {
  return new Date(`${datum}T${uhrzeit}:00`).toISOString();
}
export function datumVon(zeitpunktIso: string): Datum {
  return isoDatum(new Date(zeitpunktIso));
}

/**
 * Datum plus N Monate. Fällt der Tag weg (31. → Februar), wird auf das Monatsende gekürzt.
 * Immer vom Ausgangsdatum aus rechnen, nicht kettenweise – sonst „wandert“ der 31. auf den 28.
 */
export function plusMonate(datum: Datum, monate: number): Datum {
  const [j, m, t] = datum.split('-').map(Number);
  const ziel = new Date(j, m - 1 + monate, 1, 12);
  const letzterTag = new Date(ziel.getFullYear(), ziel.getMonth() + 1, 0, 12).getDate();
  ziel.setDate(Math.min(t, letzterTag));
  return isoDatum(ziel);
}

/** Wochentag nach ISO: 1 = Montag … 7 = Sonntag */
export function wochentag(datum: Datum): number {
  const t = new Date(`${datum}T12:00:00`).getDay();
  return t === 0 ? 7 : t;
}

/** Montag der Woche, in der `datum` liegt */
export function wochenStart(datum: Datum): Datum {
  return plusTage(datum, 1 - wochentag(datum));
}

/** ISO-Kalenderwoche */
export function kalenderwoche(datum: Datum): number {
  const d = new Date(`${datum}T12:00:00`);
  d.setDate(d.getDate() + 4 - wochentag(datum)); // Donnerstag derselben Woche
  const w1 = new Date(d.getFullYear(), 0, 4, 12);
  return 1 + Math.round(((d.getTime() - w1.getTime()) / 86_400_000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}

/** Alle Tage von `von` bis `bis` (beide inklusive, höchstens 400) */
export function tage(von: Datum, bis: Datum): Datum[] {
  const liste: Datum[] = [];
  for (let d = von; d <= bis && liste.length < 400; d = plusTage(d, 1)) liste.push(d);
  return liste;
}

// ------------------------------------------------------------------ Uhrzeit

/** "07:30" → 450 (leere/kaputte Teile zählen als 0) */
export function minutenAus(uhr: string): number {
  const [h, m] = uhr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Wie `minutenAus`, aber nur für gültige Angaben „H:MM“/„HH:MM“ – sonst `undefined` */
export function minutenAusStreng(uhr: string | undefined): number | undefined {
  return /^\d{1,2}:\d{2}$/.test(uhr?.trim() ?? '') ? minutenAus(uhr!.trim()) : undefined;
}

/** 450 → "07:30" (gerundet; 1440 → "24:00") */
export function uhrAus(minuten: number): string {
  const gesamt = Math.round(minuten);
  const z = (n: number) => String(n).padStart(2, '0');
  return `${z(Math.floor(gesamt / 60))}:${z(gesamt % 60)}`;
}

/** Minuten seit Mitternacht (lokale Zeit) eines Zeitpunkts */
export function minutenVon(zeitpunktIso: string | Date): number {
  const d = zeitpunktIso instanceof Date ? zeitpunktIso : new Date(zeitpunktIso);
  return d.getHours() * 60 + d.getMinutes();
}

/** Lokales Datum + Minuten seit Mitternacht → Date */
export function lokal(datum: Datum, minuten: number): Date {
  const d = new Date(`${datum}T00:00:00`);
  d.setMinutes(minuten);
  return d;
}

const datumFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const kurzFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
const uhrFmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

export const datum = (d: Datum | string | undefined) =>
  d ? datumFmt.format(new Date(d.length === 10 ? d + 'T12:00:00' : d)) : '–';
export const datumKurz = (d: Datum | string | undefined) =>
  d ? kurzFmt.format(new Date(d.length === 10 ? d + 'T12:00:00' : d)) : '–';
export const uhrzeit = (iso: string | undefined) => (iso ? uhrFmt.format(new Date(iso)) : '–');

/** "heute", "morgen", "gestern", "in 3 Tagen", "vor 5 Tagen", sonst Datum */
export function relativ(d: Datum | string | undefined): string {
  if (!d) return '–';
  const t = tageZwischen(heute(), d.slice(0, 10));
  if (t === 0) return 'heute';
  if (t === 1) return 'morgen';
  if (t === -1) return 'gestern';
  if (t > 1 && t <= 6) return `in ${t} Tagen`;
  if (t < -1 && t >= -14) return `vor ${-t} Tagen`;
  return datum(d);
}

// ------------------------------------------------------------------ Positionen & Summen

export function positionSumme(p: Position): Cent {
  if (p.art === 'text' || p.art === 'zwischensumme' || p.optional) return 0;
  return Math.round(p.menge * p.einzelpreis);
}

export interface Summen {
  netto: Cent;
  rabatt: Cent;
  ust: Cent;
  brutto: Cent;
}

export function summen(positionen: Position[], ustSatz = 19, rabattProzent = 0): Summen {
  const roh = positionen.reduce((s, p) => s + positionSumme(p), 0);
  const rabatt = Math.round((roh * rabattProzent) / 100);
  const netto = roh - rabatt;
  const ust = Math.round((netto * ustSatz) / 100);
  return { netto, rabatt, ust, brutto: netto + ust };
}

// ------------------------------------------------------------------ Sonstiges

export const adresseText = (a: Adresse | undefined) => (a ? `${a.strasse}, ${a.plz} ${a.ort}` : '');
export const mapsLink = (a: Adresse | undefined) =>
  a ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresseText(a))}` : undefined;
export const telLink = (t: string | undefined) => (t ? `tel:${t.replace(/[^\d+]/g, '')}` : undefined);

export function personName(m: { vorname: string; nachname: string } | undefined) {
  return m ? `${m.vorname} ${m.nachname}` : '–';
}
export function initialen(m: { vorname: string; nachname: string } | undefined) {
  return m ? `${m.vorname[0] ?? ''}${m.nachname[0] ?? ''}`.toUpperCase() : '?';
}

/** einfache, tolerante Suche: alle Wörter müssen irgendwo vorkommen */
export function passt(q: string, ...felder: (string | undefined | null)[]): boolean {
  const heu = felder.filter(Boolean).join(' ').toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => heu.includes(w));
}
