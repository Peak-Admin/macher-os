/**
 * Gemeinsame Hilfen von „Frag Lotte“: Namen, Kunden und Aufträge im Satz finden, Pläne bauen.
 * Eigene Datei, damit `assistent.ts` und `aktionen.ts` sie ohne Ringabhängigkeit nutzen.
 */
import { db } from '@core/db';
import { AUFTRAGSNUMMER_IM_TEXT } from '@core/projektnummer';
import { uhrzeit } from '@core/format';
import { aktionDef, type Plan, type PlanSchritt } from '@core/gateway';
import type { Auftrag, Kunde, Mitarbeiter, Phase } from '@core/objects';
import type { Antwort, Kontext } from './assistent';

export const klein = (t: string) => t.toLowerCase();
export const vid = () => Math.random().toString(36).slice(2, 10);
export const gross = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);

const STOPP = new Set(['familie', 'frau', 'herr', 'herrn', 'firma', 'gmbh', 'kg', 'ohg', 'gbr', 'und', 'der', 'die', 'das', 'von', 'e', 'k', 'co', 'ag', 'baustelle']);

/** Kleinbuchstaben, Umlaute ausgeschrieben, Satzzeichen weg – „Müller“ = „Mueller“ */
export function normalisieren(t: string): string {
  return klein(t)
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function woerter(t: string) {
  return klein(t)
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const nWoerter = (t: string) => normalisieren(t).split(' ').filter(Boolean);

/** Mitarbeiter, dessen Vor- oder Nachname als Wort vorkommt (Vor- und Nachname zusammen zählt mehr; Umlaute egal) */
export function findeMitarbeiter(text: string): Mitarbeiter | undefined {
  const w = new Set(nWoerter(text));
  const alle = db.mitarbeiter.where((m) => m.aktiv);
  const v = (m: Mitarbeiter) => normalisieren(m.vorname);
  const n = (m: Mitarbeiter) => normalisieren(m.nachname);
  return alle.find((m) => w.has(v(m)) && w.has(n(m))) ?? alle.find((m) => w.has(v(m))) ?? alle.find((m) => n(m).length > 2 && w.has(n(m)));
}

/** Kunde, dessen Namensbestandteile im Text vorkommen (beste Übereinstimmung). `ohne`: Wörter, die nicht zählen (z. B. Mitarbeiternamen). */
export function findeKunde(text: string, opts: { ohne?: string[] } = {}): Kunde | undefined {
  const ohne = new Set((opts.ohne ?? []).map(normalisieren));
  const w = new Set(nWoerter(text).filter((x) => !ohne.has(x)));
  let best: { k: Kunde; score: number } | undefined;
  for (const k of db.kunden.all()) {
    const teile = nWoerter(`${k.name} ${k.firma ?? ''}`).filter((x) => x.length >= 3 && !STOPP.has(x));
    const score = teile.filter((x) => w.has(x)).length;
    if (score > 0 && (!best || score > best.score)) best = { k, score };
  }
  return best?.k;
}

/** Vor- und Nachname eines Mitarbeiters – damit „Plane Jonas … bei Schneider“ Jonas nicht für einen Kunden hält */
export const namenVon = (m?: Mitarbeiter) => (m ? [m.vorname, m.nachname] : []);

export const stand = (k: Kontext) => `Stand ${uhrzeit(k.jetzt.toISOString())} Uhr`;

export const LAUFEND: Phase[] = ['in_arbeit', 'beauftragt', 'abnahme', 'abrechnung'];

/** Auftrag aus Auftragsnummer oder Kundenname – bevorzugt in der Reihenfolge von `phasen`, dann zuletzt geändert */
export function findeAuftrag(text: string, phasen: Phase[] = LAUFEND, opts: { ohne?: string[] } = {}): Auftrag | undefined {
  const nr = text.match(AUFTRAGSNUMMER_IM_TEXT);
  if (nr) return db.auftraege.where((a) => a.nummer.toLowerCase() === nr[0].toLowerCase())[0];
  const kunde = findeKunde(text, opts);
  if (!kunde) return undefined;
  return db.auftraege
    .where((a) => a.kundeId === kunde.id && phasen.includes(a.phase))
    .sort((a, b) => phasen.indexOf(a.phase) - phasen.indexOf(b.phase) || b.geaendertAm.localeCompare(a.geaendertAm))[0];
}

const sid = (n: number) => `s${n}`;

/** Nur Schritte, deren Aktion ein Modul anbietet – keine toten Knöpfe */
export function schritte(liste: Omit<PlanSchritt, 'id'>[]): PlanSchritt[] {
  return liste.filter((s) => !!aktionDef(s.aktion)).map((s, i) => ({ ...s, id: sid(i + 1) }));
}

export function planAntwort(absicht: string, text: string, plan: Plan, grundlage: string): Antwort {
  if (!plan.schritte.length) return { absicht: 'aktion-fehlt', text: 'Das kann Lotte in deinem Betrieb noch nicht ausführen.' };
  return {
    absicht,
    text,
    vorschlaege: [{ id: vid(), art: 'plan', label: plan.titel, plan, status: 'entwurf' }],
    grundlage,
  };
}

export const FRAGE = /^\s*(welche|wie\s?viele|wann|was|zeig|gibt es|sind|ist)\b/;
