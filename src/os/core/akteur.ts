/**
 * Wer handelt gerade? – Akteur-Kontext für Audit, Ereignisse und Rechte.
 *
 * Standard ist der angemeldete Mensch (`quelle: 'user'`, `setAktuellerNutzer`). Automationen, Lotte (KI),
 * Importe und der Abgleich setzen ihren Kontext mit `alsAkteur`, damit der Verlauf am Objekt in Klartext zeigt,
 * wer etwas geändert hat („Rechnung erstellt durch Lotte“).
 *
 * Der Kontext gilt synchron für die Dauer von `fn`. Was ein Handler später (setTimeout, await) tut, läuft
 * wieder als Mensch – dafür dort erneut `alsAkteur` aufrufen.
 */
import type { AuditQuelle, ID } from './objects';

export type { AuditQuelle };

export interface Akteur {
  quelle: AuditQuelle;
  /** Automation-ID, Import-Name, „macher“ … (bei `user` leer – dann zählt `mitarbeiterId`) */
  id?: string;
  /** für wen gehandelt wird (Mensch, der freigegeben hat oder angemeldet ist) */
  mitarbeiterId?: ID;
  /** Anzeigename, z. B. Titel der Automation */
  name?: string;
}

const stapel: Akteur[] = [];
/** Automation, deren Event-Handler gerade registriert werden (siehe `on` in events.ts) */
let registrierend: Akteur | undefined;

/** Führt `fn` im Namen eines Akteurs aus: `alsAkteur({ quelle: 'automation', id: 'rechnungen.entwurf' }, () => …)` */
export function alsAkteur<T>(akteur: Akteur, fn: () => T): T {
  stapel.push(akteur);
  try {
    return fn();
  } finally {
    stapel.pop();
  }
}

/** Der innerste gesetzte Akteur (oder undefined = der angemeldete Mensch) */
export function aktuellerAkteur(): Akteur | undefined {
  return stapel[stapel.length - 1];
}

/**
 * Während `fn` registrierte Event-Handler (`on(...)`) laufen später automatisch als dieser Akteur.
 * Genutzt beim Start von Automationen – Module müssen dafür nichts tun.
 */
export function registriereAls<T>(akteur: Akteur, fn: () => T): T {
  const vorher = registrierend;
  registrierend = akteur;
  try {
    return fn();
  } finally {
    registrierend = vorher;
  }
}

export function registrierAkteur(): Akteur | undefined {
  return registrierend;
}

// ------------------------------------------------------------------ Änderungen mitschneiden (für Rückgängig)

const sammler: Set<ID>[] = [];

/** Sammelt die IDs aller Verlaufseinträge, die während `fn` entstehen (z. B. für „Rückgängig“ einer Lotte-Aktion). */
export function mitschneiden<T>(fn: () => T): { ergebnis: T; eintraege: ID[] } {
  const s = new Set<ID>();
  sammler.push(s);
  try {
    const ergebnis = fn();
    return { ergebnis, eintraege: [...s] };
  } finally {
    sammler.splice(sammler.indexOf(s), 1);
  }
}

/** Von der Datenschicht aufgerufen, wenn ein Verlaufseintrag entsteht */
export function eintragGemerkt(id: ID) {
  for (const s of sammler) s.add(id);
}
