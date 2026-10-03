/**
 * DATEV-Export: Buchungsstapel im DATEV-Format (EXTF, Version 700, Formatkategorie 21).
 *
 * - Ausgangsrechnungen: Debitor an Erlöskonto (Automatikkonto mit Umsatzsteuer)
 * - Belege: Aufwandskonto an Kreditor bzw. Kasse; Vorsteuer über Automatikkonto oder BU-Schlüssel
 * - SKR03 und SKR04 mit gängigen Standardkonten
 * - Semikolon, Texte in Anführungszeichen, Beträge mit Komma, Zeilenende CRLF,
 *   nur Zeichen, die in Windows-1252 darstellbar sind (Datei wird in Windows-1252 kodiert)
 *
 * Reine Funktionen – die Oberfläche schreibt danach `exportiertAm` an die Belege.
 */
import { summen } from '@core/format';
import type { Beleg, Cent, Datum, ID, Kunde, Lieferant, Rechnung } from '@core/objects';
import { rechnungBrutto, rechnungNetto } from '../ertrag/daten';

export type Kontenrahmen = 'SKR03' | 'SKR04';

export const DEBITOR_START = 10000;
export const KREDITOR_START = 70000;

/** Aufwandskategorien für Belege – Kategorie-Text → Kontenart */
export type Aufwand = 'material' | 'fremdleistung' | 'fahrzeug' | 'werkzeug' | 'buero' | 'telefon' | 'miete' | 'werbung' | 'reise' | 'sonstiges';

interface KontenSatz {
  erloese19: number;
  erloese7: number;
  erloeseKlein: number;
  /** Wareneingang mit Vorsteuer-Automatik */
  material19: number;
  material7: number;
  material0: number;
  kasse: number;
  aufwand: Record<Exclude<Aufwand, 'material'>, number>;
}

export const KONTEN: Record<Kontenrahmen, KontenSatz> = {
  SKR03: {
    erloese19: 8400,
    erloese7: 8300,
    erloeseKlein: 8195,
    material19: 3400,
    material7: 3300,
    material0: 3200,
    kasse: 1000,
    aufwand: {
      fremdleistung: 3100,
      fahrzeug: 4530,
      werkzeug: 4985,
      buero: 4930,
      telefon: 4920,
      miete: 4210,
      werbung: 4600,
      reise: 4660,
      sonstiges: 4900,
    },
  },
  SKR04: {
    erloese19: 4400,
    erloese7: 4300,
    erloeseKlein: 4185,
    material19: 5400,
    material7: 5300,
    material0: 5200,
    kasse: 1600,
    aufwand: {
      fremdleistung: 5900,
      fahrzeug: 6530,
      werkzeug: 6845,
      buero: 6815,
      telefon: 6805,
      miete: 6310,
      werbung: 6600,
      reise: 6650,
      sonstiges: 6300,
    },
  },
};

export const AUFWAND_LABEL: Record<Aufwand, string> = {
  material: 'Material / Wareneingang',
  fremdleistung: 'Fremdleistungen',
  fahrzeug: 'Fahrzeugkosten',
  werkzeug: 'Werkzeuge & Kleingeräte',
  buero: 'Bürobedarf',
  telefon: 'Telefon & Internet',
  miete: 'Miete',
  werbung: 'Werbung',
  reise: 'Reisekosten',
  sonstiges: 'Sonstige Kosten',
};

/** Belegkategorie (Freitext) → Aufwandsart */
export function aufwandAus(beleg: Pick<Beleg, 'kategorie' | 'art'>): Aufwand {
  if (beleg.art === 'tankbeleg') return 'fahrzeug';
  const k = (beleg.kategorie ?? '').toLowerCase();
  if (/material|ware|großhandel|grosshandel/.test(k)) return 'material';
  if (/fremd|sub/.test(k)) return 'fremdleistung';
  if (/fahrzeug|kfz|tank|sprit|auto|werkstatt/.test(k)) return 'fahrzeug';
  if (/werkzeug|gerät|geraet|maschine/.test(k)) return 'werkzeug';
  if (/büro|buero|porto|papier/.test(k)) return 'buero';
  if (/telefon|handy|internet|mobil/.test(k)) return 'telefon';
  if (/miete|pacht|halle/.test(k)) return 'miete';
  if (/werbung|marketing|anzeige/.test(k)) return 'werbung';
  if (/reise|hotel|übernacht|uebernacht/.test(k)) return 'reise';
  return 'sonstiges';
}

export function erloesKonto(rahmen: Kontenrahmen, ustSatz: number, kleinunternehmer?: boolean): number {
  const k = KONTEN[rahmen];
  if (kleinunternehmer || ustSatz === 0) return k.erloeseKlein;
  return ustSatz === 7 ? k.erloese7 : k.erloese19;
}

/** Steuersatz aus Netto und USt erkennen (19, 7 oder 0); `undefined` bei krummen Werten */
export function steuersatzAus(netto: Cent, ust: Cent): 19 | 7 | 0 | undefined {
  if (!ust) return 0;
  if (!netto) return undefined;
  for (const s of [19, 7] as const) {
    if (Math.abs(Math.round((netto * s) / 100) - ust) <= 2) return s;
  }
  return undefined;
}

/**
 * Aufwandskonto + BU-Schlüssel. Wareneingang hat Automatikkonten (keine BU nötig),
 * andere Konten bekommen BU 9 (19 % Vorsteuer) bzw. 8 (7 % Vorsteuer).
 */
export function aufwandKonto(rahmen: Kontenrahmen, aufwand: Aufwand, satz: 19 | 7 | 0): { konto: number; bu?: string } {
  const k = KONTEN[rahmen];
  if (aufwand === 'material') return { konto: satz === 19 ? k.material19 : satz === 7 ? k.material7 : k.material0 };
  return { konto: k.aufwand[aufwand], bu: satz === 19 ? '9' : satz === 7 ? '8' : undefined };
}

/** Personenkonto vergeben: vorhandene Nummer oder nächste freie ab `start` */
export function personenkonto(vergeben: Record<string, number>, schluessel: string, start: number): { nr: number; vergeben: Record<string, number> } {
  if (vergeben[schluessel]) return { nr: vergeben[schluessel], vergeben };
  const max = Object.values(vergeben).filter((n) => n >= start && n < start + 60000).reduce((m, n) => Math.max(m, n), start - 1);
  const nr = max + 1;
  return { nr, vergeben: { ...vergeben, [schluessel]: nr } };
}

export interface Buchung {
  umsatz: Cent;
  sh: 'S' | 'H';
  konto: number;
  gegenkonto: number;
  bu?: string;
  belegdatum: Datum;
  belegfeld1: string;
  text: string;
  quelle: { typ: 'rechnungen' | 'belege'; id: ID };
  /** Kostenstelle (KOST1) – Betriebsbereich des Belegs, nur wenn eingeschaltet */
  kost1?: string;
}

export interface ExportOptionen {
  von: Datum;
  bis: Datum;
  rahmen: Kontenrahmen;
  ustSatz: number;
  kleinunternehmer?: boolean;
  debitoren: Record<string, number>;
  kreditoren: Record<string, number>;
  /** Rechnungen, die schon exportiert wurden (id → Zeitpunkt) */
  rechnungenExportiert: Record<ID, string>;
  /** bereits exportierte Rechnungen/Belege trotzdem erneut ausgeben */
  auchExportierte?: boolean;
  /** Betriebsbereich eines Belegs als Kostenstelle (KOST1) mitgeben */
  kostenstellen?: boolean;
}

export interface ExportErgebnis {
  buchungen: Buchung[];
  rechnungIds: ID[];
  belegIds: ID[];
  /** im Zeitraum, aber schon exportiert – nicht enthalten (außer `auchExportierte`) */
  doppelt: { rechnungen: ID[]; belege: ID[] };
  /** im Zeitraum, aber nicht exportierbar (Entwurf/Storno) */
  uebersprungen: number;
  warnungen: string[];
  debitoren: Record<string, number>;
  kreditoren: Record<string, number>;
}

const EXPORTIERBAR: Rechnung['status'][] = ['versendet', 'teilbezahlt', 'bezahlt'];
const drin = (d: Datum, o: { von: Datum; bis: Datum }) => d >= o.von && d <= o.bis;

export function buchungenErzeugen(
  daten: { rechnungen: Rechnung[]; belege: Beleg[]; kunden: Kunde[]; lieferanten: Lieferant[] },
  o: ExportOptionen,
): ExportErgebnis {
  let debitoren = { ...o.debitoren };
  let kreditoren = { ...o.kreditoren };
  const buchungen: Buchung[] = [];
  const rechnungIds: ID[] = [];
  const belegIds: ID[] = [];
  const doppelt = { rechnungen: [] as ID[], belege: [] as ID[] };
  const warnungen: string[] = [];
  let uebersprungen = 0;
  const erloese = erloesKonto(o.rahmen, o.ustSatz, o.kleinunternehmer);
  const ust = o.kleinunternehmer ? 0 : o.ustSatz;

  for (const r of [...daten.rechnungen].sort((a, b) => a.datum.localeCompare(b.datum) || a.nummer.localeCompare(b.nummer))) {
    if (!drin(r.datum, o)) continue;
    if (!EXPORTIERBAR.includes(r.status)) {
      uebersprungen++;
      continue;
    }
    if (o.rechnungenExportiert[r.id]) {
      doppelt.rechnungen.push(r.id);
      if (!o.auchExportierte) continue;
    }
    const brutto = rechnungBrutto(r, daten.rechnungen, ust);
    if (!brutto) {
      warnungen.push(`Rechnung ${r.nummer} hat den Betrag 0 € und wurde nicht übernommen.`);
      continue;
    }
    const deb = personenkonto(debitoren, r.kundeId, DEBITOR_START);
    debitoren = deb.vergeben;
    const kunde = daten.kunden.find((k) => k.id === r.kundeId);
    buchungen.push({
      umsatz: Math.abs(brutto),
      sh: brutto > 0 ? 'S' : 'H',
      konto: deb.nr,
      gegenkonto: erloese,
      belegdatum: r.datum,
      belegfeld1: r.nummer,
      text: `${r.art === 'gutschrift' ? 'Gutschrift' : r.art === 'abschlag' ? 'Abschlag' : 'Rechnung'} ${kunde?.name ?? ''}`.trim(),
      quelle: { typ: 'rechnungen', id: r.id },
    });
    rechnungIds.push(r.id);
    if (r.art === 'abschlag') {
      warnungen.push(`Abschlagsrechnung ${r.nummer} ist als Erlös gebucht – bitte mit deinem Steuerberater abstimmen, ob er Anzahlungskonten nutzt.`);
    }
    // Netto-Kontrolle: Rechnungsbetrag muss zu den Positionen passen
    if (rechnungNetto(r, daten.rechnungen) === 0 && summen(r.positionen).netto !== 0) {
      warnungen.push(`Rechnung ${r.nummer}: Abschläge heben den Betrag auf – bitte prüfen.`);
    }
  }

  for (const x of [...daten.belege].sort((a, b) => a.datum.localeCompare(b.datum))) {
    if (!drin(x.datum, o)) continue;
    if (x.exportiertAm) {
      doppelt.belege.push(x.id);
      if (!o.auchExportierte) continue;
    }
    const brutto = x.netto + x.ust;
    if (!brutto) {
      warnungen.push(`Beleg vom ${x.datum} hat den Betrag 0 € und wurde nicht übernommen.`);
      continue;
    }
    let satz = steuersatzAus(x.netto, x.ust);
    if (satz == null) {
      satz = 19;
      warnungen.push(`Beleg ${x.nummer ?? 'vom ' + x.datum}: Steuersatz nicht eindeutig (${(x.ust / 100).toFixed(2)} € USt auf ${(x.netto / 100).toFixed(2)} € netto) – als 19 % gebucht, bitte prüfen.`);
    }
    const aufwand = aufwandAus(x);
    const { konto, bu } = aufwandKonto(o.rahmen, aufwand, satz);
    const lieferant = daten.lieferanten.find((l) => l.id === x.lieferantId);
    const name = lieferant?.name ?? x.lieferantName;
    let gegenkonto: number;
    if (!lieferant && !x.lieferantName && (x.art === 'quittung' || x.art === 'tankbeleg')) {
      gegenkonto = KONTEN[o.rahmen].kasse;
    } else {
      const schluessel = lieferant ? lieferant.id : `name:${(x.lieferantName ?? 'Unbekannt').trim().toLowerCase()}`;
      const kred = personenkonto(kreditoren, schluessel, KREDITOR_START);
      kreditoren = kred.vergeben;
      gegenkonto = kred.nr;
    }
    buchungen.push({
      umsatz: Math.abs(brutto),
      sh: brutto > 0 ? 'S' : 'H',
      konto,
      gegenkonto,
      bu,
      belegdatum: x.datum,
      belegfeld1: x.nummer ?? '',
      text: [name, AUFWAND_LABEL[aufwand]].filter(Boolean).join(' – '),
      quelle: { typ: 'belege', id: x.id },
      ...(o.kostenstellen && !x.auftragId && x.bereich ? { kost1: x.bereich } : {}),
    });
    belegIds.push(x.id);
  }

  return { buchungen, rechnungIds, belegIds, doppelt, uebersprungen, warnungen, debitoren, kreditoren };
}

// ------------------------------------------------------------------ Datei

/** Zeichen, die Windows-1252 zusätzlich im Bereich 0x80–0x9F kennt */
const CP1252: Record<string, number> = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a,
  '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
  '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

function darstellbar(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return (c >= 0x20 && c < 0x7f) || (c >= 0xa0 && c <= 0xff) || ch in CP1252 || ch === '\r' || ch === '\n';
}

/** Text so bereinigen, dass er in Windows-1252 darstellbar ist (ı → i, ł → l, Rest → ?) */
export function cp1252Text(text: string): string {
  let out = '';
  for (const ch of text) {
    if (darstellbar(ch)) {
      out += ch;
      continue;
    }
    const ersatz: Record<string, string> = { 'ı': 'i', 'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ș': 's', 'ț': 't', '\t': ' ' };
    if (ersatz[ch]) {
      out += ersatz[ch];
      continue;
    }
    const basis = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    out += basis && [...basis].every(darstellbar) ? basis : '?';
  }
  return out;
}

/** Text in Windows-1252-Bytes kodieren (für den Download) */
export function cp1252Bytes(text: string): Uint8Array {
  const sauber = cp1252Text(text);
  const bytes: number[] = [];
  for (const ch of sauber) {
    const c = ch.codePointAt(0)!;
    bytes.push(ch in CP1252 ? CP1252[ch] : c <= 0xff ? c : 0x3f);
  }
  return new Uint8Array(bytes);
}

/** 123456 Cent → "1234,56" */
export function betragDatev(cent: Cent): string {
  const abs = Math.abs(Math.round(cent));
  return `${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

/** "2026-09-30" → "3009" (Tag + Monat, Jahr steht im Kopf) */
export function belegdatumDatev(d: Datum): string {
  return d.slice(8, 10) + d.slice(5, 7);
}

/** Belegfeld 1: max. 36 Zeichen, nur A–Z, 0–9 und $ & % * + - / */
export function belegfeld(text: string): string {
  return cp1252Text(text)
    .toUpperCase()
    .replace(/[^A-Z0-9$&%*+\-/]/g, '')
    .slice(0, 36);
}

const txt = (s: string, max?: number) => `"${cp1252Text(max ? s.slice(0, max) : s).replace(/"/g, '""').replace(/[\r\n;]+/g, ' ')}"`;
const ymd = (d: Datum) => d.replace(/-/g, '');

export interface DateiKopf {
  beraterNr: string;
  mandantNr: string;
  von: Datum;
  bis: Datum;
  rahmen: Kontenrahmen;
  erzeugtAm: Date;
  bezeichnung?: string;
  /** Diktatkürzel, 2 Zeichen */
  kuerzel?: string;
}

/** Spaltenköpfe des Buchungsstapels (die ersten 14 Pflicht-/Standardspalten in DATEV-Reihenfolge) */
export const SPALTEN = [
  'Umsatz (ohne Soll/Haben-Kz)',
  'Soll/Haben-Kennzeichen',
  'WKZ Umsatz',
  'Kurs',
  'Basis-Umsatz',
  'WKZ Basis-Umsatz',
  'Konto',
  'Gegenkonto (ohne BU-Schlüssel)',
  'BU-Schlüssel',
  'Belegdatum',
  'Belegfeld 1',
  'Belegfeld 2',
  'Skonto',
  'Buchungstext',
];

function zeitstempel(d: Date): string {
  const z = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}${z(d.getMilliseconds(), 3)}`;
}

/** Kopfzeile (Zeile 1) im EXTF-Format 700, Formatkategorie 21 „Buchungsstapel“, Formatversion 13 */
export function kopfzeile(k: DateiKopf): string {
  const felder = [
    '"EXTF"', // 1 Kennzeichen
    '700', // 2 Versionsnummer
    '21', // 3 Formatkategorie
    '"Buchungsstapel"', // 4 Formatname
    '13', // 5 Formatversion
    zeitstempel(k.erzeugtAm), // 6 erzeugt am
    '', // 7 importiert
    '"RE"', // 8 Herkunft
    '"Handwerk OS"', // 9 exportiert von
    '""', // 10 importiert von
    k.beraterNr, // 11 Beraternummer
    k.mandantNr, // 12 Mandantennummer
    `${k.von.slice(0, 4)}0101`, // 13 Wirtschaftsjahresbeginn
    '4', // 14 Sachkontenlänge
    ymd(k.von), // 15 Datum vom
    ymd(k.bis), // 16 Datum bis
    txt(k.bezeichnung ?? `Handwerk OS ${k.von.slice(0, 7)}`, 30), // 17 Bezeichnung
    txt((k.kuerzel ?? 'MO').slice(0, 2)), // 18 Diktatkürzel
    '1', // 19 Buchungstyp: Finanzbuchführung
    '0', // 20 Rechnungslegungszweck
    '0', // 21 Festschreibung: nein
    '"EUR"', // 22 WKZ
    '', // 23 reserviert
    '""', // 24 Derivatskennzeichen
    '', // 25 reserviert
    '', // 26 reserviert
    `"${k.rahmen === 'SKR03' ? '03' : '04'}"`, // 27 SKR
    '', // 28 Branchenlösungs-ID
    '', // 29 reserviert
    '', // 30 reserviert
    '""', // 31 Anwendungsinformation
  ];
  return felder.join(';');
}

/** Spalten 15–37 bis „KOST1 – Kostenstelle“ – nur, wenn eine Buchung eine Kostenstelle hat */
export const SPALTEN_BIS_KOST1 = [
  'Postensperre',
  'Diverse Adressnummer',
  'Geschäftspartnerbank',
  'Sachverhalt',
  'Zinssperre',
  'Beleglink',
  ...Array.from({ length: 8 }, (_, i) => [`Beleginfo - Art ${i + 1}`, `Beleginfo - Inhalt ${i + 1}`]).flat(),
  'KOST1 - Kostenstelle',
];

export function buchungszeile(b: Buchung, mitKost = false): string {
  const kost = mitKost ? [...SPALTEN_BIS_KOST1.slice(0, -1).map(() => ''), b.kost1 ? txt(b.kost1, 36) : '""'] : [];
  return [
    betragDatev(b.umsatz),
    `"${b.sh}"`,
    '"EUR"',
    '',
    '',
    '""',
    String(b.konto),
    String(b.gegenkonto),
    b.bu ? `"${b.bu}"` : '""',
    belegdatumDatev(b.belegdatum),
    `"${belegfeld(b.belegfeld1)}"`,
    '""',
    '',
    txt(b.text, 60),
    ...kost,
  ].join(';');
}

export function extfDatei(buchungen: Buchung[], kopf: DateiKopf): string {
  const mitKost = buchungen.some((b) => b.kost1);
  const spalten = mitKost ? [...SPALTEN, ...SPALTEN_BIS_KOST1] : SPALTEN;
  const zeilen = [kopfzeile(kopf), spalten.join(';'), ...buchungen.map((b) => buchungszeile(b, mitKost))];
  return zeilen.join('\r\n') + '\r\n';
}

export function dateiname(von: Datum, bis: Datum): string {
  return `EXTF_Buchungsstapel_${ymd(von)}_${ymd(bis)}.csv`;
}

// ------------------------------------------------------------------ Prüfungen

export interface DatevEinstellungen {
  rahmen: Kontenrahmen;
  beraterNr: string;
  mandantNr: string;
  /** Betriebsbereiche der Belege als Kostenstelle (KOST1) übergeben – nur, wenn der Steuerberater Kostenstellen nutzt */
  kostenstellen?: boolean;
}

export function einstellungenPruefen(e: DatevEinstellungen): Partial<Record<'beraterNr' | 'mandantNr', string>> {
  const f: Partial<Record<'beraterNr' | 'mandantNr', string>> = {};
  const b = Number(e.beraterNr);
  if (!/^\d+$/.test(e.beraterNr) || b < 1001 || b > 9999999) f.beraterNr = 'Beraternummer: 4 bis 7 Ziffern (1001 bis 9999999). Steht in jeder Mail deines Steuerberaters.';
  const m = Number(e.mandantNr);
  if (!/^\d+$/.test(e.mandantNr) || m < 1 || m > 99999) f.mandantNr = 'Mandantennummer: 1 bis 5 Ziffern (1 bis 99999).';
  return f;
}

export function zeitraumPruefen(von: Datum, bis: Datum): string | undefined {
  if (!von || !bis) return 'Bitte Zeitraum wählen.';
  if (von > bis) return '„Von“ liegt nach „Bis“.';
  if (von.slice(0, 4) !== bis.slice(0, 4)) return 'Ein Buchungsstapel darf nur ein Wirtschaftsjahr umfassen. Exportiere die Jahre bitte getrennt.';
  return undefined;
}

// ------------------------------------------------------------------ Monatsabschluss

export interface AbschlussPunkt {
  id: string;
  titel: string;
  text: string;
  /** automatisch aus den Daten geprüft (nicht abhakbar) */
  automatisch: boolean;
  erledigt: boolean;
}

export function monatsSpanne(monat: string): { von: Datum; bis: Datum } {
  const [j, m] = monat.split('-').map(Number);
  const ende = new Date(j, m, 0).getDate();
  return { von: `${monat}-01`, bis: `${monat}-${String(ende).padStart(2, '0')}` };
}

export function abschlussPunkte(
  d: { rechnungen: Rechnung[]; belege: Beleg[]; zeiten: { datum: Datum; freigegeben?: boolean; ende?: string }[] },
  monat: string,
  bestaetigt: Record<string, boolean>,
  rechnungenExportiert: Record<ID, string>,
): AbschlussPunkt[] {
  const s = monatsSpanne(monat);
  const imMonat = (x: Datum) => drin(x, s);
  const belege = d.belege.filter((b) => imMonat(b.datum));
  const ungeprueft = belege.filter((b) => b.status === 'neu').length;
  const entwuerfe = d.rechnungen.filter((r) => r.status === 'entwurf' && imMonat(r.datum)).length;
  const zeiten = d.zeiten.filter((z) => imMonat(z.datum));
  const offeneZeiten = zeiten.filter((z) => !z.freigegeben || !z.ende).length;
  const rechnungen = d.rechnungen.filter((r) => EXPORTIERBAR.includes(r.status) && imMonat(r.datum));
  const nichtExportiert = belege.filter((b) => !b.exportiertAm).length + rechnungen.filter((r) => !rechnungenExportiert[r.id]).length;
  const n = (x: number, eins: string, viele: string) => (x === 1 ? `1 ${eins}` : `${x} ${viele}`);
  return [
    {
      id: 'belege-vollstaendig',
      titel: 'Alle Belege erfasst?',
      text: `${n(belege.length, 'Beleg', 'Belege')} im Monat erfasst. Denk an Tankquittungen, Baumarkt-Bons und Rechnungen aus dem Mail-Postfach.`,
      automatisch: false,
      erledigt: !!bestaetigt['belege-vollstaendig'],
    },
    {
      id: 'belege-geprueft',
      titel: 'Belege geprüft',
      text: ungeprueft ? `${n(ungeprueft, 'Beleg ist', 'Belege sind')} noch nicht geprüft.` : 'Alle Belege des Monats sind geprüft.',
      automatisch: true,
      erledigt: ungeprueft === 0,
    },
    {
      id: 'rechnungen-raus',
      titel: 'Keine Rechnungsentwürfe offen',
      text: entwuerfe ? `${n(entwuerfe, 'Rechnungsentwurf liegt', 'Rechnungsentwürfe liegen')} noch im Monat.` : 'Alle Rechnungen des Monats sind raus.',
      automatisch: true,
      erledigt: entwuerfe === 0,
    },
    {
      id: 'zeiten-freigegeben',
      titel: 'Arbeitszeiten freigegeben',
      text: offeneZeiten ? `${n(offeneZeiten, 'Zeit ist', 'Zeiten sind')} noch nicht freigegeben oder ohne Ende.` : zeiten.length ? 'Alle Zeiten sind freigegeben.' : 'Keine Zeiten im Monat erfasst.',
      automatisch: true,
      erledigt: offeneZeiten === 0,
    },
    {
      id: 'kasse-bank',
      titel: 'Kasse gezählt und Kontoauszüge abgeglichen',
      text: 'Bargeld in der Kasse stimmt, Zahlungseingänge sind den Rechnungen zugeordnet.',
      automatisch: false,
      erledigt: !!bestaetigt['kasse-bank'],
    },
    {
      id: 'export',
      titel: 'An den Steuerberater übergeben',
      text: nichtExportiert ? `${n(nichtExportiert, 'Buchung ist', 'Buchungen sind')} noch nicht exportiert.` : belege.length + rechnungen.length ? 'Alles exportiert.' : 'Im Monat gibt es nichts zu exportieren.',
      automatisch: true,
      erledigt: nichtExportiert === 0,
    },
  ];
}
