/**
 * Import-Assistent: Was steht in der Datei? Reine Logik ohne Datenzugriff.
 *
 * 1. Kopfzeile finden (manche Exporte haben Titelzeilen davor)
 * 2. Objektart erkennen (Kunden, Artikel, offene Rechnungen …) – über Spaltennamen, Wertemuster und Dateinamen
 * 3. Spalten zuordnen – erst über Spaltennamen (Synonyme), dann über Wertemuster
 *    („Diese Spalte enthält E-Mail-Adressen“)
 * 4. Werte lesen: Geld deutsch („1.234,56 €“) → Cent, Datum (auch Excel-Zahl) → `YYYY-MM-DD`
 */
import type { Cent, Datum } from '@core/objects';

// ------------------------------------------------------------------ Arten

export type ImportArt = 'kunden' | 'ansprechpartner' | 'mitarbeiter' | 'artikel' | 'leistungen' | 'preise' | 'angebote' | 'auftraege' | 'rechnungen';

/** Wertemuster einer Spalte */
export type Muster = 'email' | 'iban' | 'plz' | 'telefon' | 'datum' | 'geld' | 'rechnungsnummer' | 'zahl' | 'text';

export interface ZielFeld {
  id: string;
  label: string;
  /** normalisierte Spaltennamen, die genau passen */
  synonyme: string[];
  /** normalisierte Anfänge („telefon…“, „email…“) */
  beginnt?: string[];
  /** erwartetes Wertemuster: prüft Werte und erlaubt die Erkennung über den Inhalt */
  muster?: Muster;
  pflicht?: boolean;
  /** starkes Zeichen für diese Art (z. B. „Rechnungsnummer“) */
  kennzeichen?: boolean;
}

export interface ArtDef {
  id: ImportArt;
  /** „Kunden“ */
  label: string;
  /** „Kunde“ */
  einzahl: string;
  /** kurzer Satz für die Auswahl */
  text: string;
  /** Wörter im Dateinamen, die auf diese Art hinweisen */
  dateiname: string[];
  /** braucht das Recht „Preise & Geld“ */
  geld?: boolean;
  /** braucht das Recht „Personaldaten“ */
  personal?: boolean;
  felder: ZielFeld[];
}

const KUNDE_NUMMER: ZielFeld = { id: 'kundeNummer', label: 'Kundennummer', synonyme: ['kundennummer', 'kundennr', 'kdnr', 'debitor', 'debitorennummer', 'debitorennr'], beginnt: ['kundennummer', 'kundennr'] };
const KUNDE_NAME: ZielFeld = { id: 'kundeName', label: 'Kunde', synonyme: ['kunde', 'kundenname', 'name', 'firma', 'auftraggeber', 'rechnungsempfaenger', 'empfaenger', 'kundefirma'], beginnt: ['kundenname', 'kunde'] };
const NETTO: ZielFeld = { id: 'netto', label: 'Betrag netto', synonyme: ['netto', 'nettobetrag', 'summenetto', 'betragnetto', 'nettosumme', 'gesamtnetto'], beginnt: ['netto', 'betragnetto', 'summenetto'], muster: 'geld' };
const BRUTTO: ZielFeld = {
  id: 'brutto',
  label: 'Betrag brutto',
  synonyme: ['brutto', 'bruttobetrag', 'betrag', 'summe', 'gesamt', 'gesamtbetrag', 'betragbrutto', 'summebrutto', 'endbetrag', 'rechnungsbetrag', 'angebotssumme', 'offen', 'offenerbetrag', 'restbetrag', 'betrageur'],
  beginnt: ['brutto', 'betrag', 'summe', 'gesamt', 'offen'],
  muster: 'geld',
};

export const ARTEN: ArtDef[] = [
  {
    id: 'kunden',
    label: 'Kunden',
    einzahl: 'Kunde',
    text: 'Name, Adresse, Telefon, E-Mail',
    dateiname: ['kunde', 'kunden', 'adress', 'kontakt', 'debitor'],
    felder: [
      { id: 'nummer', label: 'Kundennummer', synonyme: ['kundennummer', 'kundennr', 'kdnr', 'nummer', 'nr', 'debitor', 'debitorennummer', 'kontaktnummer'], beginnt: ['kundennummer', 'kundennr'] },
      { id: 'name', label: 'Name', synonyme: ['name', 'kunde', 'kundenname', 'name1', 'anzeigename', 'vollername', 'vollstaendigername'] },
      { id: 'firma', label: 'Firma', synonyme: ['firma', 'firmenname', 'unternehmen', 'company', 'organisation', 'organization', 'firma1'], beginnt: ['firmenname', 'organisation'] },
      { id: 'vorname', label: 'Vorname', synonyme: ['vorname', 'firstname'], beginnt: ['vorname'] },
      { id: 'nachname', label: 'Nachname', synonyme: ['nachname', 'familienname', 'lastname', 'name2'], beginnt: ['nachname'] },
      { id: 'person', label: 'Ansprechpartner', synonyme: ['ansprechpartner', 'kontaktperson', 'kontaktname'] },
      { id: 'telefon', label: 'Telefon', synonyme: ['telefon', 'tel', 'telefonnummer', 'fon', 'phone', 'telefon1'], beginnt: ['telefon', 'tel'], muster: 'telefon' },
      { id: 'mobil', label: 'Handy', synonyme: ['mobil', 'handy', 'mobiltelefon', 'mobilnummer', 'handynummer', 'mobile'], beginnt: ['mobil', 'handy'], muster: 'telefon' },
      { id: 'email', label: 'E-Mail', synonyme: ['email', 'mail', 'emailadresse', 'email1', 'emailaddress'], beginnt: ['email', 'mail'], muster: 'email' },
      { id: 'strasse', label: 'Straße', synonyme: ['strasse', 'str', 'strassehausnummer', 'strassehausnr', 'strasseundhausnummer', 'adresse', 'anschrift', 'street', 'adresszeile1'], beginnt: ['strasse', 'rechnungsstrasse'] },
      { id: 'hausnummer', label: 'Hausnummer', synonyme: ['hausnummer', 'hausnr'] },
      { id: 'plz', label: 'PLZ', synonyme: ['plz', 'postleitzahl', 'zip'], beginnt: ['plz', 'postleitzahl'], muster: 'plz' },
      { id: 'ort', label: 'Ort', synonyme: ['ort', 'stadt', 'wohnort', 'city'], beginnt: ['ortrechnung', 'stadt'] },
      { id: 'iban', label: 'IBAN', synonyme: ['iban', 'bankverbindung', 'kontonummer'], beginnt: ['iban'], muster: 'iban' },
      { id: 'notiz', label: 'Notiz', synonyme: ['notiz', 'bemerkung', 'bemerkungen', 'info', 'hinweis', 'notizen', 'kommentar'] },
    ],
  },
  {
    id: 'ansprechpartner',
    label: 'Ansprechpartner',
    einzahl: 'Ansprechpartner',
    text: 'Personen bei Firmen und Hausverwaltungen',
    dateiname: ['ansprechpartner', 'kontaktperson', 'personen'],
    felder: [
      { ...KUNDE_NUMMER, kennzeichen: false },
      { id: 'kundeName', label: 'Kunde / Firma', synonyme: ['kunde', 'firma', 'kundenname', 'firmenname', 'unternehmen', 'organisation'], beginnt: ['kunde', 'firma'], pflicht: false },
      { id: 'name', label: 'Name', synonyme: ['ansprechpartner', 'name', 'kontaktperson', 'person', 'kontaktname'], kennzeichen: true },
      { id: 'vorname', label: 'Vorname', synonyme: ['vorname', 'firstname'] },
      { id: 'nachname', label: 'Nachname', synonyme: ['nachname', 'familienname', 'lastname'] },
      { id: 'funktion', label: 'Funktion', synonyme: ['funktion', 'position', 'rolle', 'abteilung', 'titel', 'aufgabe'], kennzeichen: true },
      { id: 'telefon', label: 'Telefon', synonyme: ['telefon', 'tel', 'telefonnummer', 'durchwahl', 'mobil', 'handy'], beginnt: ['telefon', 'mobil', 'handy'], muster: 'telefon' },
      { id: 'email', label: 'E-Mail', synonyme: ['email', 'mail', 'emailadresse'], beginnt: ['email'], muster: 'email' },
    ],
  },
  {
    id: 'mitarbeiter',
    label: 'Mitarbeiter',
    einzahl: 'Mitarbeiter',
    text: 'Dein Team mit Rolle und Kontakt',
    dateiname: ['mitarbeiter', 'personal', 'team', 'belegschaft'],
    personal: true,
    felder: [
      { id: 'vorname', label: 'Vorname', synonyme: ['vorname', 'firstname'], pflicht: false },
      { id: 'nachname', label: 'Nachname', synonyme: ['nachname', 'familienname', 'lastname', 'name'] },
      { id: 'rolle', label: 'Rolle', synonyme: ['rolle', 'funktion', 'position', 'taetigkeit', 'beruf', 'stelle'], kennzeichen: true },
      { id: 'telefon', label: 'Handy', synonyme: ['telefon', 'handy', 'mobil', 'tel', 'mobilnummer', 'handynummer'], beginnt: ['telefon', 'handy', 'mobil'], muster: 'telefon' },
      { id: 'email', label: 'E-Mail', synonyme: ['email', 'mail'], beginnt: ['email'], muster: 'email' },
      { id: 'wochenstunden', label: 'Wochenstunden', synonyme: ['wochenstunden', 'stunden', 'stundenprowoche', 'wochenarbeitszeit', 'arbeitszeit', 'sollstunden'], beginnt: ['wochenstunden', 'wochenarbeitszeit'], muster: 'zahl', kennzeichen: true },
      { id: 'urlaubstage', label: 'Urlaubstage', synonyme: ['urlaub', 'urlaubstage', 'urlaubsanspruch', 'urlaubstagejahr'], beginnt: ['urlaub'], muster: 'zahl', kennzeichen: true },
      { id: 'eintritt', label: 'Eintritt', synonyme: ['eintritt', 'eintrittsdatum', 'eingestellt', 'beginn', 'startdatum'], beginnt: ['eintritt'], muster: 'datum', kennzeichen: true },
      { id: 'team', label: 'Team / Kolonne', synonyme: ['team', 'kolonne', 'gruppe', 'abteilung'] },
      { id: 'personalnummer', label: 'Personalnummer', synonyme: ['personalnummer', 'persnr', 'personalnr', 'mitarbeiternummer', 'manr'], kennzeichen: true },
    ],
  },
  {
    id: 'artikel',
    label: 'Artikel',
    einzahl: 'Artikel',
    text: 'Material mit Einkaufs- und Verkaufspreis',
    dateiname: ['artikel', 'material', 'katalog', 'datanorm', 'lager', 'waren'],
    felder: [
      { id: 'nummer', label: 'Artikelnummer', synonyme: ['artikelnummer', 'artnr', 'artikelnr', 'nummer', 'nr', 'materialnummer', 'matnr'], beginnt: ['artikelnummer', 'artikelnr', 'artnr'], kennzeichen: true },
      { id: 'name', label: 'Bezeichnung', synonyme: ['bezeichnung', 'name', 'artikel', 'artikelname', 'artikelbezeichnung', 'kurztext', 'text', 'beschreibung', 'material'], beginnt: ['bezeichnung', 'artikelbezeichnung', 'kurztext'], pflicht: true },
      { id: 'ean', label: 'EAN', synonyme: ['ean', 'gtin', 'barcode', 'eancode'], beginnt: ['ean', 'gtin'], kennzeichen: true },
      { id: 'herstellerNummer', label: 'Hersteller-Nr.', synonyme: ['herstellernummer', 'herstellernr', 'herstellerartikelnummer', 'herst', 'herstnr'], beginnt: ['herstellerartikel', 'herstellernummer', 'herstellernr'] },
      { id: 'einheit', label: 'Einheit', synonyme: ['einheit', 'me', 'mengeneinheit', 'unit', 'eh'] },
      { id: 'ek', label: 'Einkaufspreis', synonyme: ['ek', 'einkauf', 'einkaufspreis', 'ekpreis', 'nettoek', 'eknetto'], beginnt: ['einkaufspreis', 'ek'], muster: 'geld', kennzeichen: true },
      { id: 'vk', label: 'Verkaufspreis', synonyme: ['vk', 'verkauf', 'verkaufspreis', 'vkpreis', 'listenpreis', 'preis', 'vknetto'], beginnt: ['verkaufspreis', 'listenpreis', 'vk'], muster: 'geld' },
      { id: 'kategorie', label: 'Kategorie', synonyme: ['kategorie', 'warengruppe', 'gruppe', 'wg', 'artikelgruppe'], beginnt: ['warengruppe', 'kategorie'] },
      { id: 'mindestbestand', label: 'Mindestbestand', synonyme: ['mindestbestand', 'minbestand', 'meldebestand'], beginnt: ['mindest', 'meldebestand'], muster: 'zahl' },
    ],
  },
  {
    id: 'leistungen',
    label: 'Leistungen',
    einzahl: 'Leistung',
    text: 'Deine Leistungen mit Preis und Zeit',
    dateiname: ['leistung', 'leistungen', 'leistungskatalog', 'lv', 'stundensatz'],
    geld: true,
    felder: [
      { id: 'name', label: 'Leistung', synonyme: ['leistung', 'leistungsname', 'bezeichnung', 'name', 'kurztext', 'position', 'taetigkeit'], beginnt: ['leistung', 'bezeichnung'], pflicht: true, kennzeichen: true },
      { id: 'beschreibung', label: 'Beschreibung', synonyme: ['beschreibung', 'langtext', 'text', 'details'] },
      { id: 'einheit', label: 'Einheit', synonyme: ['einheit', 'me', 'mengeneinheit', 'eh'] },
      { id: 'preis', label: 'Preis netto', synonyme: ['preis', 'vk', 'verkaufspreis', 'einheitspreis', 'ep', 'nettopreis', 'preisnetto', 'satz'], beginnt: ['preis', 'einheitspreis', 'verkaufspreis'], muster: 'geld' },
      { id: 'minuten', label: 'Zeit in Minuten', synonyme: ['minuten', 'zeit', 'dauer', 'zeitwert', 'arbeitszeit', 'min', 'zeitmin'], beginnt: ['minuten', 'zeit', 'dauer'], muster: 'zahl', kennzeichen: true },
      { id: 'kategorie', label: 'Kategorie', synonyme: ['kategorie', 'gruppe', 'gewerk', 'bereich', 'titel'] },
    ],
  },
  {
    id: 'preise',
    label: 'Preise',
    einzahl: 'Preis',
    text: 'Neue Preise für vorhandene Leistungen und Artikel',
    dateiname: ['preis', 'preise', 'preisliste', 'preisaenderung', 'konditionen'],
    geld: true,
    felder: [
      { id: 'nummer', label: 'Artikelnummer', synonyme: ['artikelnummer', 'artnr', 'artikelnr', 'nummer', 'nr', 'ean'], beginnt: ['artikelnummer', 'artikelnr'] },
      { id: 'name', label: 'Bezeichnung', synonyme: ['bezeichnung', 'name', 'leistung', 'artikel', 'kurztext'], beginnt: ['bezeichnung'] },
      { id: 'preis', label: 'Neuer Preis netto', synonyme: ['neuerpreis', 'preisneu', 'preis', 'vk', 'verkaufspreis', 'listenpreis', 'nettopreis'], beginnt: ['neuerpreis', 'preisneu', 'preis'], muster: 'geld', pflicht: true, kennzeichen: true },
      { id: 'ek', label: 'Neuer Einkaufspreis', synonyme: ['ek', 'einkaufspreis', 'ekneu', 'neuerek'], beginnt: ['einkaufspreis'], muster: 'geld' },
    ],
  },
  {
    id: 'angebote',
    label: 'Offene Angebote',
    einzahl: 'Angebot',
    text: 'Angebote, die noch nicht entschieden sind',
    dateiname: ['angebot', 'angebote', 'kostenvoranschlag', 'kva'],
    geld: true,
    felder: [
      { id: 'nummer', label: 'Angebotsnummer', synonyme: ['angebotsnummer', 'angebotsnr', 'angebot', 'angnr', 'belegnummer', 'nummer', 'nr', 'kvanr'], beginnt: ['angebotsnummer', 'angebotsnr', 'angebot'], kennzeichen: true },
      KUNDE_NUMMER,
      KUNDE_NAME,
      { id: 'titel', label: 'Betreff', synonyme: ['betreff', 'titel', 'bezeichnung', 'projekt', 'bauvorhaben', 'beschreibung', 'leistung', 'gegenstand'] },
      { id: 'datum', label: 'Angebotsdatum', synonyme: ['datum', 'angebotsdatum', 'belegdatum', 'erstellt', 'erstelltam'], beginnt: ['angebotsdatum', 'datum'], muster: 'datum' },
      { id: 'gueltigBis', label: 'Gültig bis', synonyme: ['gueltigbis', 'gueltig', 'bindefrist', 'ablauf', 'ablaufdatum'], beginnt: ['gueltig', 'bindefrist'], muster: 'datum', kennzeichen: true },
      NETTO,
      BRUTTO,
    ],
  },
  {
    id: 'auftraege',
    label: 'Offene Aufträge',
    einzahl: 'Auftrag',
    text: 'Laufende Aufträge und Baustellen',
    dateiname: ['auftrag', 'auftraege', 'projekt', 'projekte', 'baustelle', 'baustellen'],
    felder: [
      { id: 'nummer', label: 'Auftragsnummer', synonyme: ['auftragsnummer', 'auftragsnr', 'auftrag', 'projektnummer', 'projektnr', 'nummer', 'nr', 'bvnr'], beginnt: ['auftragsnummer', 'auftragsnr', 'projektnummer', 'projektnr'], kennzeichen: true },
      KUNDE_NUMMER,
      KUNDE_NAME,
      { id: 'titel', label: 'Bezeichnung', synonyme: ['bezeichnung', 'titel', 'projekt', 'bauvorhaben', 'betreff', 'baustelle', 'auftragsbezeichnung'], beginnt: ['bezeichnung', 'bauvorhaben', 'projekt'], pflicht: true },
      { id: 'beschreibung', label: 'Beschreibung', synonyme: ['beschreibung', 'notiz', 'bemerkung', 'details', 'leistung'] },
      { id: 'status', label: 'Stand', synonyme: ['status', 'stand', 'phase', 'zustand'], kennzeichen: true },
      { id: 'wunschtermin', label: 'Termin', synonyme: ['termin', 'wunschtermin', 'ausfuehrung', 'zeitraum', 'start', 'beginn', 'liefertermin'], beginnt: ['termin', 'ausfuehrung'] },
    ],
  },
  {
    id: 'rechnungen',
    label: 'Offene Rechnungen',
    einzahl: 'Rechnung',
    text: 'Rechnungen, die noch nicht bezahlt sind',
    dateiname: ['rechnung', 'rechnungen', 'offeneposten', 'op', 'oplist', 'debitorenliste', 'forderungen'],
    geld: true,
    felder: [
      { id: 'nummer', label: 'Rechnungsnummer', synonyme: ['rechnungsnummer', 'rechnungsnr', 'rechnung', 'renr', 'rgnr', 'belegnummer', 'belegnr', 'beleg', 'nummer', 'nr'], beginnt: ['rechnungsnummer', 'rechnungsnr'], muster: 'rechnungsnummer', pflicht: false, kennzeichen: true },
      KUNDE_NUMMER,
      KUNDE_NAME,
      { id: 'titel', label: 'Betreff', synonyme: ['betreff', 'titel', 'bezeichnung', 'projekt', 'bauvorhaben', 'leistung', 'text', 'buchungstext'] },
      { id: 'datum', label: 'Rechnungsdatum', synonyme: ['datum', 'rechnungsdatum', 'belegdatum', 'redatum'], beginnt: ['rechnungsdatum', 'datum', 'belegdatum'], muster: 'datum' },
      { id: 'faelligAm', label: 'Fällig am', synonyme: ['faellig', 'faelligam', 'faelligkeit', 'faelligkeitsdatum', 'zahlbarbis', 'zahlungsziel'], beginnt: ['faellig', 'zahlbar'], muster: 'datum', kennzeichen: true },
      { id: 'auftragNummer', label: 'Auftragsnummer', synonyme: ['auftragsnummer', 'auftragsnr', 'auftrag', 'projektnummer', 'projektnr'] },
      NETTO,
      BRUTTO,
    ],
  },
];

export const artDef = (art: ImportArt) => ARTEN.find((a) => a.id === art)!;

// ------------------------------------------------------------------ Normalisieren

/** Spaltenname vergleichbar machen: „Telefon (geschäftlich)“ → „telefongeschaeftlich“ */
export function normKopf(t: string | undefined): string {
  return (t ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
}

// ------------------------------------------------------------------ Werte lesen

/** Geldbetrag deutsch oder aus Excel: „1.234,56 €“, „1234,5“, „1234.56“, „EUR 99“ → Cent. Ungültig → undefined */
export function geldAus(eingabe: string | number | undefined): Cent | undefined {
  if (eingabe == null) return undefined;
  if (typeof eingabe === 'number') return Number.isFinite(eingabe) ? Math.round(eingabe * 100) : undefined;
  let t = eingabe.trim().replace(/€|eur(o)?/gi, '').replace(/[\s ']/g, '');
  if (!t) return undefined;
  let minus = false;
  if (/^\(.*\)$/.test(t) || t.endsWith('-')) {
    minus = true;
    t = t.replace(/[()]/g, '').replace(/-$/, '');
  }
  if (t.startsWith('-')) {
    minus = !minus;
    t = t.slice(1);
  }
  if (!/^[\d.,]+$/.test(t)) return undefined;
  if (t.includes(',')) {
    // deutsch: Punkt = Tausender, Komma = Dezimal
    if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+(,\d+)?$/.test(t)) return undefined;
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    // „1.234“ → Tausenderpunkt
    t = t.replace(/\./g, '');
  } else if ((t.match(/\./g) ?? []).length > 1) return undefined;
  const n = Number(t);
  if (!Number.isFinite(n)) return undefined;
  return Math.round((minus ? -n : n) * 100);
}

/** Zahl (Stunden, Minuten, Bestand): deutsch oder mit Punkt */
export function zahlLesen(eingabe: string | undefined): number | undefined {
  const c = geldAus(eingabe);
  return c == null ? undefined : c / 100;
}

function gueltigesDatum(j: number, m: number, t: number): Datum | undefined {
  if (m < 1 || m > 12 || t < 1 || t > 31 || j < 1900 || j > 2200) return undefined;
  const d = new Date(Date.UTC(j, m - 1, t));
  if (d.getUTCMonth() !== m - 1 || d.getUTCDate() !== t) return undefined;
  return `${j}-${String(m).padStart(2, '0')}-${String(t).padStart(2, '0')}`;
}

/** Datum: „14.03.2026“, „1.3.26“, „2026-03-14“, „14/03/2026“ oder Excel-Seriennummer (45730) → `YYYY-MM-DD` */
export function datumAus(eingabe: string | undefined): Datum | undefined {
  const t = (eingabe ?? '').trim();
  if (!t) return undefined;
  let m = /^(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})(?:\s.*)?$/.exec(t);
  if (m) {
    const j = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return gueltigesDatum(j, Number(m[2]), Number(m[1]));
  }
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(t);
  if (m) return gueltigesDatum(Number(m[1]), Number(m[2]), Number(m[3]));
  // Excel speichert Daten als Tage seit dem 30.12.1899 (Bruchteil = Uhrzeit)
  if (/^\d{5}(\.\d+)?$/.test(t)) {
    const n = Math.floor(Number(t));
    if (n < 20000 || n > 80000) return undefined;
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86_400_000);
    return d.toISOString().slice(0, 10);
  }
  return undefined;
}

/** IBAN mit Prüfsumme (Modulo 97) */
export function ibanGueltig(eingabe: string | undefined): boolean {
  const t = (eingabe ?? '').replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(t)) return false;
  if (t.startsWith('DE') && t.length !== 22) return false;
  const umgestellt = t.slice(4) + t.slice(0, 4);
  let rest = 0;
  for (const c of umgestellt) {
    const wert = c >= 'A' && c <= 'Z' ? String(c.charCodeAt(0) - 55) : c;
    for (const z of wert) rest = (rest * 10 + Number(z)) % 97;
  }
  return rest === 1;
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_TELEFON = /^(\+|00|0)[\d\s/()\-.]{5,}$/;
const RE_RECHNUNGSNUMMER = /^(re|r|rg|rn|rech|inv|ar)[\s\-_/.]?\d[\d\-_/.]*$/i;
const RE_BELEGNUMMER = /^[a-z]{1,4}[-_/]\d{2,4}[-_/]\d{1,6}$/i;

/** Welches Muster hat ein einzelner Wert? */
export function musterVon(wert: string): Muster {
  const t = wert.trim();
  if (RE_EMAIL.test(t)) return 'email';
  if (ibanGueltig(t)) return 'iban';
  if (/^\d{5}$/.test(t)) return 'plz';
  if (RE_RECHNUNGSNUMMER.test(t) || RE_BELEGNUMMER.test(t)) return 'rechnungsnummer';
  if (datumAus(t) && !/^\d+$/.test(t)) return 'datum';
  if (RE_TELEFON.test(t) && t.replace(/\D/g, '').length >= 6 && !/^0[.,]\d/.test(t)) return 'telefon';
  if (/€|eur\b/i.test(t) && geldAus(t) != null) return 'geld';
  if (/^-?\d{1,3}(\.\d{3})*,\d{2}$|^-?\d+,\d{2}$/.test(t)) return 'geld';
  if (/^-?\d+([.,]\d+)?$/.test(t)) return 'zahl';
  return 'text';
}

/** Vorherrschendes Muster einer Spalte (mindestens 70 % der gefüllten Werte, bei E-Mail/IBAN/Rechnungsnummer die Hälfte) */
export function spaltenMuster(werte: string[]): Muster | undefined {
  const gefuellt = werte.map((w) => (w ?? '').trim()).filter(Boolean).slice(0, 50);
  if (!gefuellt.length) return undefined;
  const zaehler = new Map<Muster, number>();
  for (const w of gefuellt) {
    const m = musterVon(w);
    zaehler.set(m, (zaehler.get(m) ?? 0) + 1);
  }
  // „geld“ umfasst auch ganze Zahlen in einer Geldspalte
  const geld = (zaehler.get('geld') ?? 0) + (zaehler.get('geld') ? zaehler.get('zahl') ?? 0 : 0);
  if (zaehler.get('geld') && geld / gefuellt.length >= 0.7) return 'geld';
  const [bestes, anzahl] = [...zaehler.entries()].sort((a, b) => b[1] - a[1])[0];
  // eindeutige Muster reichen ab der Hälfte – sonst fällt eine E-Mail-Spalte mit Tippfehlern durch
  const schwelle = (['email', 'iban', 'rechnungsnummer'] as Muster[]).includes(bestes) ? 0.5 : 0.7;
  return anzahl / gefuellt.length >= schwelle ? bestes : undefined;
}

export const MUSTER_SATZ: Record<Muster, string> = {
  email: 'Diese Spalte enthält E-Mail-Adressen',
  iban: 'Diese Spalte enthält IBANs',
  plz: 'Diese Spalte enthält Postleitzahlen',
  telefon: 'Diese Spalte enthält Telefonnummern',
  datum: 'Diese Spalte enthält Datumsangaben',
  geld: 'Diese Spalte enthält Geldbeträge',
  rechnungsnummer: 'Diese Spalte enthält Rechnungsnummern',
  zahl: 'Diese Spalte enthält Zahlen',
  text: 'Diese Spalte enthält Text',
};

// ------------------------------------------------------------------ Tabelle

export interface Tabelle {
  kopf: string[];
  /** Datenzeilen (ohne Kopf, ohne leere Zeilen) */
  zeilen: string[][];
  /** Zeilennummer in der Datei (1-basiert) je Datenzeile – für Fehlermeldungen */
  zeilenNr: number[];
}

/** Kopfzeile finden: die erste Zeile (unter den ersten zehn), die mindestens halb so viele Felder hat wie die breiteste */
export function tabelleAus(roh: string[][]): Tabelle | undefined {
  const gefuellt = (z: string[]) => z.filter((f) => (f ?? '').trim()).length;
  const breite = Math.max(0, ...roh.slice(0, 30).map(gefuellt));
  if (!breite) return undefined;
  const kopfIdx = roh.slice(0, 10).findIndex((z) => gefuellt(z) >= Math.max(1, Math.ceil(breite / 2)) && z.some((f) => /[a-zA-ZäöüÄÖÜ]/.test(f ?? '')));
  if (kopfIdx < 0) return undefined;
  const kopf = roh[kopfIdx].map((f) => (f ?? '').trim());
  const zeilen: string[][] = [];
  const zeilenNr: number[] = [];
  roh.slice(kopfIdx + 1).forEach((z, i) => {
    if (!gefuellt(z)) return;
    zeilen.push(kopf.map((_, s) => (z[s] ?? '').trim()));
    zeilenNr.push(kopfIdx + i + 2);
  });
  return { kopf, zeilen, zeilenNr };
}

// ------------------------------------------------------------------ Zuordnung

export interface SpaltenVorschlag {
  spalte: number;
  kopf: string;
  /** Feld-ID der Zielart; leer = wird nicht übernommen */
  feld?: string;
  grund: 'name' | 'werte' | 'keine';
  muster?: Muster;
  /** erster gefüllter Wert als Beispiel */
  beispiel?: string;
  /** verständlicher Satz, z. B. „Diese Spalte sieht nach Kundennummer aus“ */
  satz: string;
}

export type Zuordnung = Record<number, string | undefined>;

function passtName(f: ZielFeld, k: string, runde: 'exakt' | 'beginnt'): boolean {
  if (!k) return false;
  return runde === 'exakt' ? f.synonyme.includes(k) : (f.beginnt ?? []).some((b) => k.startsWith(b));
}

/** Spalten einer Art zuordnen: erst über Namen (exakt, dann Anfang), dann über Wertemuster */
export function zuordnungVorschlagen(art: ImportArt, t: Tabelle): SpaltenVorschlag[] {
  const def = artDef(art);
  const kopfNorm = t.kopf.map(normKopf);
  const muster = t.kopf.map((_, i) => spaltenMuster(t.zeilen.map((z) => z[i])));
  const feldVon = new Map<number, { feld: string; grund: 'name' | 'werte' }>();
  const vergeben = new Set<string>();
  for (const runde of ['exakt', 'beginnt'] as const) {
    for (const f of def.felder) {
      if (vergeben.has(f.id)) continue;
      const i = kopfNorm.findIndex((k, idx) => !feldVon.has(idx) && passtName(f, k, runde) && inhaltPasst(f.muster, muster[idx]));
      if (i >= 0) {
        feldVon.set(i, { feld: f.id, grund: 'name' });
        vergeben.add(f.id);
      }
    }
  }
  // übrige Spalten über den Inhalt
  t.kopf.forEach((_, i) => {
    if (feldVon.has(i) || !muster[i]) return;
    const f = def.felder.find((x) => !vergeben.has(x.id) && x.muster && x.muster === muster[i]);
    if (f) {
      feldVon.set(i, { feld: f.id, grund: 'werte' });
      vergeben.add(f.id);
    }
  });
  return t.kopf.map((kopf, i) => {
    const z = feldVon.get(i);
    const label = z ? def.felder.find((f) => f.id === z.feld)!.label : undefined;
    const beispiel = t.zeilen.map((r) => r[i]).find((w) => w);
    let satz: string;
    if (z?.grund === 'name') satz = `Diese Spalte sieht nach ${label} aus`;
    else if (z?.grund === 'werte') satz = `${MUSTER_SATZ[muster[i]!]} – passt zu ${label}`;
    else if (!beispiel) satz = 'Diese Spalte ist leer und wird nicht übernommen';
    else satz = 'Macher weiß nicht, wohin diese Spalte gehört – sie wird nicht übernommen';
    return { spalte: i, kopf: kopf || `Spalte ${i + 1}`, feld: z?.feld, grund: z?.grund ?? 'keine', muster: muster[i], beispiel, satz };
  });
}

/** Eindeutige Inhalte gehören nur in Felder mit genau diesem Muster („Nr“ voller E-Mails ist keine Nummer) */
const EINDEUTIG: Muster[] = ['email', 'iban'];

function inhaltPasst(erwartet: Muster | undefined, gefunden: Muster | undefined): boolean {
  if (!gefunden) return true;
  if (!erwartet) return !EINDEUTIG.includes(gefunden);
  return musterVertraeglich(erwartet, gefunden);
}

/** Spaltenname passt, aber Inhalt widerspricht klar (z. B. „Nr“ voller E-Mails)? */
function musterVertraeglich(erwartet: Muster, gefunden: Muster): boolean {
  if (erwartet === gefunden) return true;
  const zahlenartig: Muster[] = ['zahl', 'geld', 'plz'];
  if (zahlenartig.includes(erwartet) && zahlenartig.includes(gefunden)) return true;
  if (erwartet === 'datum' && (gefunden === 'zahl' || gefunden === 'plz')) return true; // Excel-Datum (Seriennummer)
  if (erwartet === 'rechnungsnummer' && (gefunden === 'zahl' || gefunden === 'text' || gefunden === 'plz')) return true;
  if (erwartet === 'telefon' && (gefunden === 'zahl' || gefunden === 'text')) return true;
  if (gefunden === 'text') return erwartet !== 'email' && erwartet !== 'iban';
  return false;
}

export const zuordnungAus = (v: SpaltenVorschlag[]): Zuordnung => Object.fromEntries(v.map((s) => [s.spalte, s.feld]));

// ------------------------------------------------------------------ Art erkennen

export interface ArtTreffer {
  art: ImportArt;
  punkte: number;
}

/**
 * Welche Art steckt in der Datei? Punkte je Art: zugeordnete Spalten (Kennzeichen zählen mehr), Pflichtfelder,
 * Wertemuster (Rechnungsnummern, Geld) und der Dateiname („Kundenliste.xlsx“).
 */
export function artErkennen(t: Tabelle, dateiname = ''): ArtTreffer[] {
  const datei = normKopf(dateiname.replace(/\.[a-z0-9]+$/i, ''));
  const kopfNorm = t.kopf.map(normKopf);
  const treffer = ARTEN.map((def) => {
    const v = zuordnungVorschlagen(def.id, t);
    let punkte = 0;
    for (const s of v) {
      if (!s.feld) continue;
      const f = def.felder.find((x) => x.id === s.feld)!;
      punkte += (f.kennzeichen ? 4 : 1) * (s.grund === 'name' ? 1 : 0.5);
      if (f.pflicht) punkte += 1;
    }
    // genaue Kennzeichen-Spaltennamen sind fast eindeutig
    for (const f of def.felder.filter((x) => x.kennzeichen)) if (kopfNorm.some((k) => f.synonyme.slice(0, 3).includes(k))) punkte += 3;
    if (def.dateiname.some((w) => datei.includes(w))) punkte += 6;
    // fehlt ein Pflichtfeld ganz, passt die Art kaum
    if (def.felder.some((f) => f.pflicht && !v.some((s) => s.feld === f.id))) punkte -= 4;
    return { art: def.id, punkte };
  });
  // Feinheiten, die Spaltennamen allein nicht trennen
  const hat = (...namen: string[]) => kopfNorm.some((k) => namen.some((n) => k.startsWith(n)));
  const plus = (art: ImportArt, p: number) => (treffer.find((x) => x.art === art)!.punkte += p);
  if (hat('rechnungsnummer', 'rechnungsnr', 'rechnungsdatum', 'faellig')) plus('rechnungen', 6);
  if (hat('angebotsnummer', 'angebotsnr', 'angebotsdatum', 'gueltigbis', 'bindefrist')) plus('angebote', 6);
  if (hat('auftragsnummer', 'auftragsnr', 'projektnummer', 'bauvorhaben') && !hat('rechnungs', 'angebots')) plus('auftraege', 4);
  if (hat('ansprechpartner', 'funktion') && hat('kunde', 'firma') && !hat('strasse', 'plz')) plus('ansprechpartner', 4);
  if (hat('ek', 'einkaufspreis', 'ean', 'artikelnummer', 'artnr')) plus('artikel', 3);
  if (hat('neuerpreis', 'preisneu')) plus('preise', 8);
  if (hat('strasse', 'plz', 'ort') && !hat('rechnungsnummer', 'angebotsnummer', 'auftragsnummer')) plus('kunden', 3);
  const nummerSpalte = t.kopf.findIndex((_, i) => spaltenMuster(t.zeilen.map((z) => z[i])) === 'rechnungsnummer');
  if (nummerSpalte >= 0 && /^r/i.test(t.zeilen.find((z) => z[nummerSpalte])?.[nummerSpalte] ?? '')) plus('rechnungen', 3);
  return treffer.sort((a, b) => b.punkte - a.punkte);
}
