/** Onboarding: Antworten → `einrichten()`, Kunden-CSV-Import und Zusammenfassung „Was ist vorbereitet?“. */
import { batch, db, exportieren, type Neu } from '@core/db';
import { gewerkVorlage } from '@core/gewerke';
import { automationAn } from '@core/macher';
import { alleAutomationen } from '@core/modul';
import type { Arbeitsweise, Gewerk, Kunde } from '@core/objects';
import { einrichten } from '@core/seed';

export type Teamgroesse = 'allein' | 'klein' | 'mittel' | 'gross';

export const TEAM: { wert: Teamgroesse; label: string; text: string; zahl: number }[] = [
  { wert: 'allein', label: 'Nur ich', text: 'Du machst alles selbst', zahl: 1 },
  { wert: 'klein', label: '2 bis 5', text: 'Kleines Team, kurze Wege', zahl: 4 },
  { wert: 'mittel', label: '6 bis 15', text: 'Mit Büro und mehreren Kolonnen', zahl: 10 },
  { wert: 'gross', label: '16 bis 50', text: 'Mehrere Teams und Bauleitung', zahl: 30 },
];

export type Startdaten = 'beispiele' | 'csv' | 'leer';

export interface Antworten {
  gewerk: Gewerk;
  leistungen: string[];
  arbeitsweisen: Arbeitsweise[];
  team: Teamgroesse;
  start: Startdaten;
  kunden: Neu<Kunde>[];
  betriebName: string;
  vorname: string;
  nachname: string;
}

// ------------------------------------------------------------------ CSV

export interface CsvErgebnis {
  kunden: Neu<Kunde>[];
  /** verständliche Hinweise, z. B. „Zeile 4: kein Name – übersprungen“ */
  hinweise: string[];
  fehler?: string;
}

const norm = (t: string) =>
  t
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');

const SPALTEN: Record<string, string[]> = {
  name: ['name', 'kunde', 'kundenname', 'name1', 'kontakt', 'ansprechpartner'],
  vorname: ['vorname'],
  nachname: ['nachname', 'familienname'],
  firma: ['firma', 'firmenname', 'unternehmen', 'company'],
  telefon: ['telefon', 'tel', 'telefonnummer', 'fon', 'mobil', 'handy', 'phone'],
  email: ['email', 'mail', 'emailadresse'],
  strasse: ['strasse', 'str', 'strassehausnummer', 'adresse', 'anschrift', 'street'],
  plz: ['plz', 'postleitzahl', 'zip'],
  ort: ['ort', 'stadt', 'wohnort', 'city'],
  nummer: ['nummer', 'kundennummer', 'kdnr', 'kundennr', 'nr'],
  notiz: ['notiz', 'bemerkung', 'info', 'hinweis'],
};

/** Eine CSV-Zeile mit Anführungszeichen korrekt zerlegen */
function zerlege(zeile: string, trenner: string): string[] {
  const felder: string[] = [];
  let feld = '';
  let inQuote = false;
  for (let i = 0; i < zeile.length; i++) {
    const c = zeile[i];
    if (c === '"') {
      if (inQuote && zeile[i + 1] === '"') {
        feld += '"';
        i++;
      } else inQuote = !inQuote;
    } else if (c === trenner && !inQuote) {
      felder.push(feld);
      feld = '';
    } else feld += c;
  }
  felder.push(feld);
  return felder.map((f) => f.trim());
}

/** Liest eine Kundenliste (Excel-CSV mit ; oder , oder Tab). Erste Zeile = Überschriften. */
export function kundenAusCsv(text: string): CsvErgebnis {
  const zeilen = text.replace(/^﻿/, '').split(/\r?\n/).filter((z) => z.trim());
  if (zeilen.length < 2) return { kunden: [], hinweise: [], fehler: 'Die Datei enthält keine Kunden. Die erste Zeile braucht Überschriften, darunter je Zeile ein Kunde.' };
  const kopf = zeilen[0];
  const trenner = [';', '\t', ','].sort((a, b) => kopf.split(b).length - kopf.split(a).length)[0];
  const ueberschriften = zerlege(kopf, trenner).map(norm);
  const index: Record<string, number> = {};
  for (const [feld, namen] of Object.entries(SPALTEN)) {
    const i = ueberschriften.findIndex((u) => namen.includes(u));
    if (i >= 0) index[feld] = i;
  }
  if (index.name == null && index.nachname == null && index.firma == null)
    return { kunden: [], hinweise: [], fehler: 'Keine Spalte für den Namen gefunden. Die erste Zeile braucht Überschriften wie Name, Telefon, E-Mail, Straße, PLZ, Ort.' };

  const kunden: Neu<Kunde>[] = [];
  const hinweise: string[] = [];
  const gesehen = new Set<string>();
  zeilen.slice(1).forEach((z, n) => {
    const f = zerlege(z, trenner);
    const wert = (k: string) => (index[k] != null ? f[index[k]]?.trim() || undefined : undefined);
    const person = [wert('vorname'), wert('nachname')].filter(Boolean).join(' ') || undefined;
    const firma = wert('firma');
    const name = wert('name') ?? firma ?? person;
    if (!name) {
      hinweise.push(`Zeile ${n + 2}: kein Name – übersprungen.`);
      return;
    }
    const schluessel = `${name}|${wert('plz') ?? ''}`.toLowerCase();
    if (gesehen.has(schluessel)) {
      hinweise.push(`Zeile ${n + 2}: ${name} ist doppelt – übersprungen.`);
      return;
    }
    gesehen.add(schluessel);
    const strasse = wert('strasse');
    const plz = wert('plz');
    const ort = wert('ort');
    kunden.push({
      art: firma ? 'firma' : 'privat',
      name,
      firma,
      telefon: wert('telefon'),
      email: wert('email'),
      adresse: strasse || plz || ort ? { strasse: strasse ?? '', plz: plz ?? '', ort: ort ?? '' } : undefined,
      nummer: wert('nummer'),
      notiz: wert('notiz'),
      ansprechpartner: firma && person && person !== name ? [{ id: 'ap1', name: person, telefon: wert('telefon'), email: wert('email') }] : [],
      quelle: 'sonstiges',
    });
  });
  return { kunden, hinweise };
}

// ------------------------------------------------------------------ Einrichten

export function betriebEinrichten(a: Antworten) {
  einrichten({
    betriebName: a.betriebName.trim(),
    gewerk: a.gewerk,
    arbeitsweisen: a.arbeitsweisen,
    teamgroesse: TEAM.find((t) => t.wert === a.team)?.zahl ?? 1,
    chefVorname: a.vorname.trim(),
    chefNachname: a.nachname.trim(),
    leistungen: a.leistungen,
    beispiele: a.start === 'beispiele',
  });
  if (a.start === 'csv' && a.kunden.length) {
    batch(() => {
      a.kunden.forEach((k, i) => db.kunden.create({ ...k, nummer: k.nummer ?? `K-${1001 + i}` }));
    });
  }
}

/** Was hat Macher vorbereitet? Nur echte Zahlen aus den Daten. */
const MODUL_SAMMLUNGEN: Record<string, string> = {
  checklistenVorlagen: 'Checklisten',
  arbeitsanweisungen: 'Arbeitsanweisungen',
  vorlagen: 'Vorlagen & Formulare',
  wissen: 'Anleitungen',
  schulungen: 'Schulungen',
  unterweisungen: 'Unterweisungen',
  einarbeitungen: 'Einarbeitungspläne',
  servicevertraege: 'Serviceverträge',
  serien: 'Wiederkehrende Termine',
  buchungsfenster: 'Buchungszeiten',
};

export interface Vorbereitet {
  label: string;
  anzahl: number;
}

export function vorbereitet(): Vorbereitet[] {
  const roh = exportieren();
  const zaehle = (name: string) => Object.values(roh[name] ?? {}).filter((x) => !x.geloeschtAm).length;
  const liste: Vorbereitet[] = [
    { label: 'Leistungen mit Preisen', anzahl: db.leistungen.all().length },
    { label: 'Artikel & Material', anzahl: db.artikel.all().length },
    { label: 'Qualifikationen', anzahl: db.qualifikationen.all().length },
    ...Object.entries(MODUL_SAMMLUNGEN).map(([name, label]) => ({ label, anzahl: zaehle(name) })),
    { label: 'Automatische Regeln eingeschaltet', anzahl: alleAutomationen().filter((x) => automationAn(x.id)).length },
  ];
  return liste.filter((x) => x.anzahl > 0);
}

export const gewerkLabel = (g: Gewerk) => gewerkVorlage(g).label;
