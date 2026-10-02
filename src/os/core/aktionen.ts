/**
 * Macher Action Engine – aus einem Satz wird eine geprüfte, nachvollziehbare und rücknehmbare Aktion.
 *
 * Ablauf: Eingabe → Absicht erkennen (Regeln, optional KI) → Objekte laden (Kunde/Auftrag/Mitarbeiter per Name)
 * → Rechte prüfen (`darf`) → vorbereiten → Vorschau → Freigabe (je nach Fähigkeitsklasse) → ausführen
 * (als Akteur „Macher“, Audit automatisch) → Ereignis `macher.aktion_ausgefuehrt` → Rückgängig.
 *
 * Module melden Befehle über `defineModul({ befehle: [...] })`. Ein Befehl baut auf bestehenden Modul-Aktionen
 * (`aktionen`) auf und ruft sie über `aktionAusfuehren` auf – keine Punkt-zu-Punkt-Aufrufe.
 *
 * Fähigkeitsklassen (Constitution): READ, WRITE, MONEY, PUBLICATION, DESTRUCTIVE.
 * - nur READ → Macher antwortet sofort,
 * - WRITE → Vorschau, ein Klick bestätigt,
 * - MONEY / PUBLICATION / DESTRUCTIVE → Vorschau mit ausdrücklicher Freigabe; nur mit dem passenden Recht.
 */
import { db } from './db';
import { alsAkteur, mitschneiden } from './akteur';
import { allesRueckgaengig } from './audit';
import { emit } from './events';
import { aktionVorhanden, alleModule, type Ton } from './modul';
import type { Auftrag, Bezug, Datum, ID, Kunde, Mitarbeiter, Phase } from './objects';
import type { Recht } from './session';

// ------------------------------------------------------------------ Typen

export type Klasse = 'READ' | 'WRITE' | 'MONEY' | 'PUBLICATION' | 'DESTRUCTIVE';

export const KLASSE_RECHT: Record<Klasse, Recht> = {
  READ: 'lesen',
  WRITE: 'schreiben',
  MONEY: 'geld',
  PUBLICATION: 'veroeffentlichen',
  DESTRUCTIVE: 'loeschen',
};

/** Klartext für die Vorschau – was bedeutet die Aktion? */
export const KLASSE_LABEL: Record<Klasse, string> = {
  READ: 'Nur ansehen',
  WRITE: 'Ändert Daten in Macher OS',
  MONEY: 'Betrifft Geld',
  PUBLICATION: 'Geht an Kunden oder Lieferanten',
  DESTRUCTIVE: 'Löscht Daten',
};

const RECHT_LABEL: Record<Recht, string> = {
  lesen: 'Ansehen',
  schreiben: 'Bearbeiten',
  planen: 'Einsätze planen',
  geld: 'Preise & Geld',
  veroeffentlichen: 'An Kunden senden',
  personal: 'Personaldaten',
  loeschen: 'Löschen',
  admin: 'Einstellungen',
};

export interface BefehlKontext {
  /** die Eingabe des Menschen */
  eingabe: string;
  heute: Datum;
  jetzt: Date;
  ich?: Mitarbeiter;
  darf: (r: Recht) => boolean;
}

export interface VorschauZeile {
  titel: string;
  untertitel?: string;
  pfad?: string;
  status?: { ton: Ton; text: string };
}

/** Antwort ohne Ausführung: Ergebnis einer Abfrage (READ) oder eine Rückfrage („Welcher Kunde?“) */
export interface BefehlAntwort {
  art: 'antwort';
  text: string;
  zeilen?: VorschauZeile[];
  grundlage?: string;
  folgefragen?: string[];
}

/** Vorbereitete Aktion – wird erst nach Bestätigung/Freigabe ausgeführt */
export interface BefehlEntwurf<P = unknown> {
  art: 'entwurf';
  /** ein Satz: was Macher tun wird */
  text: string;
  /** Überschrift der Vorschau */
  titel: string;
  zeilen?: VorschauZeile[];
  /** JSON-fähige Parameter für `ausfuehren` (der Entwurf wird im Verlauf gespeichert) */
  parameter: P;
  /** Klassen dieser konkreten Ausführung (Standard: die des Befehls) */
  klassen?: Klasse[];
  /** Beschriftung des Bestätigungsknopfs, z. B. „Rechnungsentwurf anlegen“ */
  bestaetigen?: string;
  /** zusätzlicher Hinweis in der Vorschau */
  hinweis?: string;
  /** was sich nicht zurückholen lässt („Gesendete Nachrichten bleiben gesendet.“) */
  endgueltig?: string;
  /** Textfelder, die der Mensch in der Vorschau noch anpassen kann – Schlüssel in `parameter` */
  felder?: { schluessel: string; label: string; mehrzeilig?: boolean }[];
}

export type BefehlErgebnis<P = unknown> = BefehlAntwort | BefehlEntwurf<P>;

export interface BefehlAusfuehrung {
  /** Klartext für die Erfolgsmeldung */
  text: string;
  /** wohin „Öffnen“ führt */
  pfad?: string;
  bezug?: Bezug;
  /** Links, die der Mensch noch öffnen muss (mailto:, WhatsApp …) – Macher OS versendet nichts selbst */
  oeffnen?: { label: string; url: string }[];
}

export interface Befehl<P = unknown> {
  /** eindeutige ID, z. B. `rechnung.fertig` */
  id: string;
  titel: string;
  beschreibung: string;
  /** Beispielsätze – für Hilfe, Tests und eine spätere KI-Erkennung */
  beispiele: string[];
  /** höchste Klassen, die der Befehl erreichen kann */
  klassen: Klasse[];
  /** weitere nötige Rechte, z. B. `planen` */
  rechte?: Recht[];
  /** benötigte Modul-Aktionen – fehlt eine, ist der Befehl nicht verfügbar */
  braucht?: string[];
  /** 0–1: Wie gut passt die Eingabe? (regelbasiert, ohne KI) */
  erkennen: (eingabe: string) => number;
  vorbereiten: (k: BefehlKontext) => BefehlErgebnis<P>;
  ausfuehren: (parameter: P, k: BefehlKontext) => BefehlAusfuehrung;
}

// ------------------------------------------------------------------ Registry

/** Alle verfügbaren Befehle (deren benötigte Aktionen registriert sind) */
export function alleBefehle(): (Befehl & { modulId: string })[] {
  return alleModule().flatMap((m) =>
    (m.befehle ?? []).filter((b) => (b.braucht ?? []).every((a) => aktionVorhanden(a))).map((b) => ({ ...(b as Befehl), modulId: m.id })),
  );
}

export function befehl(id: string): Befehl | undefined {
  return alleBefehle().find((b) => b.id === id);
}

// ------------------------------------------------------------------ Absicht erkennen

export const MINDEST_SICHERHEIT = 0.5;

export interface Erkennung {
  befehl: Befehl;
  sicherheit: number;
}

/** Regelbasiert: der Befehl mit der höchsten Sicherheit ab 0,5 */
export function erkenneBefehl(eingabe: string, befehle: Befehl[] = alleBefehle()): Erkennung | undefined {
  let best: Erkennung | undefined;
  for (const b of befehle) {
    let s = 0;
    try {
      s = b.erkennen(eingabe);
    } catch {
      s = 0;
    }
    if (s >= MINDEST_SICHERHEIT && (!best || s > best.sicherheit)) best = { befehl: b, sicherheit: s };
  }
  return best;
}

/**
 * Optionale KI-Anbindung: bekommt die Eingabe und die Befehle (ID, Titel, Beispiele) und nennt den passenden
 * Befehl. Keine Pakete, kein Schlüssel im Browser – ein Server-Adapter kann sich hier einhängen.
 */
export interface AbsichtsErkenner {
  readonly name: string;
  erkenne(eingabe: string, befehle: { id: string; titel: string; beispiele: string[] }[]): Promise<{ befehlId: string; sicherheit: number } | undefined>;
}

let kiErkenner: AbsichtsErkenner | undefined;

export function setzeAbsichtsErkenner(e: AbsichtsErkenner | undefined) {
  kiErkenner = e;
}

/** Erst Regeln; nur wenn die nichts finden und eine KI angebunden ist, fragt Macher die KI. */
export async function erkenneBefehlMitKi(eingabe: string): Promise<Erkennung | undefined> {
  const befehle = alleBefehle();
  const regel = erkenneBefehl(eingabe, befehle);
  if (regel || !kiErkenner) return regel;
  try {
    const r = await kiErkenner.erkenne(eingabe, befehle.map((b) => ({ id: b.id, titel: b.titel, beispiele: b.beispiele })));
    const b = r && befehle.find((x) => x.id === r.befehlId);
    return b && r.sicherheit >= MINDEST_SICHERHEIT ? { befehl: b, sicherheit: r.sicherheit } : undefined;
  } catch {
    return undefined;
  }
}

// ------------------------------------------------------------------ Freigabe

export type Freigabe = 'sofort' | 'bestaetigen' | 'freigeben';

/** Wie viel Zustimmung braucht eine Aktion dieser Klassen? */
export function freigabeStufe(klassen: Klasse[]): Freigabe {
  if (klassen.some((k) => k === 'MONEY' || k === 'PUBLICATION' || k === 'DESTRUCTIVE')) return 'freigeben';
  if (klassen.includes('WRITE')) return 'bestaetigen';
  return 'sofort';
}

/** Rechte, die für diese Klassen (und den Befehl) fehlen */
export function fehlendeRechte(klassen: Klasse[], darf: (r: Recht) => boolean, zusaetzlich: Recht[] = []): Recht[] {
  const noetig = [...new Set([...klassen.map((k) => KLASSE_RECHT[k]), ...zusaetzlich])];
  return noetig.filter((r) => !darf(r));
}

export function keinRechtText(fehlend: Recht[]): string {
  return `Dafür brauchst du die Freigabe ${fehlend.map((r) => `„${RECHT_LABEL[r]}“`).join(' und ')}. Frag deinen Chef oder das Büro.`;
}

export interface Vorbereitet<P = unknown> {
  befehl: Befehl<P>;
  ergebnis: BefehlErgebnis<P>;
  /** nur bei Entwürfen */
  klassen?: Klasse[];
  freigabe?: Freigabe;
}

/** Befehl vorbereiten – mit Rechteprüfung vor und nach dem Laden der Objekte */
export function befehlVorbereiten<P>(b: Befehl<P>, k: BefehlKontext): Vorbereitet<P> {
  const lesen = fehlendeRechte(['READ'], k.darf);
  if (lesen.length) return { befehl: b, ergebnis: { art: 'antwort', text: keinRechtText(lesen) } };
  // Rechte der höchsten Klasse vorab prüfen: niemand soll Vorschauen sehen, die er nicht ausführen dürfte
  const vorab = fehlendeRechte(b.klassen.filter((x) => x !== 'READ'), k.darf, b.rechte);
  if (vorab.length) {
    // z. B. ohne Geldrecht verrät Macher auch in der Vorschau keine Beträge
    return { befehl: b, ergebnis: { art: 'antwort', text: keinRechtText(vorab) } };
  }
  const ergebnis = b.vorbereiten(k);
  if (ergebnis.art === 'antwort') return { befehl: b, ergebnis };
  const klassen = ergebnis.klassen ?? b.klassen;
  return { befehl: b, ergebnis, klassen, freigabe: freigabeStufe(klassen) };
}

export class FreigabeFehlt extends Error {
  constructor(text: string) {
    super(text);
    this.name = 'FreigabeFehlt';
  }
}

export interface Ausgefuehrt extends BefehlAusfuehrung {
  /** Verlaufseinträge, die die Aktion erzeugt hat – Grundlage für „Rückgängig“ */
  eintraege: ID[];
  /** Zeitpunkt der Ausführung */
  am: string;
}

/**
 * Führt einen vorbereiteten Befehl aus. Prüft die Rechte erneut und verlangt die passende Freigabe:
 * `bestaetigt` für WRITE, `freigegeben` für MONEY/PUBLICATION/DESTRUCTIVE.
 * Läuft als Akteur „Macher“ im Auftrag des Menschen – der Verlauf zeigt „durch Macher“.
 */
export function befehlAusfuehren<P>(
  b: Befehl<P>,
  parameter: P,
  k: BefehlKontext,
  opts: { klassen?: Klasse[]; bestaetigt?: boolean; freigegeben?: boolean } = {},
): Ausgefuehrt {
  const klassen = opts.klassen ?? b.klassen;
  const fehlend = fehlendeRechte(klassen, k.darf, b.rechte);
  if (fehlend.length) throw new FreigabeFehlt(keinRechtText(fehlend));
  const stufe = freigabeStufe(klassen);
  if (stufe === 'bestaetigen' && !opts.bestaetigt && !opts.freigegeben) throw new FreigabeFehlt('Bitte bestätige die Aktion zuerst.');
  if (stufe === 'freigeben' && !opts.freigegeben) throw new FreigabeFehlt('Diese Aktion braucht deine ausdrückliche Freigabe.');
  for (const a of b.braucht ?? []) if (!aktionVorhanden(a)) throw new Error('Diese Aktion ist gerade nicht verfügbar.');
  const { ergebnis, eintraege } = alsAkteur({ quelle: 'ai', id: 'macher', mitarbeiterId: k.ich?.id, name: b.titel }, () => mitschneiden(() => b.ausfuehren(parameter, k)));
  emit({ typ: 'macher.aktion_ausgefuehrt', daten: { befehlId: b.id, klassen, aenderungen: eintraege.length, mitarbeiterId: k.ich?.id } });
  return { ...ergebnis, eintraege, am: new Date().toISOString() };
}

/** Alles zurücknehmen, was eine Ausführung geändert hat (soweit möglich) */
export function befehlRueckgaengig(eintraege: ID[]): { ok: number; fehler: string[] } {
  return allesRueckgaengig(eintraege);
}

// ------------------------------------------------------------------ Objekte aus Text finden

/** Kleinbuchstaben, Umlaute ausgeschrieben, Satzzeichen weg */
export function normalisieren(t: string): string {
  return t
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const woerter = (t: string) => normalisieren(t).split(' ').filter(Boolean);
const NAMENS_STOPP = new Set(['familie', 'frau', 'herr', 'firma', 'gmbh', 'kg', 'ohg', 'gbr', 'und', 'der', 'die', 'das', 'von', 'e', 'k', 'co', 'ag', 'baustelle']);

/** Mitarbeiter, dessen Vor- oder Nachname als Wort vorkommt (Vor- und Nachname zusammen zählt mehr) */
export function findeMitarbeiter(text: string, alle: Mitarbeiter[] = db.mitarbeiter.where((m) => m.aktiv)): Mitarbeiter | undefined {
  const w = new Set(woerter(text));
  const v = (m: Mitarbeiter) => normalisieren(m.vorname);
  const n = (m: Mitarbeiter) => normalisieren(m.nachname);
  return alle.find((m) => w.has(v(m)) && w.has(n(m))) ?? alle.find((m) => w.has(v(m))) ?? alle.find((m) => n(m).length > 2 && w.has(n(m)));
}

/** Kunde, dessen Namensbestandteile im Text vorkommen (beste Übereinstimmung); Mitarbeiternamen zählen nicht */
export function findeKunde(text: string, opts: { ohne?: string[] } = {}): Kunde | undefined {
  const ohne = new Set((opts.ohne ?? []).map(normalisieren));
  const w = new Set(woerter(text).filter((x) => !ohne.has(x)));
  let best: { k: Kunde; score: number } | undefined;
  for (const k of db.kunden.all()) {
    const teile = woerter(`${k.name} ${k.firma ?? ''}`).filter((x) => x.length >= 3 && !NAMENS_STOPP.has(x));
    const score = teile.filter((x) => w.has(x)).length;
    if (score > 0 && (!best || score > best.score)) best = { k, score };
  }
  return best?.k;
}

const OFFEN = (a: Auftrag) => a.phase !== 'erledigt' && a.phase !== 'verloren';

/**
 * Auftrag zu einer Eingabe: per Nummer (A-2026-0042), sonst der passendste offene Auftrag des Kunden.
 * `vorrang` legt fest, welche Schritte zuerst zählen (z. B. für die Rechnung: Abrechnung vor Abnahme).
 */
export function findeAuftrag(text: string, opts: { kundeId?: ID; vorrang?: Phase[]; nurOffen?: boolean } = {}): Auftrag | undefined {
  const nr = text.match(/\b[A-Z]{1,3}-\d{4}-\d{2,5}\b/i);
  if (nr) {
    const a = db.auftraege.where((x) => x.nummer.toLowerCase() === nr[0].toLowerCase())[0];
    if (a) return a;
  }
  if (!opts.kundeId) return undefined;
  const liste = db.auftraege.where((a) => a.kundeId === opts.kundeId && (opts.nurOffen === false || OFFEN(a)));
  if (!liste.length) return undefined;
  const w = new Set(woerter(text));
  const rang = (a: Auftrag) => {
    const i = opts.vorrang?.indexOf(a.phase) ?? -1;
    return i >= 0 ? opts.vorrang!.length - i : 0;
  };
  const titelTreffer = (a: Auftrag) => woerter(a.titel).filter((x) => x.length > 3 && w.has(x)).length;
  return [...liste].sort((a, b) => titelTreffer(b) - titelTreffer(a) || rang(b) - rang(a) || b.geaendertAm.localeCompare(a.geaendertAm))[0];
}
