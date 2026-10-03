/**
 * Macher AI Gateway – der einzige Weg von einer Eingabe (Text oder Sprache) zu einer Antwort oder Aktion.
 *
 * Kein Modul spricht direkt mit einem Modell. Module melden über `defineModul({ gateway })` nur an,
 * welche Absichten sie verstehen und welche Aktionen sie ausführen können. Der Gateway entscheidet zentral:
 *
 *   Verstehen → Routen → Kontext → Rechte → günstigste ausreichende Lane → strukturierte Aktion
 *   → Prüfen → Bestätigung (wenn nötig) → Ausführen → Protokoll
 *
 * Lanes: 0 = Regeln/Datenbank (kein Modell), 1 = Jev (Klassifikation), 2 = Luna (Standard-KI),
 * 3 = stärkeres Modell. Immer von unten nach oben. Ohne angeschlossenes Modell läuft alles in Lane 0.
 *
 * Ausgeführt wird immer im Namen von Lotte (`alsAkteur({ quelle: 'ai', id: 'macher' })`): Der Verlauf am Objekt zeigt
 * „durch Lotte“, und alles, was eine Aktion geändert hat, lässt sich über das Audit des Kerns zurücknehmen
 * (`nimmZurueck`). Es gibt keinen zweiten Weg für KI-Aktionen.
 *
 * Strategie: `docs/os/KI-GATEWAY.md`.
 */
import { alsAkteur, mitschneiden } from './akteur';
import { allesRueckgaengig } from './audit';
import { auditAusnehmen, defineCollection, vermerken } from './db';
import { einstellung, setzeEinstellung } from './einstellungen';
import { emit } from './events';
import { alleModule } from './modul';
import type { Basis, Bezug, Datum, ID, Mitarbeiter } from './objects';
import type { Recht } from './session';

// ------------------------------------------------------------------ Lanes und Kosten

export type Lane = 0 | 1 | 2 | 3;

export const LANES: Record<Lane, { name: string; zweck: string }> = {
  0: { name: 'Regeln', zweck: 'Datenbankabfragen, Filter, Berechnungen, Regeln' },
  1: { name: 'Jev', zweck: 'Absicht erkennen, klassifizieren, Namen und Daten herauslösen' },
  2: { name: 'Luna', zweck: 'Texte schreiben, zusammenfassen, Sprache verstehen' },
  3: { name: 'Stark', zweck: 'Komplexe Planung, große Dokumente – nur wenn nötig' },
};

/** Kostenrahmen: KI- und variable Infrastrukturkosten als Anteil vom Umsatz */
export const KOSTEN_GRENZEN = { ziel: 0.1, warnung: 0.15, grenze: 0.2 } as const;

export type KostenStufe = 'ok' | 'warnung' | 'grenze';

export function kostenStufe(anteil: number): KostenStufe {
  if (anteil >= KOSTEN_GRENZEN.grenze) return 'grenze';
  if (anteil >= KOSTEN_GRENZEN.warnung) return 'warnung';
  return 'ok';
}

/** Höchste erlaubte Lane je Kostenstufe: an der Grenze nur noch Regeln und Jev, bei Warnung kein starkes Modell. */
export function hoechsteLane(stufe: KostenStufe): Lane {
  return stufe === 'grenze' ? 1 : stufe === 'warnung' ? 2 : 3;
}

// ------------------------------------------------------------------ Risiko und Bestätigung

/**
 * lesen     – zeigen, zählen, suchen: ohne Bestätigung
 * schreiben – Notiz, Aufgabe, Zeit, Entwurf: je nach Einstellung kurz bestätigen (Standard: bestätigen)
 * kritisch  – senden, verschieben mit Kunde, bestellen, zahlen, Personaldaten, löschen: immer bestätigen
 */
export type Risiko = 'lesen' | 'schreiben' | 'kritisch';

const KRITISCHE_RECHTE: Recht[] = ['veroeffentlichen', 'loeschen', 'admin', 'personal'];

/** Das Risiko ist nie kleiner, als die nötigen Rechte es verlangen. */
export function risikoVon(angegeben: Risiko, rechte: Recht[] = []): Risiko {
  if (angegeben === 'kritisch' || rechte.some((r) => KRITISCHE_RECHTE.includes(r))) return 'kritisch';
  if (angegeben === 'schreiben' || rechte.some((r) => r !== 'lesen' && r !== 'geld')) return 'schreiben';
  return 'lesen';
}

/** Einstellung `ki.schreiben.direkt`: einfache Schreibaktionen ohne Rückfrage ausführen (Standard: aus). */
export function brauchtBestaetigung(risiko: Risiko, schreibenDirekt = einstellung('ki.schreiben.direkt', false)): boolean {
  if (risiko === 'lesen') return false;
  if (risiko === 'kritisch') return true;
  return !schreibenDirekt;
}

// ------------------------------------------------------------------ Kontext

export type Kanal = 'text' | 'sprache';

export interface GatewayKontext {
  heute: Datum;
  jetzt: Date;
  ich?: Mitarbeiter;
  /** dieselbe Rechteprüfung wie für den Menschen – KI-Recht = Handwerk-OS-Recht */
  darf: (r: Recht) => boolean;
  kanal?: Kanal;
  /** Anteil der KI-Kosten am Monatsbeitrag (0–1); fehlt er, misst der Gateway selbst (`kostenAnteilMonat`) */
  kostenAnteil?: number;
}

// ------------------------------------------------------------------ Absichten (Intent-Library)

export interface Erkennung {
  absicht: string;
  /** herausgelöste Namen, Daten, Beträge … */
  werte?: Record<string, unknown>;
  /** 0–1. Regeln liefern 1, Modelle ihre eigene Einschätzung. */
  sicherheit: number;
  /** wer erkannt hat */
  lane: Lane;
}

export interface AbsichtDef<A = unknown> {
  /** kanonische ID, z. B. `invoice.list`, `task.create` */
  id: string;
  titel: string;
  risiko: Risiko;
  /** nötige Rechte; fehlt eines, antwortet der Gateway mit „keine Berechtigung“ */
  rechte?: Recht[];
  /** kleinste Lane, die diese Absicht beantworten kann (Standard 0) */
  lane?: Lane;
  /**
   * Geht mit Regeln, wird mit einem Modell besser (z. B. Nachricht formulieren): Ist diese Lane angeschlossen und im
   * Kostenrahmen, schreibt das Modell; sonst bleibt es bei Lane 0. Fällt das Modell aus, ebenfalls Lane 0.
   */
  besserMit?: 2 | 3;
  /** Reihenfolge der Regelprüfung – kleiner zuerst (Standard 50) */
  rang?: number;
  /** Lane 0: Regel, die die Absicht ohne Modell erkennt */
  erkenne?: (text: string, k: GatewayKontext) => Omit<Erkennung, 'absicht' | 'lane' | 'sicherheit'> | boolean | undefined;
  /** Auffang-Absicht, wenn nichts anderes passt (z. B. Suche) */
  auffang?: boolean;
  /**
   * Nur gezielt erreichbar: `frage(text, k, { absicht: id })` aus einem Formular (z. B. „Positionen vorschlagen“).
   * Freie Sätze (Regeln, Jev) landen nie hier.
   */
  direkt?: boolean;
  /**
   * Minimum Necessary Context: nur diese Daten bekommt ein Modell zu sehen.
   * Ohne Angabe bekommt ein Modell keinen Unternehmenskontext.
   */
  kontext?: (e: Erkennung, k: GatewayKontext, text: string) => unknown;
  /** Antwort erzeugen (Lane 0: aus den Daten; ab Lane 2 mit `modellText`) */
  beantworte: (text: string, e: Erkennung, k: GatewayKontext, hilfe: { modellText?: string }) => A;
}

// ------------------------------------------------------------------ Aktionen

export interface AktionDef<D = unknown> {
  /** z. B. `task.create`, `invoice.send` */
  id: string;
  titel: string;
  risiko: Risiko;
  rechte?: Recht[];
  /**
   * Was sich nach dem Ausführen nicht zurückholen lässt („Gesendete Nachrichten bleiben gesendet.“).
   * Gesetzt → die Oberfläche bietet kein „Rückgängig“ an und zeigt den Satz in der Vorschau.
   */
  endgueltig?: string;
  /** Fehlertext oder `undefined`, wenn die Daten passen */
  pruefe?: (daten: D, k: GatewayKontext) => string | undefined;
  /** führt die Geschäftslogik aus – nie das Modell selbst. Für verständliche Fehler `AktionsFehler` werfen. */
  fuehreAus: (daten: D, k: GatewayKontext) => AktionsRueckgabe | Promise<AktionsRueckgabe>;
}

/** Link, den der Mensch nach dem Ausführen selbst öffnet (mailto:, WhatsApp …) */
export interface OeffnenLink {
  label: string;
  url: string;
}

export type AktionsRueckgabe = { bezug?: Bezug; text?: string; oeffnen?: OeffnenLink[] } | void;

/** Fehler mit einem Text, den der Mensch lesen darf („Für Familie Hoffmann ist keine E-Mail hinterlegt.“) */
export class AktionsFehler extends Error {}

/** Strukturierte Aktion, wie sie eine Regel oder ein Modell vorschlägt */
export interface Aktion<D = unknown> {
  aktion: string;
  daten: D;
  /** aus welcher Absicht sie entstand */
  absicht?: string;
  lane?: Lane;
  modell?: string;
  /** Titel des Plans, wenn die Aktion Teil eines Mehrschritt-Plans ist */
  plan?: string;
}

export interface GatewayBeitrag {
  absichten?: AbsichtDef<unknown>[];
  aktionen?: AktionDef<never>[];
}

// ------------------------------------------------------------------ Modelle (Lane 1–3)

/** Adapter für ein Modell. Ohne Adapter bleibt der Gateway in Lane 0. */
export interface ModellAdapter {
  lane: 1 | 2 | 3;
  name: string;
  verfuegbar(): boolean;
  /** Lane 1: Absicht aus einer festen Liste wählen */
  erkenne?(text: string, absichten: { id: string; titel: string }[]): Promise<Omit<Erkennung, 'lane'> | undefined>;
  /** Lane 2/3: Text erzeugen – bekommt nur den minimalen Kontext der Absicht */
  schreibe?(text: string, kontext: unknown): Promise<string>;
}

const modelle = new Map<Lane, ModellAdapter>();

// ------------------------------------------------------------------ Kostenmessung

/**
 * Bezugsgröße für den Kostenanteil: was der Betrieb im Monat für Handwerk OS zahlt (Cent, netto).
 * Platzhalter wie `src/content/preise.ts` – Einstellung `ki.abo.monatCent`.
 */
export const ABO_MONAT_CENT = 8900;

const monat = (d = new Date()) => d.toISOString().slice(0, 7);

/** Modellkosten des laufenden Monats buchen (die Adapter melden sie nach jedem Aufruf). */
export function kostenBuchen(cent: number, jetzt = new Date()) {
  if (!(cent > 0)) return;
  const key = `ki.kosten.${monat(jetzt)}`;
  setzeEinstellung(key, einstellung(key, 0) + cent);
}

export function kostenMonat(jetzt = new Date()): number {
  return einstellung(`ki.kosten.${monat(jetzt)}`, 0);
}

/** Anteil der KI-Kosten am Monatsbeitrag – steuert, welche Lanes noch erlaubt sind. */
export function kostenAnteilMonat(jetzt = new Date()): number {
  return kostenMonat(jetzt) / Math.max(1, einstellung('ki.abo.monatCent', ABO_MONAT_CENT));
}

export function registriereModell(m: ModellAdapter) {
  modelle.set(m.lane, m);
  return () => {
    if (modelle.get(m.lane) === m) modelle.delete(m.lane);
  };
}

function modellFuer(lane: Lane, k: GatewayKontext): ModellAdapter | undefined {
  if (lane === 0 || lane > hoechsteLane(kostenStufe(k.kostenAnteil ?? kostenAnteilMonat(k.jetzt)))) return undefined;
  const m = modelle.get(lane);
  return m?.verfuegbar() ? m : undefined;
}

/** Günstigste verfügbare Lane ab `mindestens` (oder `undefined`, wenn keine reicht). */
export function waehleLane(mindestens: Lane, k: GatewayKontext): Lane | undefined {
  if (mindestens === 0) return 0;
  for (let l = mindestens; l <= 3; l++) if (modellFuer(l as Lane, k)) return l as Lane;
  return undefined;
}

// ------------------------------------------------------------------ Registry

let eigene: GatewayBeitrag[] = [];

/** Für Tests und Kernfunktionen; Module melden sich über `defineModul({ gateway })` an. */
export function registriereGateway(b: GatewayBeitrag) {
  eigene.push(b);
  return () => {
    eigene = eigene.filter((x) => x !== b);
  };
}

function beitraege(): GatewayBeitrag[] {
  return [...alleModule().flatMap((m) => (m.gateway ? [m.gateway] : [])), ...eigene];
}

export function alleAbsichten(): AbsichtDef[] {
  return beitraege()
    .flatMap((b) => b.absichten ?? [])
    .sort((a, b) => (a.rang ?? 50) - (b.rang ?? 50));
}

export function alleAktionen(): AktionDef[] {
  return beitraege().flatMap((b) => (b.aktionen ?? []) as AktionDef[]);
}

export function aktionDef(id: string): AktionDef | undefined {
  return alleAktionen().find((a) => a.id === id);
}

// ------------------------------------------------------------------ Protokoll (Audit)

export type ProtokollErgebnis = 'beantwortet' | 'vorgeschlagen' | 'ausgefuehrt' | 'zurueckgenommen' | 'verweigert' | 'fehler';

export interface KiProtokoll extends Basis {
  mitarbeiterId?: ID;
  kanal: Kanal;
  /** was der Nutzer wollte (Originaltext) */
  eingabe?: string;
  /** was der Gateway verstanden hat */
  absicht?: string;
  sicherheit?: number;
  /** welche Aktion ausgeführt oder vorgeschlagen wurde */
  aktion?: string;
  bezug?: Bezug;
  lane: Lane;
  modell: string;
  bestaetigt?: boolean;
  /** Titel des Mehrschritt-Plans, zu dem die Aktion gehört */
  plan?: string;
  ergebnis: ProtokollErgebnis;
  grund?: string;
}

export const kiProtokoll = defineCollection<KiProtokoll>('ki-protokoll');
// Das KI-Protokoll ist selbst ein Protokoll – keine Feldänderungen im Verlauf am Objekt
auditAusnehmen('ki-protokoll');

/**
 * Das KI-Protokoll hält jede Frage und jede Aktion fest (Absicht, Lane, Modell, Bestätigung, Ablehnung) – für Kosten,
 * Qualität und Nachvollziehbarkeit der KI. Fachlich relevant ist nur eine ausgeführte Aktion: Sie geht als Ereignis
 * `macher.aktion_ausgefuehrt` (Katalog, Ereignisprotokoll, Webhooks) auf den Bus. Fragen, Vorschläge und Ablehnungen
 * bleiben im KI-Protokoll und landen nicht noch einmal im Ereignisprotokoll.
 */
function protokolliere(p: Omit<KiProtokoll, keyof Basis>, opt: { aenderungen?: number } = {}) {
  const eintrag = kiProtokoll.create(p, { leise: true });
  if (p.ergebnis === 'ausgefuehrt')
    emit({
      typ: 'macher.aktion_ausgefuehrt',
      ...(p.bezug ? { sammlung: p.bezug.typ, objekt: { id: p.bezug.id } as Basis } : {}),
      daten: { aktion: p.aktion, absicht: p.absicht, lane: p.lane, bestaetigt: p.bestaetigt, mitarbeiterId: p.mitarbeiterId, protokollId: eintrag.id, aenderungen: opt.aenderungen },
    });
  return eintrag;
}

// ------------------------------------------------------------------ Pipeline: Fragen

export type Verweigert = 'rechte' | 'unbekannt' | 'modell-fehlt';

export interface GatewayAntwort<A = unknown> {
  absicht?: AbsichtDef<A>;
  erkennung?: Erkennung;
  lane: Lane;
  modell: string;
  /** die Antwort der Absicht – fehlt bei `verweigert` */
  ergebnis?: A;
  verweigert?: Verweigert;
  /** fehlende Rechte bei `verweigert: 'rechte'` */
  fehlendeRechte?: Recht[];
  protokollId: ID;
}

/** Ab dieser Sicherheit gilt eine Modell-Erkennung; darunter fällt der Gateway auf die Auffang-Absicht zurück. */
export const MIN_SICHERHEIT = 0.7;

async function verstehe(text: string, absichten: AbsichtDef[], k: GatewayKontext): Promise<Erkennung | undefined> {
  // Lane 0: Regeln vor Modell
  for (const a of absichten) {
    const r = a.erkenne?.(text, k);
    if (r) return { absicht: a.id, sicherheit: 1, lane: 0, werte: typeof r === 'object' ? r.werte : undefined };
  }
  // Lane 1: günstige Klassifikation, nur wenn angeschlossen
  const jev = modellFuer(1, k);
  if (jev?.erkenne) {
    const e = await jev.erkenne(text, absichten.filter((a) => !a.auffang).map((a) => ({ id: a.id, titel: a.titel }))).catch(() => undefined);
    if (e && e.sicherheit >= MIN_SICHERHEIT && absichten.some((a) => a.id === e.absicht)) return { ...e, lane: 1 };
  }
  const auffang = absichten.find((a) => a.auffang);
  return auffang ? { absicht: auffang.id, sicherheit: 0, lane: 0 } : undefined;
}

/**
 * Vorbelegte Absicht aus einer kontextuellen Aktion („Mit Lotte vorbereiten“ am Angebot, an der Rechnung …) oder aus
 * einem Formular (`direkt`-Absichten wie „Positionen vorschlagen“): Die Oberfläche weiß schon, was gemeint ist und um
 * welches Objekt es geht – kein Raten aus dem Text. Rechte, Lane-Wahl, Protokoll und Bestätigung laufen genauso wie bei
 * einer getippten Frage.
 */
export interface Vorgabe {
  absicht: string;
  /** z. B. `{ bezug: { typ: 'angebote', id } }` – landet in `Erkennung.werte` */
  werte?: Record<string, unknown>;
}

/** Vorbelegte Absicht: kein Raten, die Regel liefert höchstens Werte; Werte der Vorgabe gehen vor. */
function gezielt(vorgabe: Vorgabe, text: string, absichten: AbsichtDef[], k: GatewayKontext): Erkennung | undefined {
  const a = absichten.find((x) => x.id === vorgabe.absicht);
  if (!a) return undefined;
  const r = a.erkenne?.(text, k);
  const ausRegel = r && typeof r === 'object' ? r.werte : undefined;
  const werte = ausRegel || vorgabe.werte ? { ...ausRegel, ...vorgabe.werte } : undefined;
  return { absicht: a.id, sicherheit: 1, lane: 0, werte };
}

/**
 * Eine Eingabe beantworten. Führt nie selbst etwas aus – Aktionen kommen als Vorschlag zurück.
 * `vorgabe`: gezielt diese Absicht beantworten (kontextuelle Aktionen, `direkt`-Absichten aus Formularen).
 * Freie Sätze erreichen `direkt`-Absichten nie.
 */
export async function frage<A = unknown>(text: string, k: GatewayKontext, vorgabe?: Vorgabe): Promise<GatewayAntwort<A>> {
  const kanal = k.kanal ?? 'text';
  const basis = { mitarbeiterId: k.ich?.id, kanal, eingabe: text };
  const absichten = alleAbsichten();
  // Vorgabe mit unbekannter Absicht: nicht raten, sondern „unbekannt“
  const e: Erkennung | undefined = vorgabe
    ? gezielt(vorgabe, text, absichten, k)
    : await verstehe(
        text,
        absichten.filter((a) => !a.direkt),
        k,
      );
  const def = e && (absichten.find((a) => a.id === e.absicht) as AbsichtDef<A> | undefined);

  if (!e || !def) {
    const p = protokolliere({ ...basis, lane: 0, modell: LANES[0].name, ergebnis: 'verweigert', grund: 'unbekannt' });
    return { lane: 0, modell: LANES[0].name, verweigert: 'unbekannt', protokollId: p.id };
  }

  const fehlend = (def.rechte ?? []).filter((r) => !k.darf(r));
  if (fehlend.length) {
    const p = protokolliere({ ...basis, absicht: def.id, sicherheit: e.sicherheit, lane: e.lane, modell: LANES[e.lane].name, ergebnis: 'verweigert', grund: `rechte:${fehlend.join(',')}` });
    return { absicht: def, erkennung: e, lane: e.lane, modell: LANES[e.lane].name, verweigert: 'rechte', fehlendeRechte: fehlend, protokollId: p.id };
  }

  let lane = waehleLane(def.lane ?? 0, k);
  if (lane === 0 && def.besserMit) lane = waehleLane(def.besserMit, k) ?? 0;
  if (lane === undefined) {
    const p = protokolliere({ ...basis, absicht: def.id, sicherheit: e.sicherheit, lane: e.lane, modell: LANES[e.lane].name, ergebnis: 'verweigert', grund: 'modell-fehlt' });
    return { absicht: def, erkennung: e, lane: e.lane, modell: LANES[e.lane].name, verweigert: 'modell-fehlt', protokollId: p.id };
  }

  let modellText: string | undefined;
  const m = modellFuer(lane, k);
  if (lane >= 2 && m?.schreibe) {
    modellText = await m.schreibe(text, def.kontext?.(e, k, text)).catch(() => undefined);
    if (modellText === undefined) {
      if ((def.lane ?? 0) >= 2) {
        const p = protokolliere({ ...basis, absicht: def.id, sicherheit: e.sicherheit, lane, modell: m.name, ergebnis: 'fehler', grund: 'modell-ausfall' });
        return { absicht: def, erkennung: e, lane, modell: m.name, verweigert: 'modell-fehlt', protokollId: p.id };
      }
      lane = 0; // Regeln reichen
    }
  }
  const modell = lane >= 2 && modellText !== undefined && m ? m.name : e.lane === 1 ? (modellFuer(1, k)?.name ?? LANES[1].name) : LANES[0].name;

  const ergebnis = def.beantworte(text, e, k, { modellText });
  const p = protokolliere({ ...basis, absicht: def.id, sicherheit: e.sicherheit, lane: Math.max(lane, e.lane) as Lane, modell, ergebnis: def.risiko === 'lesen' ? 'beantwortet' : 'vorgeschlagen' });
  return { absicht: def, erkennung: e, lane: Math.max(lane, e.lane) as Lane, modell, ergebnis, protokollId: p.id };
}

// ------------------------------------------------------------------ Pipeline: Ausführen

export type AusfuehrErgebnis =
  | {
      ok: true;
      bezug?: Bezug;
      text?: string;
      protokollId: ID;
      /** Verlaufseinträge (Audit), die die Aktion erzeugt hat – Grundlage für „Rückgängig“ (`nimmZurueck`) */
      eintraege: ID[];
      oeffnen?: OeffnenLink[];
      /** gesetzt, wenn sich die Aktion nicht zurücknehmen lässt */
      endgueltig?: string;
    }
  | { ok: false; grund: 'unbekannt' | 'rechte' | 'ungueltig' | 'bestaetigung' | 'fehler'; text: string; protokollId: ID };

/**
 * Eine strukturierte Aktion ausführen: Rechte → Prüfen → Bestätigung → Geschäftslogik → Protokoll.
 * `bestaetigt` setzt nur die Oberfläche, nachdem der Mensch „Senden“, „Anlegen“ … gedrückt hat.
 */
export async function fuehreAus<D>(a: Aktion<D>, k: GatewayKontext, opt: { bestaetigt?: boolean } = {}): Promise<AusfuehrErgebnis> {
  const basis = { mitarbeiterId: k.ich?.id, kanal: k.kanal ?? 'text', absicht: a.absicht, aktion: a.aktion, lane: a.lane ?? 0, modell: a.modell ?? LANES[a.lane ?? 0].name, bestaetigt: !!opt.bestaetigt, plan: a.plan } as const;
  const nein = (grund: Extract<AusfuehrErgebnis, { ok: false }>['grund'], text: string): AusfuehrErgebnis => {
    const p = protokolliere({ ...basis, ergebnis: grund === 'fehler' ? 'fehler' : 'verweigert', grund: grund === 'fehler' ? text : grund });
    return { ok: false, grund, text, protokollId: p.id };
  };

  const def = aktionDef(a.aktion) as AktionDef<D> | undefined;
  if (!def) return nein('unbekannt', `Die Aktion „${a.aktion}“ gibt es nicht.`);
  if ((def.rechte ?? []).some((r) => !k.darf(r))) return nein('rechte', 'Dafür fehlt dir die Berechtigung.');
  const fehler = def.pruefe?.(a.daten, k);
  if (fehler) return nein('ungueltig', fehler);
  if (brauchtBestaetigung(risikoVon(def.risiko, def.rechte)) && !opt.bestaetigt) return nein('bestaetigung', 'Bitte bestätige die Aktion zuerst.');

  try {
    // Als Lotte im Auftrag des Menschen: Audit zeigt „durch Lotte“, die Verlaufseinträge werden für „Rückgängig“
    // mitgeschnitten. Der Akteur gilt synchron – Aktionen, die nach einem `await` schreiben (Senden), sind `endgueltig`.
    const lauf = alsAkteur({ quelle: 'ai', id: 'macher', mitarbeiterId: k.ich?.id, name: def.titel }, () => mitschneiden(() => def.fuehreAus(a.daten, k)));
    const r = (await lauf.ergebnis) || {};
    const p = protokolliere({ ...basis, bezug: r.bezug, ergebnis: 'ausgefuehrt' }, { aenderungen: lauf.eintraege.length });
    if (r.bezug) vermerken(r.bezug, 'ki.aktion', `${def.titel} – über Lotte${opt.bestaetigt ? ', bestätigt' : ''}`, { protokollId: p.id });
    return { ok: true, bezug: r.bezug, text: r.text, protokollId: p.id, eintraege: lauf.eintraege, oeffnen: r.oeffnen, endgueltig: def.endgueltig };
  } catch (err) {
    if (err instanceof AktionsFehler) return nein('fehler', err.message);
    console.error(`Aktion ${a.aktion} fehlgeschlagen`, err);
    return nein('fehler', 'Das hat nicht geklappt. Versuche es erneut.');
  }
}

/**
 * Rückgängig: nimmt alles zurück, was eine (oder mehrere) Aktionen geändert haben – über das Audit des Kerns
 * (`allesRueckgaengig`, gleiche Sperren wie überall: festgeschriebene Rechnungen, Zahlungen …). Wird protokolliert.
 */
export function nimmZurueck(eintraege: ID[], k: Pick<GatewayKontext, 'ich' | 'kanal'>, bezug?: { aktion?: string; absicht?: string; plan?: string }): { ok: number; fehler: string[] } {
  const r = allesRueckgaengig(eintraege);
  protokolliere({
    mitarbeiterId: k.ich?.id,
    kanal: k.kanal ?? 'text',
    lane: 0,
    modell: LANES[0].name,
    bestaetigt: true,
    ...bezug,
    ergebnis: r.ok ? 'zurueckgenommen' : 'fehler',
    grund: r.fehler.length ? r.fehler.join(' ') : undefined,
  });
  return r;
}

// ------------------------------------------------------------------ Mehrschritt-Pläne

/**
 * Ein Satz wie „Der Auftrag ist fertig“ ergibt mehrere verbundene Aktionen.
 * Der Mensch sieht alle Schritte, wählt ab, was nicht passieren soll, und bestätigt einmal.
 * Jeder Schritt läuft trotzdem einzeln durch Rechte, Prüfung und Protokoll.
 */
export interface PlanSchritt<D = unknown> extends Aktion<D> {
  /** stabil innerhalb des Plans */
  id: string;
  /** Handlung in Handwerkersprache, z. B. „Rechnung vorbereiten“ */
  label: string;
  /** vorausgewählt? (Standard: ja) */
  an?: boolean;
  /** ein Textfeld in `daten`, das der Mensch vor dem Bestätigen ändern kann (z. B. die Nachricht an den Kunden) */
  textFeld?: { feld: string; label: string };
}

export interface Plan {
  titel: string;
  schritte: PlanSchritt[];
}

export interface SchrittPruefung {
  id: string;
  risiko: Risiko;
  erlaubt: boolean;
  /** warum nicht – in Klartext */
  grund?: string;
}

/** Vorab für die Oberfläche: Was darf, was geht, was ist kritisch? Ändert nichts und protokolliert nichts. */
export function pruefePlan(plan: Plan, k: GatewayKontext): SchrittPruefung[] {
  return plan.schritte.map((s) => {
    const def = aktionDef(s.aktion);
    if (!def) return { id: s.id, risiko: 'kritisch', erlaubt: false, grund: 'Diese Aktion gibt es in deinem Handwerk OS noch nicht.' };
    const risiko = risikoVon(def.risiko, def.rechte);
    if ((def.rechte ?? []).some((r) => !k.darf(r))) return { id: s.id, risiko, erlaubt: false, grund: 'Dafür fehlt dir die Berechtigung.' };
    const fehler = def.pruefe?.(s.daten as never, k);
    return fehler ? { id: s.id, risiko, erlaubt: false, grund: fehler } : { id: s.id, risiko, erlaubt: true };
  });
}

/** Höchstes Risiko der ausgewählten Schritte – bestimmt, wie deutlich die Bestätigung ist. */
export function planRisiko(pruefung: SchrittPruefung[], auswahl?: string[]): Risiko {
  const r = pruefung.filter((p) => p.erlaubt && (!auswahl || auswahl.includes(p.id))).map((p) => p.risiko);
  return r.includes('kritisch') ? 'kritisch' : r.includes('schreiben') ? 'schreiben' : 'lesen';
}

export type SchrittErgebnis = { id: string; label: string } & ({ status: 'uebersprungen' } | { status: 'ausgefuehrt'; ergebnis: AusfuehrErgebnis & { ok: true } } | { status: 'fehler'; ergebnis: AusfuehrErgebnis & { ok: false } });

/**
 * Ausgewählte Schritte der Reihe nach ausführen. Ein Fehler stoppt die übrigen Schritte nicht –
 * sie hängen fachlich nicht voneinander ab; das Ergebnis zeigt jeden Schritt einzeln.
 */
export async function fuehrePlanAus(plan: Plan, k: GatewayKontext, opt: { bestaetigt?: boolean; auswahl?: string[] } = {}): Promise<SchrittErgebnis[]> {
  const auswahl = opt.auswahl ?? plan.schritte.filter((s) => s.an !== false).map((s) => s.id);
  const ergebnisse: SchrittErgebnis[] = [];
  for (const s of plan.schritte) {
    if (!auswahl.includes(s.id)) {
      ergebnisse.push({ id: s.id, label: s.label, status: 'uebersprungen' });
      continue;
    }
    const r = await fuehreAus({ aktion: s.aktion, daten: s.daten, absicht: s.absicht, lane: s.lane, modell: s.modell, plan: plan.titel }, k, { bestaetigt: opt.bestaetigt });
    ergebnisse.push(r.ok ? { id: s.id, label: s.label, status: 'ausgefuehrt', ergebnis: r } : { id: s.id, label: s.label, status: 'fehler', ergebnis: r });
  }
  return ergebnisse;
}
