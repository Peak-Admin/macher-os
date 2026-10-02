/**
 * Zahlungen: buchen (Teilzahlung, Skonto), Rechnungsstatus abgleichen,
 * Kontoauszug (CSV) lesen und Zahlungen automatisch zuordnen.
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
  rechnungAendern(r.id, { status: neu }, { text: neu === 'bezahlt' ? 'Vollständig bezahlt' : neu === 'teilbezahlt' ? 'Teilweise bezahlt' : 'Wieder offen' });
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
    beispiel: r.beispiel,
  } as Parameters<typeof db.zahlungen.create>[0]) as ZahlungX;
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
    umsaetze.push({ zeile: i + 1, datum: d, betrag, zweck: iZweck >= 0 ? f[iZweck] ?? '' : '', name: iName >= 0 ? f[iName] ?? '' : '' });
  }
  return { umsaetze };
}

export type Sicherheit = 'sicher' | 'unsicher' | 'keine' | 'doppelt';

export interface Zuordnung {
  umsatz: Umsatz;
  rechnungId?: ID;
  sicherheit: Sicherheit;
  grund: string;
}

const nummerKern = (n: string) => n.replace(/[^0-9a-z]/gi, '').toLowerCase();

function nameTreffer(name: string, zweck: string, kundeId: ID) {
  const k = db.kunden.get(kundeId);
  if (!k) return false;
  const heu = `${name} ${zweck}`.toLowerCase();
  const woerter = [k.name, k.firma ?? '']
    .join(' ')
    .toLowerCase()
    .split(/[^a-zäöüß0-9]+/)
    .filter((w) => w.length >= 4 && !['familie', 'gmbh', 'herr', 'frau'].includes(w));
  return woerter.some((w) => heu.includes(w));
}

/** Umsätze den offenen Rechnungen zuordnen: Rechnungsnummer im Zweck, sonst Betrag + Kunde */
export function zuordnen(umsaetze: Umsatz[], posten: RechnungX[] = offenePosten()): Zuordnung[] {
  const vergeben = new Map<ID, Cent>();
  const restOffen = (r: RechnungX) => offenerBetrag(r) - (vergeben.get(r.id) ?? 0);
  return umsaetze.map((u) => {
    // schon gebucht? (gleicher Betrag, gleiches Datum, gleiche Rechnung)
    const doppelt = (db.zahlungen.all() as ZahlungX[]).find((z) => z.betrag === u.betrag && z.datum === u.datum && z.quelle === 'kontoauszug');
    if (doppelt) return { umsatz: u, rechnungId: doppelt.rechnungId, sicherheit: 'doppelt' as const, grund: 'Schon gebucht' };

    const zweck = nummerKern(u.zweck);
    const perNummer = posten.find((r) => r.nummer && zweck.includes(nummerKern(r.nummer)));
    const merken = (r: RechnungX) => vergeben.set(r.id, (vergeben.get(r.id) ?? 0) + u.betrag);
    if (perNummer) {
      merken(perNummer);
      const rest = restOffen(perNummer) + u.betrag;
      const grund = u.betrag === rest ? `Rechnungsnummer ${perNummer.nummer} im Verwendungszweck` : u.betrag < rest ? `${perNummer.nummer} im Verwendungszweck – Teilzahlung oder Skonto` : `${perNummer.nummer} im Verwendungszweck – mehr als offen`;
      return { umsatz: u, rechnungId: perNummer.id, sicherheit: u.betrag > rest ? ('unsicher' as const) : ('sicher' as const), grund };
    }
    const gleicherBetrag = posten.filter((r) => restOffen(r) === u.betrag);
    const mitName = gleicherBetrag.filter((r) => nameTreffer(u.name, u.zweck, r.kundeId));
    if (mitName.length === 1) {
      merken(mitName[0]);
      return { umsatz: u, rechnungId: mitName[0].id, sicherheit: 'sicher' as const, grund: 'Betrag und Kunde passen' };
    }
    if (gleicherBetrag.length >= 1) {
      merken(gleicherBetrag[0]);
      return { umsatz: u, rechnungId: gleicherBetrag[0].id, sicherheit: 'unsicher' as const, grund: gleicherBetrag.length === 1 ? 'Nur der Betrag passt' : 'Betrag passt zu mehreren Rechnungen' };
    }
    const nurName = posten.filter((r) => nameTreffer(u.name, u.zweck, r.kundeId) && restOffen(r) > 0);
    if (nurName.length === 1) {
      merken(nurName[0]);
      return { umsatz: u, rechnungId: nurName[0].id, sicherheit: 'unsicher' as const, grund: 'Kunde passt, Betrag nicht' };
    }
    return { umsatz: u, sicherheit: 'keine' as const, grund: 'Keine passende Rechnung' };
  });
}

/** Freigabe-Hinweis für eine unsichere Zuordnung (dedupliziert) */
export function freigabeHinweis(z: Zuordnung) {
  const r = rechnungX(z.rechnungId);
  if (!r) return undefined;
  const schluessel = `zahlung-freigabe:${r.id}:${z.umsatz.datum}:${z.umsatz.betrag}`;
  const da = db.hinweise.all().find((h) => h.schluessel === schluessel && h.status === 'offen');
  if (da) return da;
  return db.hinweise.create({
    art: 'freigabe',
    titel: `Zahlung ${euro(z.umsatz.betrag)} zu ${r.nummer}?`,
    text: `${z.grund}. Kontoauszug vom ${z.umsatz.datum.split('-').reverse().join('.')}: ${z.umsatz.name || 'ohne Namen'} – „${z.umsatz.zweck || 'ohne Verwendungszweck'}“.`,
    bezug: { typ: 'rechnungen', id: r.id },
    gewicht: 64,
    status: 'offen',
    schluessel,
    fuerRollen: ['chef', 'buero'],
    aktionen: [
      { id: 'zahlung.bestaetigen', label: 'Zahlung buchen', primaer: true, payload: { rechnungId: r.id, betrag: z.umsatz.betrag, datum: z.umsatz.datum, zweck: z.umsatz.zweck, name: z.umsatz.name, schluessel } },
      { id: 'zahlung.verwerfen', label: 'Passt nicht', payload: { schluessel } },
    ],
    beispiel: r.beispiel,
  });
}

/** Import ausführen: sichere buchen, unsichere als Freigabe-Hinweis */
export function importAusfuehren(zuordnungen: Zuordnung[]) {
  let gebucht = 0;
  let summe = 0;
  let freigaben = 0;
  for (const z of zuordnungen) {
    if (z.sicherheit === 'sicher' && z.rechnungId) {
      const ok = zahlungBuchen({ rechnungId: z.rechnungId, betrag: z.umsatz.betrag, datum: z.umsatz.datum, verwendungszweck: z.umsatz.zweck, quelle: 'kontoauszug', zahler: z.umsatz.name });
      if (ok) {
        gebucht++;
        summe += z.umsatz.betrag;
      }
    } else if (z.sicherheit === 'unsicher' && z.rechnungId) {
      if (freigabeHinweis(z)) freigaben++;
    }
  }
  return { gebucht, summe, freigaben };
}

/** Beispiel-Kontoauszug aus den offenen Beispielrechnungen (zum Ausprobieren) */
export function beispielKontoauszug(): string {
  const kopf = 'Buchungstag;Valuta;Name Zahlungsbeteiligter;Verwendungszweck;Betrag (EUR)';
  const posten = offenePosten().filter((r) => r.beispiel);
  const fmt = (c: Cent) => (c / 100).toFixed(2).replace('.', ',');
  const d = heute().split('-').reverse().join('.');
  const zeilen = posten.map((r, i) =>
    i === 0
      ? `${d};${d};${db.kunden.get(r.kundeId)?.name ?? ''};"Rechnung ${r.nummer}";${fmt(offenerBetrag(r))}`
      : `${d};${d};${db.kunden.get(r.kundeId)?.name ?? ''};"Zahlung";${fmt(offenerBetrag(r))}`,
  );
  zeilen.push(`${d};${d};Stadtwerke;"Abschlag Strom";-89,00`);
  return [kopf, ...zeilen].join('\n');
}
