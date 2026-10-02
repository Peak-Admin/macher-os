/**
 * Aufmerksamkeit: die persönliche Inbox als selbstreinigende Warteschlange – kein Archiv.
 *
 * Grundsatz: **Meldungen sind zustandsbehaftet, nicht archivarisch.** Die Inbox zeigt, was gerade deine
 * Aufmerksamkeit braucht. Was passiert ist, steht im Zeitstrahl des Objekts (`zeitstrahl`) und im
 * Ereignisprotokoll (`ereignisprotokoll`) – beides bleibt unabhängig von der Inbox vollständig erhalten.
 *
 * Vier Stufen (`Aufmerksamkeit`):
 * - `jetzt`       sofort – darf Push auslösen, bleibt, solange der Grund besteht
 * - `aktion`      du musst etwas tun – bleibt, bis erledigt, gelöst, geschlossen oder nicht mehr zuständig; nie wegen Alters weg
 * - `info`        zur Kenntnis – verfällt (Standard 48 h)
 * - `aktivitaet`  Systemaktivität – verfällt schnell (Standard 12 h), nur hinter „Letzte Aktivitäten“
 *
 * Alles Fachliche steht hier an EINER Stelle: Regeln je Ereignisart (`REGELN`), Einstufung, Lebensdauer,
 * Auflösung durch den Zustand des Objekts, Rechte, Später, Bündelung, Zähler und Push-Entscheidung.
 * Oberflächen entscheiden keine Geschäftsregeln – sie rufen `posteingang()` und die Aktionen hier.
 *
 * „Zustand schlägt Zeit“: Ob eine Meldung noch gilt, wird bei JEDEM Lesen aus dem aktuellen Objekt berechnet
 * (`zustand()`), zusätzlich beim Ändern des Objekts sofort vermerkt (`starteAufmerksamkeit`). So stimmt die Inbox
 * auch nach Offline-Zeit, auf anderen Geräten und in anderen Tabs, ohne dass ein Hintergrundjob laufen muss.
 */
import { aufloesen, db, sammlung } from './db';
import { einstellung, setzeEinstellung } from './einstellungen';
import { on, istDatenEreignis } from './events';
import { isoDatum } from './format';
import { darf, type Recht } from './session';
import { OBJEKT_LABEL, type Aufgabe, type Aufmerksamkeit, type Basis, type Benachrichtigung, type Bezug, type Datum, type ID, type MeldungsAktion, type Mitarbeiter, type Zeitpunkt } from './objects';

export type { Aufmerksamkeit, MeldungsAktion } from './objects';

// ------------------------------------------------------------------ Stufen

export const STUFEN: { id: Aufmerksamkeit; titel: string }[] = [
  { id: 'jetzt', titel: 'Jetzt' },
  { id: 'aktion', titel: 'Aktion nötig' },
  { id: 'info', titel: 'Zur Kenntnis' },
  { id: 'aktivitaet', titel: 'Aktivität' },
];

const RANG: Record<Aufmerksamkeit, number> = { jetzt: 4, aktion: 3, info: 2, aktivitaet: 1 };

export const hoechste = (a: Aufmerksamkeit, b: Aufmerksamkeit): Aufmerksamkeit => (RANG[a] >= RANG[b] ? a : b);

/** Standard-Lebensdauer in Stunden (nur `info` und `aktivitaet` verfallen) */
export const STANDARD_TTL_STUNDEN: Record<'info' | 'aktivitaet', number> = { info: 48, aktivitaet: 12 };

/** Wie lange erledigte, geschlossene oder verfallene Meldungen noch auf dem Gerät liegen (für Mehrfach-Zustellung) */
export const AUFBEWAHREN_TAGE = 14;

// ------------------------------------------------------------------ Regeln je Ereignisart

export interface Kontext {
  jetzt: Date;
  heute: Datum;
}

/** Einstufung – `ignorieren` = gar keine Meldung */
export type Einstufung = Aufmerksamkeit | 'ignorieren';

type O = Record<string, unknown> & Basis;

export interface ArtRegel {
  /** Klartext für Bündel und Digest (Einzahl, Mehrzahl) */
  wort: [string, string];
  /** Grundstufe, wenn `einstufen` nichts anderes sagt */
  stufe: Aufmerksamkeit;
  /** Lebensdauer in Stunden für `info`/`aktivitaet` (überschreibt den Standard) */
  ttlStunden?: number;
  /** auch zeitkritische `aktion` darf aufs Handy (`jetzt` immer) */
  push?: boolean;
  /** Einstufung nach Zustand – wird bei jedem Lesen neu berechnet (Aufgabe wird überfällig → `aktion`) */
  einstufen?: (o: O, k: Kontext) => Einstufung;
  /** Ist der Grund erledigt? (Angebot freigegeben, Rechnung bezahlt, Termin abgesagt …) */
  geloest?: (o: O, k: Kontext) => boolean;
  /** Ist der Empfänger noch zuständig? (Aufgabe delegiert, aus dem Auftrag genommen …) */
  zustaendig?: (o: O, empfaengerId: ID) => boolean;
  /** Recht, ohne das der Empfänger die Meldung nicht sieht */
  recht?: Recht;
  /** Direkte Aktionen je Objekt */
  aktionen?: (o: O) => MeldungsAktion[];
}

const feld = <T = unknown>(o: O, f: string) => o[f] as T;
/** Bezug auf eine echte Sammlung? (`takte` u. ä. sind nur Ziele, keine Objekte mit Zustand) */
const echtesObjekt = (b: Bezug | undefined) => !!b && !!sammlung(b.typ);
const auftragFertig = (o: O) => ['in_arbeit', 'abnahme', 'abrechnung', 'erledigt', 'verloren'].includes(feld<string>(o, 'phase'));
const terminVorbei = (o: O, k: Kontext) => ['abgesagt', 'erledigt'].includes(feld<string>(o, 'status')) || String(feld(o, 'ende') ?? feld(o, 'start') ?? '9999') < k.jetzt.toISOString();
const hatEinsatz = (auftragId: ID) => db.termine.all().some((t) => t.auftragId === auftragId && (t.art === 'einsatz' || t.art === 'wartung') && t.status !== 'abgesagt');
const hatRechnung = (auftragId: ID) => db.rechnungen.all().some((r) => r.auftragId === auftragId && r.status !== 'entwurf' && r.status !== 'storniert');

/**
 * Aufgaben nach Zustand (Beispiel der Regel-Engine):
 * angelegt → Aktivität · heute fällig → zur Kenntnis · überfällig → Aktion nötig ·
 * überfällig und blockiert einen kritischen Auftrag (dringend oder hohe Priorität) → Jetzt.
 */
export function aufgabeEinstufen(a: Pick<Aufgabe, 'faellig' | 'erledigt' | 'prioritaet' | 'auftragId'>, k: Kontext, opts: { zugewiesen?: boolean } = {}): Einstufung {
  if (a.erledigt) return 'ignorieren';
  const kritisch = a.prioritaet === 'hoch' || !!db.auftraege.get(a.auftragId)?.dringend;
  if (a.faellig && a.faellig < k.heute) return kritisch ? 'jetzt' : 'aktion';
  if (a.faellig === k.heute) return opts.zugewiesen ? 'aktion' : 'info';
  // von jemand anderem zugewiesen: einmal zur Kenntnis, danach steht sie in deiner Aufgabenliste
  return opts.zugewiesen ? 'info' : 'aktivitaet';
}

/**
 * Das Regelwerk. Neue Ereignisarten nur hier eintragen – nicht in Komponenten.
 * Ohne Eintrag gilt: `wichtig` → `aktion`, sonst `info` mit Standard-Lebensdauer.
 */
export const REGELN: Record<string, ArtRegel> = {
  // Kunden & Anfragen
  'anfrage.neu': {
    wort: ['neue Anfrage', 'neue Anfragen'],
    stufe: 'aktion',
    push: true,
    einstufen: (o) => (feld(o, 'dringend') ? 'jetzt' : 'aktion'),
    geloest: (o) => feld(o, 'phase') !== 'anfrage',
  },
  'anfrage.rueckruf': { wort: ['Rückruf', 'Rückrufe'], stufe: 'aktion', push: true, geloest: (o) => feld(o, 'phase') !== 'anfrage' },
  'nachricht.kunde': { wort: ['Kundennachricht', 'Kundennachrichten'], stufe: 'aktion', geloest: (o) => !!feld(o, 'gelesen') },
  'anruf.notfall': { wort: ['Notfall', 'Notfälle'], stufe: 'jetzt' },
  // Angebote
  'angebot.geoeffnet': { wort: ['Angebot geöffnet', 'Angebote geöffnet'], stufe: 'info', ttlStunden: 24, geloest: (o) => feld(o, 'status') !== 'versendet' },
  'angebot.abgelehnt': { wort: ['Angebot abgelehnt', 'Angebote abgelehnt'], stufe: 'info', ttlStunden: 72 },
  'angebot.antwort_offen': { wort: ['offene Kundenantwort', 'offene Kundenantworten'], stufe: 'aktion', push: true, geloest: (o) => ['angenommen', 'abgelehnt'].includes(feld<string>(o, 'status')) },
  'auftrag.einplanen': {
    wort: ['Auftrag zum Einplanen', 'Aufträge zum Einplanen'],
    stufe: 'aktion',
    geloest: (o) => auftragFertig(o) || hatEinsatz(o.id),
    aktionen: (o) => [{ id: 'auftrag.einplanen', label: 'Einplanen', primaer: true, payload: { auftragId: o.id } }],
  },
  'abnahme.rechnung': {
    wort: ['Schlussrechnung', 'Schlussrechnungen'],
    stufe: 'aktion',
    geloest: (o) => ['erledigt', 'verloren'].includes(feld<string>(o, 'phase')) || hatRechnung(o.id),
  },
  // Geld
  'zahlung.eingegangen': { wort: ['Zahlung', 'Zahlungen'], stufe: 'info', ttlStunden: 48, recht: 'geld' },
  // Team
  'abwesenheit.beantragt': {
    wort: ['Antrag', 'Anträge'],
    stufe: 'aktion',
    geloest: (o) => feld(o, 'status') !== 'beantragt',
    aktionen: (o) => [
      { id: 'abwesenheit.genehmigen', label: 'Genehmigen', primaer: true, payload: { id: o.id } },
      { id: 'abwesenheit.ablehnen', label: 'Ablehnen', payload: { id: o.id } },
    ],
  },
  'abwesenheit.bescheid': { wort: ['Bescheid', 'Bescheide'], stufe: 'info', ttlStunden: 72 },
  'abwesenheit.krank': { wort: ['Krankmeldung', 'Krankmeldungen'], stufe: 'info', ttlStunden: 48 },
  'termine.umplanen': { wort: ['Termin umplanen', 'Termine umplanen'], stufe: 'aktion', push: true, geloest: terminVorbei },
  'bewerbung.neu': { wort: ['Bewerbung', 'Bewerbungen'], stufe: 'aktion', recht: 'personal' },
  'unterweisung.bestaetigen': { wort: ['Unterweisung', 'Unterweisungen'], stufe: 'aktion' },
  // Aufgaben
  'aufgabe.zugewiesen': {
    wort: ['Aufgabe', 'Aufgaben'],
    stufe: 'info',
    ttlStunden: 72,
    einstufen: (o, k) => aufgabeEinstufen(o as unknown as Aufgabe, k, { zugewiesen: true }),
    geloest: (o) => !!feld(o, 'erledigt'),
    zustaendig: (o, id) => feld(o, 'zustaendigId') === id,
    aktionen: (o) => [{ id: 'aufgabe.erledigen', label: 'Erledigen', primaer: true, payload: { aufgabeId: o.id } }],
  },
  // Einsätze, Material, Sicherheit
  'material.fehlt': { wort: ['Material fehlt', 'Material fehlt'], stufe: 'jetzt' },
  'qualifikation.fehlt': { wort: ['Qualifikation fehlt', 'Qualifikationen fehlen'], stufe: 'aktion', geloest: terminVorbei },
  'werkzeug.fehlt': { wort: ['Werkzeug fehlt', 'Werkzeuge fehlen'], stufe: 'aktion', geloest: terminVorbei },
  'pruefung.ueberfaellig': {
    wort: ['Prüfung überfällig', 'Prüfungen überfällig'],
    stufe: 'jetzt',
    geloest: (o, k) => !feld(o, 'naechstePruefung') || String(feld(o, 'naechstePruefung')) >= k.heute || feld(o, 'status') === 'ausgemustert',
    zustaendig: (o, id) => feld(o, 'mitarbeiterId') === id,
  },
  'termin.online_gebucht': {
    wort: ['Online-Buchung', 'Online-Buchungen'],
    stufe: 'aktion',
    geloest: (o, k) => feld(o, 'status') !== 'geplant' || terminVorbei(o, k),
  },
  // Takte und Tagesinfos (Digests)
  takt: { wort: ['Tagesüberblick', 'Tagesüberblicke'], stufe: 'info', ttlStunden: 12 },
  'tag.termine': { wort: ['Tagesplan', 'Tagespläne'], stufe: 'info', ttlStunden: 14 },
  'tag.route': { wort: ['Route', 'Routen'], stufe: 'info', ttlStunden: 14 },
  // Systemaktivität – nie prominent
  'auftrag.schritt': { wort: ['Statuswechsel', 'Statuswechsel'], stufe: 'aktivitaet' },
  'datei.hochgeladen': { wort: ['Datei', 'Dateien'], stufe: 'aktivitaet', ttlStunden: 6 },
  'kommentar.neu': { wort: ['Kommentar', 'Kommentare'], stufe: 'aktivitaet' },
  'automation.erfolgreich': { wort: ['Automation erfolgreich', 'Automationen erfolgreich'], stufe: 'aktivitaet', ttlStunden: 6 },
};

export function regelFuer(art: string | undefined): ArtRegel | undefined {
  return art ? REGELN[art] : undefined;
}

/** Sammlungen, deren Meldungen nur mit dem Geld-Recht sichtbar sind (wie im Verlauf) */
const GELD_SAMMLUNGEN = new Set(['rechnungen', 'zahlungen', 'belege', 'mahnungen']);

// ------------------------------------------------------------------ Push-Anbindung

export interface PushAuftrag {
  anMitarbeiterId: ID;
  titel: string;
  text?: string;
  bezug?: Bezug;
  stufe: Aufmerksamkeit;
}

let pushVersand: ((p: PushAuftrag) => void) | undefined;

/** Push-Zustellung anbinden (Modul Benachrichtigungen: Ruhezeiten, Notdienst, Cloud) */
export function setzePushVersand(fn: typeof pushVersand) {
  pushVersand = fn;
}

/**
 * Push ist viel strenger als die Inbox: nur `jetzt` und ausdrücklich zeitkritische `aktion`.
 * Hierarchie: Aktivität → Digest → Inbox → Push.
 */
export function pushErlaubt(stufe: Aufmerksamkeit, regel?: ArtRegel): boolean {
  return stufe === 'jetzt' || (stufe === 'aktion' && !!regel?.push);
}

// ------------------------------------------------------------------ Zustand einer Meldung

export type MeldungsZustand = 'aktiv' | 'spaeter' | 'abgelaufen' | 'geloest' | 'geschlossen' | 'kein-zugriff' | 'ignoriert';

export const kontext = (jetzt: Date): Kontext => ({ jetzt, heute: isoDatum(jetzt) });

/** Bestandsdaten aus dem alten Gelesen-Modell sinnvoll einordnen */
function grundstufe(b: Benachrichtigung): Aufmerksamkeit {
  if (b.stufe) return b.stufe;
  // gelesene alte Meldungen sind gesehen – nur noch zur Kenntnis
  return b.wichtig && !b.gelesen ? 'aktion' : 'info';
}

/** Stufe jetzt – neu eingestuft nach dem aktuellen Zustand des Objekts */
export function aktuelleStufe(b: Benachrichtigung, jetzt = new Date()): Einstufung {
  const r = regelFuer(b.art);
  const o = aufloesen(b.bezug) as O | undefined;
  if (r?.einstufen && o) return r.einstufen(o, kontext(jetzt));
  return grundstufe(b);
}

/** Darf dieser Mensch die Meldung (noch) sehen? Rolle, Rechte und Aktiv-Status zählen beim Lesen, nicht beim Anlegen. */
export function darfSehen(m: Mitarbeiter | undefined, b: Pick<Benachrichtigung, 'bezug' | 'art' | 'fuerMitarbeiterId'>): boolean {
  if (!m) return true;
  if (!m.aktiv) return false;
  if (b.fuerMitarbeiterId && b.fuerMitarbeiterId !== m.id) return false;
  if (b.bezug && GELD_SAMMLUNGEN.has(b.bezug.typ) && !darf('geld', m)) return false;
  const r = regelFuer(b.art);
  if (r?.recht && !darf(r.recht, m)) return false;
  return true;
}

/**
 * Der Kern: Gilt diese Meldung gerade? Reihenfolge = Priorität.
 * Erledigt/geschlossen → Zugriff → Objekt weg → Grund gelöst → nicht mehr zuständig → Später → Lebensdauer.
 */
export function zustand(b: Benachrichtigung, jetzt = new Date(), m?: Mitarbeiter): MeldungsZustand {
  if (b.geschlossenAm || b.archiviert) return 'geschlossen';
  if (b.geloestAm || b.geloeschtAm) return 'geloest';
  if (m && !darfSehen(m, b)) return 'kein-zugriff';
  const r = regelFuer(b.art);
  const k = kontext(jetzt);
  if (echtesObjekt(b.bezug)) {
    const o = aufloesen(b.bezug) as O | undefined;
    // Objekt gelöscht (Papierkorb) oder auf diesem Gerät nicht mehr vorhanden → Meldung weg
    if (!o || o.geloeschtAm) return 'geloest';
    if (r?.geloest?.(o, k)) return 'geloest';
    if (r?.zustaendig && b.fuerMitarbeiterId && !r.zustaendig(o, b.fuerMitarbeiterId)) return 'geloest';
  }
  const stufe = aktuelleStufe(b, jetzt);
  if (stufe === 'ignorieren') return 'ignoriert';
  if (b.spaeterBis && b.spaeterBis > jetzt.toISOString()) return 'spaeter';
  // Lebensdauer gilt nur für Info und Aktivität – Aktionen verschwinden nicht wegen ihres Alters.
  // Ausnahme: ausdrücklich gesetztes Ende der Relevanz (z. B. Einsatz vorbei) – nicht bei live eingestuften Arten,
  // deren Ablauf nur die Info-Lebensdauer war (Aufgabe zur Kenntnis → später überfällig = Aktion).
  const leise = stufe === 'info' || stufe === 'aktivitaet';
  const verfaellt = leise || (!b.bisGeloest && !r?.einstufen);
  if (verfaellt && b.ablaufAm && b.ablaufAm <= jetzt.toISOString()) return 'abgelaufen';
  if ((stufe === 'info' || stufe === 'aktivitaet') && !b.ablaufAm) {
    // Bestandsdaten ohne Ablauf: Standard ab Anlage
    const ttl = (r?.ttlStunden ?? STANDARD_TTL_STUNDEN[stufe]) * 3_600_000;
    if (Date.parse(b.geaendertAm ?? b.erstelltAm) + ttl <= jetzt.getTime()) return 'abgelaufen';
  }
  return 'aktiv';
}

export const istAktiv = (b: Benachrichtigung, jetzt = new Date(), m?: Mitarbeiter) => zustand(b, jetzt, m) === 'aktiv';

// ------------------------------------------------------------------ Meldung erzeugen (eine Stelle für alle Module)

export interface MeldenOpts {
  /** Ereignisart aus `REGELN` – bestimmt Stufe, Lebensdauer, Auflösung und Aktionen */
  art?: string;
  text?: string;
  bezug?: Bezug;
  gruppe?: Bezug;
  /** Empfänger. Ohne Angabe: Chef und Büro (mit passendem Recht) – jeder bekommt seine eigene Meldung. */
  fuer?: ID | ID[];
  /** Stufe ausdrücklich setzen (sonst Regel, sonst `wichtig` → Aktion) */
  stufe?: Aufmerksamkeit;
  /** @deprecated nur ohne Regel: wichtig → `aktion` */
  wichtig?: boolean;
  grund?: string;
  gewicht?: number;
  aktionen?: MeldungsAktion[];
  /** Ereignis-ID der Quelle – Mehrfachzustellung derselben Quelle wird ignoriert */
  quelleId?: string;
  /** eigener Schlüssel zur Deduplizierung (Standard: Art + Objekt + Empfänger) */
  schluessel?: string;
  /** nicht mehr relevant ab (z. B. Einsatzbeginn) */
  ablaufAm?: Zeitpunkt;
  /** wer es ausgelöst hat – bekommt selbst nichts */
  ausloeser?: ID;
  /** nachts trotz Ruhezeit (Notdienst) */
  dringend?: boolean;
  jetzt?: Date;
}

/** Standard-Empfänger ohne Angabe: Chef und Büro */
function standardEmpfaenger(): Mitarbeiter[] {
  return db.mitarbeiter.where((m) => m.aktiv && (m.rolle === 'chef' || m.rolle === 'buero'));
}

function standardGrund(m: Mitarbeiter, ausdruecklich: boolean, art?: string): string {
  if (art === 'aufgabe.zugewiesen') return 'Die Aufgabe ist dir zugewiesen.';
  if (art === 'abwesenheit.beantragt') return 'Du bist für die Freigabe zuständig.';
  if (art === 'pruefung.ueberfaellig') return 'Das Gerät ist an dich ausgegeben.';
  if (ausdruecklich) return 'Das betrifft dich direkt.';
  return m.rolle === 'chef' ? 'Du bist Chef im Betrieb.' : 'Du bist im Büro zuständig.';
}

const plusStunden = (d: Date, h: number) => new Date(d.getTime() + h * 3_600_000).toISOString();

/**
 * Meldet etwas an die zuständigen Menschen – idempotent und spamfrei:
 * - nur mit echtem Grund (Empfänger ausdrücklich oder Chef/Büro), nie an den Auslöser, nur mit Zugriff
 * - schon gelöster Zustand (z. B. Antrag gleich wieder entschieden) → keine Meldung
 * - gleiche Quelle (`quelleId`) zweimal → einmal; gleiche Art + Objekt + Empfänger offen → zusammengefasst
 * - Push nur bei `jetzt` oder zeitkritischer `aktion`
 */
export function melden(titel: string, opts: MeldenOpts = {}): Benachrichtigung[] {
  const jetzt = opts.jetzt ?? new Date();
  const k = kontext(jetzt);
  const r = regelFuer(opts.art);
  const objekt = aufloesen(opts.bezug) as O | undefined;
  if (echtesObjekt(opts.bezug) && (!objekt || objekt.geloeschtAm)) return [];
  if (objekt && r?.geloest?.(objekt, k)) return [];
  const eingestuft: Einstufung = opts.stufe ?? (objekt && r?.einstufen ? r.einstufen(objekt, k) : (r?.stufe ?? (opts.wichtig ? 'aktion' : 'info')));
  if (eingestuft === 'ignorieren') return [];
  const stufe = eingestuft;
  const ausdruecklich = opts.fuer !== undefined;
  // Noch niemand im Büro (vor dem Onboarding): eine Meldung ohne Empfänger – sie gilt für Chef und Büro, sobald es sie gibt
  if (!ausdruecklich && !standardEmpfaenger().length) return [ohneEmpfaenger(titel, opts, stufe, r, objekt, jetzt)].filter((b): b is Benachrichtigung => !!b);
  const ids = ausdruecklich ? (Array.isArray(opts.fuer) ? opts.fuer : [opts.fuer]) : standardEmpfaenger().map((m) => m.id);
  const empfaenger = [...new Set(ids.filter((x): x is ID => !!x))]
    .filter((id) => id !== opts.ausloeser)
    .map((id) => db.mitarbeiter.get(id))
    .filter((m): m is Mitarbeiter => !!m && m.aktiv);
  // Jetzt/Aktion bleiben bis gelöst – außer der Aufrufer kennt das Ende der Relevanz (`ablaufAm`)
  const bisGeloest = (stufe === 'jetzt' || stufe === 'aktion') && !opts.ablaufAm;
  const ablaufAm = opts.ablaufAm ?? (stufe === 'jetzt' || stufe === 'aktion' ? undefined : plusStunden(jetzt, r?.ttlStunden ?? STANDARD_TTL_STUNDEN[stufe]));
  const aktionen = opts.aktionen ?? (objekt && r?.aktionen ? r.aktionen(objekt) : undefined);
  const ergebnis: Benachrichtigung[] = [];
  const meine = (id: ID) => db.benachrichtigungen.allMitGeloeschten().filter((b) => b.fuerMitarbeiterId === id);

  for (const m of empfaenger) {
    const probe = { bezug: opts.bezug, art: opts.art, fuerMitarbeiterId: m.id };
    if (!darfSehen(m, probe)) continue;
    if (objekt && r?.zustaendig && !r.zustaendig(objekt, m.id)) continue;
    const vorhanden = meine(m.id);
    // Idempotenz: dieselbe Quelle (Retry, doppelt zugestelltes Ereignis) nie zweimal
    if (opts.quelleId && vorhanden.some((b) => b.quelleId === opts.quelleId)) continue;
    const schluessel = opts.schluessel ?? `${opts.art ?? titel}|${opts.bezug ? `${opts.bezug.typ}:${opts.bezug.id}` : titel}|${m.id}`;
    const offen = vorhanden.find((b) => b.schluessel === schluessel && !b.geloestAm && !b.geschlossenAm && !b.geloeschtAm && zustand(b, jetzt) !== 'abgelaufen');
    if (offen) {
      // dasselbe Ereignis aus zwei Quellen kurz nacheinander (Datenereignis + fachliches Ereignis) zählt nicht doppelt
      const gleich = offen.titel === titel && Date.parse(offen.geaendertAm) > jetzt.getTime() - 10 * 60_000;
      const neu = db.benachrichtigungen.update(
        offen.id,
        {
          titel,
          text: opts.text ?? offen.text,
          stufe: hoechste(offen.stufe ?? stufe, stufe),
          anzahl: gleich ? offen.anzahl : (offen.anzahl ?? 1) + 1,
          ablaufAm: bisGeloest ? offen.ablaufAm : ablaufAm,
          quelleId: opts.quelleId ?? offen.quelleId,
          aktionen: aktionen ?? offen.aktionen,
        },
        { leise: true },
      );
      if (neu) ergebnis.push(neu);
      continue;
    }
    const b = db.benachrichtigungen.create(
      {
        titel,
        text: opts.text,
        bezug: opts.bezug,
        gruppe: opts.gruppe,
        fuerMitarbeiterId: m.id,
        art: opts.art,
        stufe,
        grund: opts.grund ?? standardGrund(m, ausdruecklich, opts.art),
        gewicht: opts.gewicht,
        aktionen,
        schluessel,
        quelleId: opts.quelleId,
        anzahl: 1,
        ablaufAm,
        bisGeloest: bisGeloest || undefined,
      },
      { leise: true },
    );
    ergebnis.push(b);
    if (pushErlaubt(stufe, r)) {
      try {
        pushVersand?.({ anMitarbeiterId: m.id, titel, text: opts.text, bezug: opts.bezug, stufe });
      } catch {
        /* Push ist Zugabe – die Inbox hat den Eintrag */
      }
    }
  }
  return ergebnis;
}

function ohneEmpfaenger(titel: string, opts: MeldenOpts, stufe: Aufmerksamkeit, r: ArtRegel | undefined, objekt: O | undefined, jetzt: Date): Benachrichtigung | undefined {
  const schluessel = opts.schluessel ?? `${opts.art ?? titel}|${opts.bezug ? `${opts.bezug.typ}:${opts.bezug.id}` : titel}|`;
  const alle = db.benachrichtigungen.allMitGeloeschten();
  if (opts.quelleId && alle.some((b) => b.quelleId === opts.quelleId)) return undefined;
  if (alle.some((b) => b.schluessel === schluessel && !b.fuerMitarbeiterId && zustand(b, jetzt) === 'aktiv')) return undefined;
  const dringlich = stufe === 'jetzt' || stufe === 'aktion';
  return db.benachrichtigungen.create(
    {
      titel,
      text: opts.text,
      bezug: opts.bezug,
      gruppe: opts.gruppe,
      art: opts.art,
      stufe,
      grund: opts.grund,
      aktionen: opts.aktionen ?? (objekt && r?.aktionen ? r.aktionen(objekt) : undefined),
      schluessel,
      quelleId: opts.quelleId,
      anzahl: 1,
      ablaufAm: opts.ablaufAm ?? (dringlich ? undefined : plusStunden(jetzt, r?.ttlStunden ?? STANDARD_TTL_STUNDEN[stufe as 'info' | 'aktivitaet'])),
      bisGeloest: (dringlich && !opts.ablaufAm) || undefined,
    },
    { leise: true },
  );
}

// ------------------------------------------------------------------ Handlungen des Empfängers

const isoJetzt = (jetzt?: Date) => (jetzt ?? new Date()).toISOString();

/** „Erledigt“/„Schließen“ – bewusst aus der Inbox nehmen (idempotent, auch von einem anderen Gerät) */
export function schliessen(ids: ID[], jetzt?: Date) {
  for (const id of ids) {
    const b = db.benachrichtigungen.get(id);
    if (b && !b.geschlossenAm) db.benachrichtigungen.update(id, { geschlossenAm: isoJetzt(jetzt) }, { leise: true });
  }
}

/** „Später“ – bis `bis` ausgeblendet; kommt nur wieder, wenn der Grund dann noch besteht */
export function spaeter(ids: ID[], bis: Zeitpunkt) {
  for (const id of ids) if (db.benachrichtigungen.get(id)) db.benachrichtigungen.update(id, { spaeterBis: bis }, { leise: true });
}

/** Grund ist erledigt (z. B. Aktion aus der Inbox ausgeführt) */
export function alsGeloest(ids: ID[], jetzt?: Date) {
  for (const id of ids) {
    const b = db.benachrichtigungen.get(id);
    if (b && !b.geloestAm) db.benachrichtigungen.update(id, { geloestAm: isoJetzt(jetzt) }, { leise: true });
  }
}

/** Live berechnete Hinweise („Braucht dich“) haben keinen Datensatz – „Später“ merkt sich je Person den Schlüssel */
const hinweisSpaeterKey = (mitarbeiterId: ID) => `aufmerksamkeit.spaeter.${mitarbeiterId}`;

export function hinweisSpaeter(mitarbeiterId: ID, schluessel: string, bis: Zeitpunkt) {
  const alt = einstellung<Record<string, Zeitpunkt>>(hinweisSpaeterKey(mitarbeiterId), {});
  const jetzt = new Date().toISOString();
  // Abgelaufenes gleich mit aufräumen
  const neu = Object.fromEntries(Object.entries(alt).filter(([, t]) => t > jetzt));
  setzeEinstellung(hinweisSpaeterKey(mitarbeiterId), { ...neu, [schluessel]: bis });
}

export function hinweisSpaeterBis(mitarbeiterId: ID | undefined): Record<string, Zeitpunkt> {
  return mitarbeiterId ? einstellung<Record<string, Zeitpunkt>>(hinweisSpaeterKey(mitarbeiterId), {}) : {};
}

// ------------------------------------------------------------------ Später: Zeitpunkte

export interface SpaeterOption {
  id: 'stunde' | 'nachmittag' | 'morgen' | 'woche';
  label: string;
  bis: Zeitpunkt;
}

/** „In 1 Stunde · Heute Nachmittag · Morgen · Nächste Woche“ (+ „Datum wählen“ in der Oberfläche) */
export function spaeterOptionen(jetzt = new Date()): SpaeterOption[] {
  const um = (tagePlus: number, stunde: number) => {
    const d = new Date(jetzt);
    d.setDate(d.getDate() + tagePlus);
    d.setHours(stunde, 0, 0, 0);
    return d.toISOString();
  };
  const liste: SpaeterOption[] = [{ id: 'stunde', label: 'In 1 Stunde', bis: new Date(jetzt.getTime() + 3_600_000).toISOString() }];
  if (jetzt.getHours() < 14) liste.push({ id: 'nachmittag', label: 'Heute Nachmittag', bis: um(0, 15) });
  liste.push({ id: 'morgen', label: 'Morgen früh', bis: um(1, 7) });
  const bisMontag = ((8 - jetzt.getDay()) % 7) || 7;
  liste.push({ id: 'woche', label: 'Nächste Woche', bis: um(bisMontag, 7) });
  return liste;
}

/** „Datum wählen“: an diesem Tag um 7 Uhr */
export function spaeterAm(datum: Datum): Zeitpunkt {
  return new Date(`${datum}T07:00:00`).toISOString();
}

// ------------------------------------------------------------------ Inbox zusammenstellen

/** Live-Hinweis aus „Braucht dich“ in der Form, die die Inbox braucht (keine Abhängigkeit zum Macher-Kern) */
export interface HinweisQuelle {
  schluessel: string;
  fuerMitarbeiterId?: ID;
  hinweisId?: ID;
  art: 'entscheidung' | 'freigabe' | 'problem' | 'info';
  titel: string;
  text?: string;
  bezug?: Bezug;
  gewicht: number;
  pfad?: string;
  sicherheit?: boolean;
  faellig?: string;
  aktionen?: { aktion: string; label: string; primaer?: boolean; payload?: unknown }[];
}

export interface InboxEintrag {
  schluessel: string;
  stufe: Aufmerksamkeit;
  titel: string;
  text?: string;
  grund?: string;
  zeit: Zeitpunkt;
  bezug?: Bezug;
  pfad?: string;
  art?: string;
  anzahl: number;
  gewicht: number;
  aktionen: MeldungsAktion[];
  /** Herkunft: gespeicherte Meldung(en) oder live berechneter Hinweis */
  quelle: { typ: 'meldung'; ids: ID[] } | { typ: 'hinweis'; schluessel: string; hinweisId?: ID };
}

export interface InboxGruppe {
  schluessel: string;
  /** Objekt, um das es geht („Auftrag Bad Müller“) – bei Einzeleinträgen der Eintrag selbst */
  titel: string;
  bezug?: Bezug;
  stufe: Aufmerksamkeit;
  eintraege: InboxEintrag[];
  /** „2 Kommentare · 1 Datei“ */
  zusammenfassung?: string;
  /** Eintrag, der eine Aktion braucht (wird hervorgehoben) */
  aktion?: InboxEintrag;
  zeit: Zeitpunkt;
}

export interface Inbox {
  jetzt: InboxGruppe[];
  aktion: InboxGruppe[];
  info: InboxGruppe[];
  /** nur hinter „Letzte Aktivitäten“ */
  aktivitaet: InboxEintrag[];
  /** zurückgestellt – nicht im Zähler */
  spaeter: InboxEintrag[];
  /** Zahl an der Glocke: nur aktuell relevante Einträge (Jetzt + Aktion nötig) */
  zaehler: number;
  /** Team-Hinweise, die nicht in die persönliche Inbox gehören – stehen in „Braucht dich“ */
  weitereHinweise: number;
}

/** Höchstens so viele Team-Hinweise in der persönlichen Inbox (Ziel: 0–7 Einträge) */
export const MAX_TEAM_HINWEISE = 5;
/** Ab diesem Gewicht ist ein Team-Hinweis wichtig genug für die persönliche Inbox */
export const HINWEIS_SCHWELLE = 70;

function hinweisStufe(h: HinweisQuelle): Aufmerksamkeit {
  if (h.art === 'info') return 'info';
  if (h.sicherheit || (h.art === 'problem' && h.gewicht >= 80)) return 'jetzt';
  return 'aktion';
}

/** Name eines Objekts für die Bündel-Überschrift – nur aus dem Objekt gelesen, nie kopiert */
export function objektName(b: Bezug | undefined): string | undefined {
  const o = aufloesen(b) as O | undefined;
  if (!b || !o) return undefined;
  const name = (feld<string>(o, 'titel') ?? feld<string>(o, 'name') ?? feld<string>(o, 'nummer')) || undefined;
  const label = (OBJEKT_LABEL as Record<string, string>)[b.typ];
  return name ? (label ? `${label} ${name}` : name) : label;
}

/** „2 Kommentare · 1 Datei · Termin umplanen“ aus den Arten einer Gruppe */
export function zusammenfassen(eintraege: Pick<InboxEintrag, 'art' | 'anzahl'>[]): string {
  const je = new Map<string, number>();
  for (const e of eintraege) {
    const r = regelFuer(e.art);
    const key = r ? e.art! : 'sonst';
    je.set(key, (je.get(key) ?? 0) + (e.anzahl || 1));
  }
  return [...je.entries()]
    .map(([art, n]) => {
      const r = REGELN[art];
      if (!r) return n === 1 ? '1 Update' : `${n} Updates`;
      return `${n} ${n === 1 ? r.wort[0] : r.wort[1]}`;
    })
    .join(' · ');
}

const bezugKey = (b: Bezug | undefined) => (b ? `${b.typ}:${b.id}` : undefined);

/**
 * Die persönliche Inbox – reine Funktion über Meldungen und Live-Hinweise.
 * Bündelt alles zum selben Objekt (Gruppe oder Bezug), hebt Aktionen hervor, sortiert nach Stufe, Gewicht, Zeit.
 */
export function posteingang(opts: {
  meldungen: Benachrichtigung[];
  hinweise?: HinweisQuelle[];
  ich: Mitarbeiter | undefined;
  jetzt?: Date;
  pfadZu?: (b: Bezug | undefined) => string | undefined;
}): Inbox {
  const jetzt = opts.jetzt ?? new Date();
  const iso = jetzt.toISOString();
  const ich = opts.ich;
  const aktiv: InboxEintrag[] = [];
  const spaeterListe: InboxEintrag[] = [];

  // 1. Live-Hinweise (Braucht dich): Zustand ist schon eingerechnet – sie verschwinden, sobald die Ursache weg ist
  const hinweisSpaeter = hinweisSpaeterBis(ich?.id);
  const hinweisBezuege = new Set<string>();
  const hinweisTitel = new Set<string>();
  // Nur mit echtem Grund: persönlich, Sicherheit oder wirklich wichtig – und dann nur die wichtigsten
  const persoenlich = (h: HinweisQuelle & { fuerMitarbeiterId?: ID }) => !!ich && h.fuerMitarbeiterId === ich.id;
  const kandidaten = [...(opts.hinweise ?? [])].sort((a, b) => b.gewicht - a.gewicht);
  const eigene = kandidaten.filter((h) => persoenlich(h) || h.sicherheit);
  const team = kandidaten.filter((h) => !persoenlich(h) && !h.sicherheit && h.gewicht >= HINWEIS_SCHWELLE).slice(0, MAX_TEAM_HINWEISE);
  const gewaehlt = [...eigene, ...team];
  const weitereHinweise = kandidaten.length - gewaehlt.length;
  for (const h of gewaehlt) {
    const stufe = hinweisStufe(h);
    const e: InboxEintrag = {
      schluessel: `hinweis:${h.schluessel}`,
      stufe,
      titel: h.titel,
      text: h.text,
      grund: h.art === 'freigabe' ? 'Deine Freigabe wird gebraucht.' : h.art === 'entscheidung' ? 'Deine Entscheidung wird gebraucht.' : undefined,
      zeit: h.faellig ?? iso,
      bezug: h.bezug,
      pfad: h.pfad ?? opts.pfadZu?.(h.bezug),
      anzahl: 1,
      gewicht: h.gewicht,
      aktionen: (h.aktionen ?? []).map((a) => ({ id: a.aktion, label: a.label, primaer: a.primaer, payload: a.payload })),
      quelle: { typ: 'hinweis', schluessel: h.schluessel, hinweisId: h.hinweisId },
    };
    if ((hinweisSpaeter[h.schluessel] ?? '') > iso) {
      spaeterListe.push(e);
      continue;
    }
    if (stufe !== 'info' && h.bezug) hinweisBezuege.add(bezugKey(h.bezug)!);
    // ohne Objekt: gleicher Titel = dasselbe Thema (z. B. Unterweisungen aus Modul und Erinnerung)
    if (stufe !== 'info') hinweisTitel.add(h.titel);
    aktiv.push(e);
  }

  // 2. Gespeicherte Meldungen – nur aktive; Zustand des Objekts schlägt die Zeit
  for (const b of opts.meldungen) {
    if (ich && b.fuerMitarbeiterId && b.fuerMitarbeiterId !== ich.id) continue;
    // Alte Meldungen ohne Empfänger gelten (wie Hinweise) für Chef und Büro
    if (ich && !b.fuerMitarbeiterId && ich.rolle !== 'chef' && ich.rolle !== 'buero') continue;
    const z = zustand(b, jetzt, ich);
    if (z !== 'aktiv' && z !== 'spaeter') continue;
    const stufe = aktuelleStufe(b, jetzt) as Aufmerksamkeit;
    // Hinweis zum selben Objekt ist die lebende Wahrheit – keine zweite Aktion daneben
    if ((stufe === 'jetzt' || stufe === 'aktion') && ((b.bezug && hinweisBezuege.has(bezugKey(b.bezug)!)) || hinweisTitel.has(b.titel))) continue;
    const e: InboxEintrag = {
      schluessel: `meldung:${b.id}`,
      stufe,
      titel: b.titel,
      text: b.text,
      grund: b.grund,
      zeit: b.geaendertAm ?? b.erstelltAm,
      bezug: b.bezug,
      pfad: opts.pfadZu?.(b.bezug) ?? opts.pfadZu?.(b.gruppe),
      art: b.art,
      anzahl: b.anzahl ?? 1,
      gewicht: b.gewicht ?? (stufe === 'jetzt' ? 90 : stufe === 'aktion' ? 60 : 30),
      aktionen: b.aktionen ?? [],
      quelle: { typ: 'meldung', ids: [b.id] },
    };
    (z === 'spaeter' ? spaeterListe : aktiv).push(e);
  }

  // 3. Bündeln nach Objekt (Gruppe vor Bezug) – Aktivität bleibt außen vor
  const gruppen = new Map<string, InboxGruppe>();
  const gruppeVon = (e: InboxEintrag) => {
    const m = e.quelle.typ === 'meldung' ? opts.meldungen.find((x) => x.id === (e.quelle as { ids: ID[] }).ids[0]) : undefined;
    return m?.gruppe ?? e.bezug;
  };
  const aktivitaet: InboxEintrag[] = [];
  for (const e of aktiv) {
    if (e.stufe === 'aktivitaet') {
      aktivitaet.push(e);
      continue;
    }
    const gb = gruppeVon(e);
    const key = bezugKey(gb) ?? e.schluessel;
    const g = gruppen.get(key);
    if (!g) gruppen.set(key, { schluessel: key, titel: e.titel, bezug: gb, stufe: e.stufe, eintraege: [e], zeit: e.zeit });
    else {
      g.eintraege.push(e);
      g.stufe = hoechste(g.stufe, e.stufe);
      if (e.zeit > g.zeit) g.zeit = e.zeit;
    }
  }
  for (const g of gruppen.values()) {
    g.eintraege.sort((a, b) => RANG[b.stufe] - RANG[a.stufe] || b.gewicht - a.gewicht || b.zeit.localeCompare(a.zeit));
    const updates = g.eintraege.reduce((s, e) => s + e.anzahl, 0);
    g.aktion = g.eintraege.find((e) => e.stufe === 'jetzt' || e.stufe === 'aktion');
    if (g.eintraege.length > 1 || updates > 1) {
      g.titel = objektName(g.bezug) ?? g.eintraege[0].titel;
      g.zusammenfassung = zusammenfassen(g.eintraege);
    }
  }
  const sortiert = (stufe: Aufmerksamkeit) =>
    [...gruppen.values()]
      .filter((g) => g.stufe === stufe)
      .sort((a, b) => Math.max(...b.eintraege.map((e) => e.gewicht)) - Math.max(...a.eintraege.map((e) => e.gewicht)) || b.zeit.localeCompare(a.zeit));
  const jetztG = sortiert('jetzt');
  const aktionG = sortiert('aktion');
  return {
    jetzt: jetztG,
    aktion: aktionG,
    info: sortiert('info').sort((a, b) => b.zeit.localeCompare(a.zeit)),
    aktivitaet: aktivitaet.sort((a, b) => b.zeit.localeCompare(a.zeit)),
    spaeter: spaeterListe.sort((a, b) => a.zeit.localeCompare(b.zeit)),
    zaehler: [...jetztG, ...aktionG].reduce((n, g) => n + g.eintraege.filter((e) => e.stufe === 'jetzt' || e.stufe === 'aktion').length, 0),
    weitereHinweise,
  };
}

// ------------------------------------------------------------------ Digest (Morgen, Tag, Woche)

export interface Digest {
  zeilen: string[];
  aktionNoetig: number;
}

/**
 * Bündelt nicht dringliche Meldungen seit einem Zeitpunkt („3 Zahlungen · 2 neue Anfragen …“).
 * Grundlage für Morgen-, Tages- und Wochenübersichten – die Inbox muss dafür nichts behalten.
 */
export function digest(meldungen: Benachrichtigung[], seit: Zeitpunkt, jetzt = new Date()): Digest {
  const neu = meldungen.filter((b) => b.erstelltAm >= seit && !b.geloeschtAm);
  const je = new Map<string, number>();
  let aktionNoetig = 0;
  for (const b of neu) {
    if (istAktiv(b, jetzt) && ['jetzt', 'aktion'].includes(aktuelleStufe(b, jetzt))) aktionNoetig++;
    const key = b.art && REGELN[b.art] ? b.art : 'sonst';
    je.set(key, (je.get(key) ?? 0) + (b.anzahl ?? 1));
  }
  const zeilen = [...je.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([art, n]) => (REGELN[art] ? `${n} ${n === 1 ? REGELN[art].wort[0] : REGELN[art].wort[1]}` : `${n} ${n === 1 ? 'Meldung' : 'Meldungen'}`));
  return { zeilen, aktionNoetig };
}

// ------------------------------------------------------------------ Abgleich und Aufräumen

/**
 * Zustand der offenen Meldungen festhalten: gelöste bekommen `geloestAm` (alle Geräte sehen das sofort),
 * alte inaktive werden vom Gerät entfernt. Der Zeitstrahl der Objekte bleibt unberührt.
 */
export function aufraeumen(jetzt = new Date(), opts: { nur?: Bezug } = {}): { geloest: number; entfernt: number } {
  let geloest = 0;
  let entfernt = 0;
  const grenze = new Date(jetzt.getTime() - AUFBEWAHREN_TAGE * 86_400_000).toISOString();
  for (const b of db.benachrichtigungen.allMitGeloeschten()) {
    if (opts.nur && (b.bezug?.typ !== opts.nur.typ || b.bezug?.id !== opts.nur.id)) continue;
    if (!b.geloestAm && !b.geschlossenAm && !b.archiviert) {
      const z = zustand(b, jetzt);
      if (z === 'geloest' || z === 'ignoriert') {
        db.benachrichtigungen.update(b.id, { geloestAm: jetzt.toISOString() }, { leise: true });
        geloest++;
        continue;
      }
    }
    if (opts.nur) continue;
    const ende = b.geloestAm ?? b.geschlossenAm ?? (zustand(b, jetzt) === 'abgelaufen' ? (b.ablaufAm ?? b.geaendertAm) : undefined) ?? (b.archiviert ? b.geaendertAm : undefined);
    if (ende && ende < grenze) {
      db.benachrichtigungen.purge(b.id);
      entfernt++;
    }
  }
  return { geloest, entfernt };
}

let gestartet: (() => void) | undefined;

/**
 * Ereignisgetrieben auflösen: Ändert sich ein Objekt (Angebot freigegeben, Rechnung bezahlt, Termin abgesagt,
 * Aufgabe delegiert), werden seine offenen Meldungen sofort geprüft – nicht erst, wenn jemand die Inbox öffnet.
 * Idempotent; läuft beim App-Start (`starteAutomationen`).
 */
export function starteAufmerksamkeit(): () => void {
  if (gestartet) return gestartet;
  const aus = on('*', (e) => {
    if (!istDatenEreignis(e) || e.sammlung === 'benachrichtigungen' || !e.objekt?.id || !e.sammlung) return;
    // das Objekt selbst und seine Eltern (ein neuer Termin erledigt „Auftrag einplanen“, eine Rechnung „Schlussrechnung“)
    const o = e.objekt as O;
    const betroffen = [
      `${e.sammlung}:${o.id}`,
      ...(['auftragId', 'rechnungId', 'kundeId'] as const).map((f) => (o[f] ? `${f === 'auftragId' ? 'auftraege' : f === 'rechnungId' ? 'rechnungen' : 'kunden'}:${o[f]}` : '')),
    ].filter(Boolean);
    const offen = db.benachrichtigungen.all().filter((b) => b.bezug && !b.geloestAm && !b.geschlossenAm && betroffen.includes(bezugKey(b.bezug)!));
    for (const bezug of new Set(offen.map((b) => bezugKey(b.bezug)!))) {
      const i = bezug.indexOf(':');
      const typ = bezug.slice(0, i);
      const id = bezug.slice(i + 1);
      try {
        aufraeumen(new Date(), { nur: { typ, id } as Bezug });
      } catch {
        /* z. B. Lesemodus – beim Lesen wird der Zustand ohnehin neu berechnet */
      }
    }
  });
  try {
    aufraeumen();
  } catch (err) {
    console.warn('Inbox: Aufräumen beim Start fehlgeschlagen', err);
  }
  gestartet = () => {
    aus();
    gestartet = undefined;
  };
  return gestartet;
}
