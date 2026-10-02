/**
 * Gemeinsame Hilfen von „Macher fragen“: Namen, Kunden und Aufträge im Satz finden, Pläne bauen.
 * Eigene Datei, damit `assistent.ts` und `aktionen.ts` sie ohne Ringabhängigkeit nutzen.
 */
import { db } from '@core/db';
import { uhrzeit } from '@core/format';
import { aktionDef, type Plan, type PlanSchritt } from '@core/gateway';
import type { Auftrag, Kunde, Mitarbeiter, Phase } from '@core/objects';
import type { Antwort, Kontext } from './assistent';

export const klein = (t: string) => t.toLowerCase();
export const vid = () => Math.random().toString(36).slice(2, 10);
export const gross = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);

const STOPP = new Set(['familie', 'frau', 'herr', 'firma', 'gmbh', 'kg', 'ohg', 'gbr', 'und', 'der', 'die', 'das', 'von', 'e.k.']);

export function woerter(t: string) {
  return klein(t)
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Mitarbeiter, dessen Vor- oder Nachname als Wort im Text vorkommt */
export function findeMitarbeiter(text: string): Mitarbeiter | undefined {
  const w = new Set(woerter(text));
  const alle = db.mitarbeiter.where((m) => m.aktiv);
  return (
    alle.find((m) => w.has(klein(m.vorname)) && w.has(klein(m.nachname))) ??
    alle.find((m) => w.has(klein(m.vorname))) ??
    alle.find((m) => m.nachname.length > 2 && w.has(klein(m.nachname)))
  );
}

/** Kunde, dessen Namensbestandteile im Text vorkommen (beste Übereinstimmung) */
export function findeKunde(text: string): Kunde | undefined {
  const w = new Set(woerter(text));
  let best: { k: Kunde; score: number } | undefined;
  for (const k of db.kunden.all()) {
    const teile = woerter(`${k.name} ${k.firma ?? ''}`).filter((x) => x.length >= 3 && !STOPP.has(x));
    const score = teile.filter((x) => w.has(x)).length;
    if (score > 0 && (!best || score > best.score)) best = { k, score };
  }
  return best?.k;
}

export const stand = (k: Kontext) => `Stand ${uhrzeit(k.jetzt.toISOString())} Uhr`;

export const LAUFEND: Phase[] = ['in_arbeit', 'beauftragt', 'abnahme', 'abrechnung'];

/** Auftrag aus Auftragsnummer oder Kundenname – bevorzugt in der Reihenfolge von `phasen`, dann zuletzt geändert */
export function findeAuftrag(text: string, phasen: Phase[] = LAUFEND): Auftrag | undefined {
  const nr = text.match(/\bA-\d{4}-\d{3,4}\b/i);
  if (nr) return db.auftraege.where((a) => a.nummer.toLowerCase() === nr[0].toLowerCase())[0];
  const kunde = findeKunde(text);
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
  if (!plan.schritte.length) return { absicht: 'aktion-fehlt', text: 'Das kann Macher in deinem Betrieb noch nicht ausführen.' };
  return {
    absicht,
    text,
    vorschlaege: [{ id: vid(), art: 'plan', label: plan.titel, plan, status: 'entwurf' }],
    grundlage,
  };
}

export const FRAGE = /^\s*(welche|wie\s?viele|wann|was|zeig|gibt es|sind|ist)\b/;
