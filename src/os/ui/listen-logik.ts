/**
 * Reine Hilfen für Arbeitslisten (Aufträge, Angebote, Rechnungen) – ohne Datenzugriff, damit testbar.
 *
 * - „Zuletzt bearbeitet“ aus dem vorhandenen Verlauf (`ereignisse`, Audit) – kein eigenes Feld.
 * - Kurze Adresse („Straße, Ort“) für die Zeile unter dem Auftragstitel.
 * - Finanzmuster für Angebots- und Rechnungsliste: Brutto/Netto, Zeitraum, Auftrag.
 */
import type { Adresse, AuditQuelle, Cent, Datum, Ereignis, ID } from '@core/objects';

// ------------------------------------------------------------------ Zuletzt bearbeitet

export interface LetzteBearbeitung {
  /** ISO-Zeitpunkt der letzten Änderung */
  zeit: string;
  mitarbeiterId?: ID;
  quelle?: AuditQuelle;
}

/**
 * Letzte Bearbeitung je Objekt einer Sammlung aus dem Verlauf. Zählt nur protokollierte Datenänderungen
 * (`aenderung`); Einträge vom Abgleich zählen nicht, weil sie keine Bearbeitung auf diesem Gerät sind
 * und sonst jede Synchronisierung als „bearbeitet“ erschiene.
 */
export function letzteBearbeitungen(ereignisse: readonly Ereignis[], typ: string): Map<ID, LetzteBearbeitung> {
  const m = new Map<ID, LetzteBearbeitung>();
  for (const e of ereignisse) {
    if (e.bezug?.typ !== typ || !e.aenderung || e.geloeschtAm || e.quelle === 'sync') continue;
    const zeit = e.geaendertAm || e.erstelltAm;
    const bisher = m.get(e.bezug.id);
    if (bisher && bisher.zeit >= zeit) continue;
    m.set(e.bezug.id, { zeit, mitarbeiterId: e.vonMitarbeiterId, quelle: e.quelle });
  }
  return m;
}

/** Wer hat es getan? Name des Menschen, sonst „Lotte“ (Automation/KI) bzw. „Import“. */
export function bearbeiterName(b: LetzteBearbeitung, vorname: string | undefined): string | undefined {
  if (vorname) return vorname;
  if (b.quelle === 'automation' || b.quelle === 'ai') return 'Lotte';
  if (b.quelle === 'import') return 'Import';
  return undefined;
}

const zwei = (n: number) => String(n).padStart(2, '0');
const tagSchluessel = (d: Date) => `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`;

/** „Heute 14:32“, „Gestern 09:05“, „12.09.“ bzw. „12.09.2025“ (anderes Jahr) – lokale Zeit */
export function zeitpunktKurz(iso: string, jetzt: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const uhr = `${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
  const gestern = new Date(jetzt);
  gestern.setDate(gestern.getDate() - 1);
  if (tagSchluessel(d) === tagSchluessel(jetzt)) return `Heute ${uhr}`;
  if (tagSchluessel(d) === tagSchluessel(gestern)) return `Gestern ${uhr}`;
  const tag = `${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.`;
  return d.getFullYear() === jetzt.getFullYear() ? tag : `${tag}${d.getFullYear()}`;
}

/** „Heute 14:32 · Anna“ (ohne Namen nur die Zeit) */
export function zuletztText(b: LetzteBearbeitung, name: string | undefined, jetzt: Date = new Date()): string {
  const zeit = zeitpunktKurz(b.zeit, jetzt);
  return name ? `${zeit} · ${name}` : zeit;
}

// ------------------------------------------------------------------ Adresse

/** Kurz für Listen: „Lindenweg 4, Köln“ – nur was vorhanden ist */
export function adresseKurz(a: Partial<Adresse> | undefined): string {
  if (!a) return '';
  return [a.strasse?.trim(), a.ort?.trim()].filter(Boolean).join(', ');
}

/** Einsatzort des Auftrags, sonst die Adresse des Kunden */
export function auftragsAdresse(ort: Partial<Adresse> | undefined, kunde: Partial<Adresse> | undefined): string {
  return adresseKurz(ort) || adresseKurz(kunde);
}

// ------------------------------------------------------------------ Finanzmuster

export type Betragsart = 'brutto' | 'netto';
export type Zeitraum = 'alle' | 'monat' | 'vormonat' | 'quartal' | 'jahr' | 'vorjahr';

export const BETRAGSARTEN: { wert: Betragsart; label: string }[] = [
  { wert: 'brutto', label: 'Brutto' },
  { wert: 'netto', label: 'Netto' },
];

export const ZEITRAEUME: { wert: Zeitraum; label: string }[] = [
  { wert: 'alle', label: 'Gesamter Zeitraum' },
  { wert: 'monat', label: 'Dieser Monat' },
  { wert: 'vormonat', label: 'Letzter Monat' },
  { wert: 'quartal', label: 'Dieses Quartal' },
  { wert: 'jahr', label: 'Dieses Jahr' },
  { wert: 'vorjahr', label: 'Letztes Jahr' },
];

export const gueltigeBetragsart = (w: unknown): Betragsart => (w === 'netto' ? 'netto' : 'brutto');
export const gueltigerZeitraum = (w: unknown): Zeitraum => (ZEITRAEUME.some((z) => z.wert === w) ? (w as Zeitraum) : 'alle');

/** Einstellungsschlüssel je Nutzer („liste.betragsart.m_anna“); ohne Anmeldung gemeinsam */
export const nutzerSchluessel = (basis: string, mitarbeiterId: ID | undefined) => (mitarbeiterId ? `${basis}.${mitarbeiterId}` : basis);

const letzterTag = (jahr: number, monat0: number) => new Date(Date.UTC(jahr, monat0 + 1, 0)).getUTCDate();
const iso = (jahr: number, monat0: number, tag: number) => `${jahr}-${zwei(monat0 + 1)}-${zwei(tag)}`;

/** Erster und letzter Tag (einschließlich) eines Zeitraums relativ zu `tag`; `undefined` = kein Filter */
export function zeitraumGrenzen(z: Zeitraum, tag: Datum): { von: Datum; bis: Datum } | undefined {
  const jahr = Number(tag.slice(0, 4));
  const monat = Number(tag.slice(5, 7)) - 1;
  switch (z) {
    case 'monat':
      return { von: iso(jahr, monat, 1), bis: iso(jahr, monat, letzterTag(jahr, monat)) };
    case 'vormonat': {
      const j = monat === 0 ? jahr - 1 : jahr;
      const m = monat === 0 ? 11 : monat - 1;
      return { von: iso(j, m, 1), bis: iso(j, m, letzterTag(j, m)) };
    }
    case 'quartal': {
      const start = Math.floor(monat / 3) * 3;
      return { von: iso(jahr, start, 1), bis: iso(jahr, start + 2, letzterTag(jahr, start + 2)) };
    }
    case 'jahr':
      return { von: `${jahr}-01-01`, bis: `${jahr}-12-31` };
    case 'vorjahr':
      return { von: `${jahr - 1}-01-01`, bis: `${jahr - 1}-12-31` };
    default:
      return undefined;
  }
}

export function imZeitraum(datum: Datum | undefined, z: Zeitraum, tag: Datum): boolean {
  const g = zeitraumGrenzen(z, tag);
  if (!g) return true;
  if (!datum) return false;
  const d = datum.slice(0, 10);
  return d >= g.von && d <= g.bis;
}

/** Der Betrag in der gewählten Art */
export const betragNach = (art: Betragsart, b: { netto: Cent; brutto: Cent }): Cent => (art === 'netto' ? b.netto : b.brutto);

/** Summe einer Liste in der gewählten Art */
export const summeNach = (art: Betragsart, liste: readonly { netto: Cent; brutto: Cent }[]): Cent => liste.reduce((s, b) => s + betragNach(art, b), 0);

/** Filter für Zeitraum und Auftrag (Status bleibt Sache der jeweiligen Liste) */
/** Auftragsfilter „Ohne Auftrag“ (z. B. Rechnungen ohne Auftragsbezug) */
export const OHNE_AUFTRAG = 'ohne';

export function passtFinanzFilter(o: { datum?: Datum; auftragId?: ID }, f: { zeitraum: Zeitraum; auftragId?: ID }, tag: Datum): boolean {
  if (!imZeitraum(o.datum, f.zeitraum, tag)) return false;
  if (!f.auftragId) return true;
  return f.auftragId === OHNE_AUFTRAG ? !o.auftragId : o.auftragId === f.auftragId;
}
