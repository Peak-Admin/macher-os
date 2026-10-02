/**
 * Zahlungen: buchen (Teilzahlung, Skonto), Rechnungsstatus abgleichen, Kontoauszug (CSV) lesen.
 * Die Zuordnung von Kontoumsätzen zu Rechnungen steht in `abgleich.ts`, CAMT.053 in `camt.ts`.
 */
import { db, vermerken } from '@core/db';
import { emit } from '@core/events';
import { centAus, euro, heute } from '@core/format';
import type { Cent, Datum, ID, Zahlung } from '@core/objects';
import { offenerBetrag, offenePosten, rechnungsSummen, statusAusZahlungen } from '../rechnungen/logik';
import { rechnungAendern, rechnungX, type RechnungX, type ZahlungX } from '../rechnungen/typen';

/** Rechnungsstatus an die Zahlungen anpassen. Gibt den neuen Status zurück, wenn er sich geändert hat. */
export function statusAbgleichen(rechnungId: ID): RechnungX['status'] | undefined {
  const r = rechnungX(rechnungId);
  if (!r) return undefined;
  const neu = statusAusZahlungen(r);
  if (neu === r.status) return undefined;
  const geaendert = rechnungAendern(r.id, { status: neu }, { text: neu === 'bezahlt' ? 'Vollständig bezahlt' : neu === 'teilbezahlt' ? 'Teilweise bezahlt' : 'Wieder offen' });
  // fachliches Ereignis: Mahnwesen, Auftrag und Benachrichtigungen hängen sich daran
  if (neu === 'bezahlt' && geaendert) emit({ typ: 'rechnung.bezahlt', sammlung: 'rechnungen', objekt: geaendert, vorher: r });
  return neu;
}

export interface Buchung {
  rechnungId: ID;
  betrag: Cent;
  datum?: Datum;
  art?: Zahlung['art'];
  /** Rest als Skonto ausbuchen (Betrag) */
  skonto?: Cent;
  verwendungszweck?: string;
  quelle?: ZahlungX['quelle'];
  zahler?: string;
  /** Kontoumsatz, aus dem die Zahlung stammt (Zahlungsabgleich) */
  umsatzId?: ID;
}

/** Zahlung erfassen, Status setzen, Event `zahlung.eingegangen` */
export function zahlungBuchen(b: Buchung): ZahlungX | undefined {
  const r = rechnungX(b.rechnungId);
  if (!r || b.betrag <= 0) return undefined;
  const z = db.zahlungen.create({
    rechnungId: r.id,
    betrag: b.betrag,
    datum: b.datum ?? heute(),
    art: b.art ?? 'ueberweisung',
    verwendungszweck: b.verwendungszweck,
    skonto: b.skonto && b.skonto > 0 ? b.skonto : undefined,
    quelle: b.quelle ?? 'manuell',
    zahler: b.zahler,
    ...(b.umsatzId ? { umsatzId: b.umsatzId } : {}),
    beispiel: r.beispiel,
  });
  statusAbgleichen(r.id);
  vermerken({ typ: 'rechnungen', id: r.id }, 'zahlung.eingegangen', `Zahlung über ${euro(b.betrag)} erfasst${z.skonto ? ` (Skonto ${euro(z.skonto)})` : ''}`);
  emit({ typ: 'zahlung.eingegangen', sammlung: 'zahlungen', objekt: z, daten: { rechnungId: r.id } });
  return z;
}

export function zahlungLoeschen(id: ID) {
  const z = db.zahlungen.get(id);
  if (!z) return;
  db.zahlungen.remove(id);
  statusAbgleichen(z.rechnungId);
}

/** Skonto-Vorschlag: was fehlt, wenn der Kunde weniger überweist */
export function skontoVorschlag(r: RechnungX, betrag: Cent) {
  const offen = offenerBetrag(r);
  const rest = offen - betrag;
  if (rest <= 0 || betrag <= 0) return undefined;
  const prozent = Math.round((rest / rechnungsSummen(r).zahlbetrag) * 1000) / 10;
  // typische Skonti bis 3 % – mehr ist eher eine Teilzahlung
  return { rest, prozent, plausibel: prozent <= 3.05 };
}

// ------------------------------------------------------------------ Kontoauszug (CSV)

export interface Umsatz {
  zeile: number;
  datum: Datum;
  betrag: Cent;
  zweck: string;
  name: string;
  /** IBAN des Zahlers, falls die Bank sie liefert */
  iban?: string;
  /** eindeutige Bankreferenz (CAMT, Bankverbindung); fehlt bei CSV */
  referenz?: string;
}

/** CSV-Zeile mit Anführungszeichen und Trennzeichen zerlegen */
export function csvZeile(zeile: string, trenner = ';'): string[] {
  const out: string[] = [];
  let feld = '';
  let inQ = false;
  for (let i = 0; i < zeile.length; i++) {
    const c = zeile[i];
    if (inQ) {
      if (c === '"' && zeile[i + 1] === '"') {
        feld += '"';
        i++;
      } else if (c === '"') inQ = false;
      else feld += c;
    } else if (c === '"') inQ = true;
    else if (c === trenner) {
      out.push(feld.trim());
      feld = '';
    } else feld += c;
  }
  out.push(feld.trim());
  return out;
}

function datumAus(s: string): Datum | undefined {
  const t = s.trim();
  let m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (m) {
    const j = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${j}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return undefined;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9äöüß]/g, '');

const SPALTEN = {
  datum: ['buchungstag', 'buchungsdatum', 'datum', 'valuta', 'wertstellung', 'valutadatum'],
  betrag: ['betrag', 'betrageur', 'umsatz', 'betragineur', 'umsatzineur'],
  haben: ['haben', 'habeneur', 'eingang'],
  soll: ['soll', 'solleur', 'ausgang'],
  zweck: ['verwendungszweck', 'buchungstext', 'vorgangverwendungszweck', 'beschreibung', 'zweck'],
  iban: ['iban', 'ibanzahlungsbeteiligter', 'kontonummeriban', 'ibanauftraggeber', 'gegenkontoiban', 'kontonummer'],
  name: ['beguenstigterzahlungspflichtiger', 'begünstigterzahlungspflichtiger', 'namezahlungsbeteiligter', 'auftraggeberempfänger', 'auftraggeber', 'zahlungspflichtiger', 'empfänger', 'name', 'gegenkonto', 'auftraggeberbegünstigter'],
};

function finde(kopf: string[], namen: string[]) {
  const k = kopf.map(norm);
  for (const n of namen) {
    const i = k.indexOf(norm(n));
    if (i >= 0) return i;
  }
  for (const n of namen) {
    const i = k.findIndex((x) => x.startsWith(norm(n)));
    if (i >= 0) return i;
  }
  return -1;
}

/** Bank-CSV (Semikolon, deutsche Zahlen) lesen. Gibt nur Zahlungseingänge zurück. */
export function kontoauszugLesen(text: string): { umsaetze: Umsatz[]; fehler?: string } {
  const zeilen = text.replace(/^﻿/, '').split(/\r?\n/);
  const trenner = (zeilen.find((z) => z.includes(';')) ? ';' : zeilen.find((z) => z.includes('\t')) ? '\t' : ',') as string;
  // Kopfzeile finden (manche Banken schreiben vorher Kontoinfos)
  let kopfIdx = -1;
  let kopf: string[] = [];
  for (let i = 0; i < Math.min(zeilen.length, 40); i++) {
    const z = csvZeile(zeilen[i], trenner);
    if (finde(z, SPALTEN.datum) >= 0 && (finde(z, SPALTEN.betrag) >= 0 || finde(z, SPALTEN.haben) >= 0)) {
      kopfIdx = i;
      kopf = z;
      break;
    }
  }
  if (kopfIdx < 0) return { umsaetze: [], fehler: 'In der Datei fehlt eine Kopfzeile mit Datum und Betrag. Exportiere die Umsätze als CSV aus deinem Online-Banking.' };
  const iDatum = finde(kopf, SPALTEN.datum);
  const iBetrag = finde(kopf, SPALTEN.betrag);
  const iHaben = finde(kopf, SPALTEN.haben);
  const iSoll = finde(kopf, SPALTEN.soll);
  const iZweck = finde(kopf, SPALTEN.zweck);
  const iName = finde(kopf, SPALTEN.name);
  const iIban = finde(kopf, SPALTEN.iban);
  const umsaetze: Umsatz[] = [];
  for (let i = kopfIdx + 1; i < zeilen.length; i++) {
    if (!zeilen[i].trim()) continue;
    const f = csvZeile(zeilen[i], trenner);
    const d = datumAus(f[iDatum] ?? '');
    if (!d) continue;
    let betrag = 0;
    if (iBetrag >= 0 && f[iBetrag]) {
      betrag = centAus(f[iBetrag]);
      // "S"/"H"-Kennzeichen in Nachbarspalte (z. B. Volksbank)
      const sh = f[iBetrag + 1]?.trim().toUpperCase();
      if (sh === 'S') betrag = -Math.abs(betrag);
    } else if (iHaben >= 0 && f[iHaben]) betrag = Math.abs(centAus(f[iHaben]));
    else if (iSoll >= 0 && f[iSoll]) betrag = -Math.abs(centAus(f[iSoll]));
    if (betrag <= 0) continue;
    const iban = iIban >= 0 ? (f[iIban] ?? '').replace(/\s+/g, '').toUpperCase() : '';
    umsaetze.push({
      zeile: i + 1,
      datum: d,
      betrag,
      zweck: iZweck >= 0 ? f[iZweck] ?? '' : '',
      name: iName >= 0 ? f[iName] ?? '' : '',
      ...(/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban) ? { iban } : {}),
    });
  }
  return { umsaetze };
}

/** Beispiel-Kontoauszug aus den offenen Beispielrechnungen (zum Ausprobieren) */
export function beispielKontoauszug(): string {
  const kopf = 'Buchungstag;Valuta;Name Zahlungsbeteiligter;Verwendungszweck;Betrag (EUR)';
  const posten = offenePosten().filter((r) => r.beispiel);
  const fmt = (c: Cent) => (c / 100).toFixed(2).replace('.', ',');
  const d = heute().split('-').reverse().join('.');
  // erste Zeile: verstümmelte Rechnungsnummer („RE 2026 42“), dann nur Name und Betrag
  const verstuemmelt = (n: string) => {
    const m = n.match(/(\d{4})\D+0*(\d+)$/);
    return m ? `RE ${m[1]} ${m[2]}` : n;
  };
  const zeilen = posten.map((r, i) =>
    i === 0
      ? `${d};${d};${db.kunden.get(r.kundeId)?.name ?? ''};"Rechnung ${verstuemmelt(r.nummer)}";${fmt(offenerBetrag(r))}`
      : `${d};${d};${db.kunden.get(r.kundeId)?.name ?? ''};"Zahlung";${fmt(offenerBetrag(r))}`,
  );
  zeilen.push(`${d};${d};Stadtwerke;"Abschlag Strom";-89,00`);
  return [kopf, ...zeilen].join('\n');
}
