/**
 * Gemeinsame Ereignis-Architektur: Katalog, Ableitung, Ereignisprotokoll und Webhooks.
 *
 * - **Katalog** (`EREIGNISSE`): alle fachlichen Ereignisse mit deutschem Namen (`<objekt>.<partizip>`),
 *   Beschreibung, Objekttyp und englischem API-Namen für Webhooks (`quote.sent`).
 * - **Ableitung**: Der Kern leitet fachliche Ereignisse zentral aus Datenereignissen ab (`kunden.created` →
 *   `kunde.angelegt`, Rechnung auf „bezahlt“ → `rechnung.bezahlt`). Module müssen dafür nichts tun. Sendet ein
 *   Modul dasselbe Ereignis selbst (synchron neben der Änderung), wird die Ableitung verworfen – es kommt nur einmal an.
 * - **Ereignisprotokoll** (`ereignisprotokoll`): jedes fachliche Ereignis mit Zeit, Akteur und Quelle – Grundlage
 *   für Automationen, Benachrichtigungen, Integrationen, KI und Audit. Wird rotiert (Speicher begrenzt).
 * - **Webhooks** (`webhooks`, `webhook_auslieferungen`): Abos auf API-Namen und eine Auslieferungs-Warteschlange.
 *   Den Versand übernimmt ein austauschbarer Versender (`setzeWebhookVersender`) – im Browser keiner, später der Server.
 */
import { aktuellerNutzerId, aufloesen, db, defineCollection, vergessen } from './db';
import { aktuellerAkteur, alsAkteur, type Akteur } from './akteur';
import { emit, istDatenEreignis, kuerzlichGesendet, on, type DbEvent } from './events';
import type { AuditQuelle, Basis, Bezug, ID, SammlungsName, Zeitpunkt } from './objects';

// ------------------------------------------------------------------ Katalog

export interface EreignisArt {
  /** deutscher Name `<objekt>.<partizip>` – so heißt das Event im Bus (`on('rechnung.bezahlt', …)`) */
  typ: string;
  /** Klartext für Oberflächen („Rechnung bezahlt“) */
  titel: string;
  beschreibung: string;
  /** Sammlung des betroffenen Objekts */
  objekt: SammlungsName;
  /** englischer Name für Webhooks und API (`invoice.paid`) */
  api: string;
  /** woher das Ereignis kommt: vom Kern abgeleitet, von Modulen gesendet oder aus der Fristprüfung */
  herkunft: 'abgeleitet' | 'modul' | 'frist';
}

const art = (typ: string, titel: string, objekt: SammlungsName, api: string, herkunft: EreignisArt['herkunft'], beschreibung: string): EreignisArt => ({ typ, titel, objekt, api, herkunft, beschreibung });

export const EREIGNISSE: EreignisArt[] = [
  art('kunde.angelegt', 'Kunde angelegt', 'kunden', 'customer.created', 'abgeleitet', 'Ein neuer Kunde steht in der Kundenliste.'),
  art('kunde.geaendert', 'Kunde geändert', 'kunden', 'customer.updated', 'abgeleitet', 'Angaben eines Kunden haben sich geändert.'),
  art('kunde.zusammengefuehrt', 'Kunden zusammengeführt', 'kunden', 'customer.merged', 'modul', 'Zwei doppelte Kunden wurden zu einem zusammengeführt.'),
  art('anfrage.eingegangen', 'Anfrage eingegangen', 'auftraege', 'request.created', 'abgeleitet', 'Eine neue Anfrage ist da (Telefon, Website, E-Mail …).'),
  art('auftrag.angelegt', 'Auftrag angelegt', 'auftraege', 'job.created', 'abgeleitet', 'Ein neuer Vorgang ist angelegt – auch wenn er als Anfrage beginnt.'),
  art('auftrag.schritt_gewechselt', 'Auftrag im nächsten Schritt', 'auftraege', 'job.stage_changed', 'abgeleitet', 'Ein Auftrag ist in einen anderen Schritt gewechselt (z. B. von Angebot zu Beauftragt).'),
  art('auftrag.eingeplant', 'Auftrag eingeplant', 'termine', 'job.scheduled', 'abgeleitet', 'Für einen Auftrag ist ein Einsatz im Plan.'),
  art('auftrag.gestartet', 'Auftrag begonnen', 'auftraege', 'job.started', 'abgeleitet', 'Die Arbeit an einem Auftrag hat begonnen.'),
  art('auftrag.abgeschlossen', 'Auftrag abgeschlossen', 'auftraege', 'job.completed', 'abgeleitet', 'Ein Auftrag ist erledigt.'),
  art('auftrag.verloren', 'Auftrag nicht zustande gekommen', 'auftraege', 'job.lost', 'abgeleitet', 'Ein Vorgang ist nicht zustande gekommen.'),
  art('termin.angelegt', 'Termin angelegt', 'termine', 'appointment.created', 'abgeleitet', 'Ein Termin steht im Kalender.'),
  art('termin.abgesagt', 'Termin abgesagt', 'termine', 'appointment.cancelled', 'abgeleitet', 'Ein Termin wurde abgesagt.'),
  art('einsatz.gestartet', 'Einsatz gestartet', 'termine', 'visit.started', 'modul', 'Ein Monteur hat einen Einsatz vor Ort begonnen.'),
  art('einsatz.beendet', 'Einsatz beendet', 'termine', 'visit.completed', 'modul', 'Ein Monteur hat einen Einsatz beendet.'),
  art('einsatz.problem_gemeldet', 'Problem beim Einsatz gemeldet', 'termine', 'visit.issue_reported', 'modul', 'Ein Monteur hat vom Einsatz ein Problem an Chef und Büro gemeldet.'),
  art('abnahme.unterschrieben', 'Abnahme unterschrieben', 'abnahmen', 'job.signed_off', 'modul', 'Der Kunde hat die Abnahme unterschrieben.'),
  art('bericht.unterschrieben', 'Bericht unterschrieben', 'berichte', 'report.signed', 'modul', 'Der Kunde hat einen Baustellen- oder Arbeitsbericht unterschrieben.'),
  art('angebot.erstellt', 'Angebot erstellt', 'angebote', 'quote.created', 'abgeleitet', 'Ein Angebot ist als Entwurf angelegt.'),
  art('angebot.versendet', 'Angebot versendet', 'angebote', 'quote.sent', 'abgeleitet', 'Ein Angebot ist beim Kunden.'),
  art('angebot.angenommen', 'Angebot angenommen', 'angebote', 'quote.accepted', 'abgeleitet', 'Der Kunde hat das Angebot angenommen.'),
  art('angebot.abgelehnt', 'Angebot abgelehnt', 'angebote', 'quote.declined', 'abgeleitet', 'Der Kunde hat das Angebot abgelehnt.'),
  art('rechnung.erstellt', 'Rechnung erstellt', 'rechnungen', 'invoice.created', 'abgeleitet', 'Eine Rechnung ist als Entwurf angelegt.'),
  art('rechnung.versendet', 'Rechnung versendet', 'rechnungen', 'invoice.sent', 'abgeleitet', 'Eine Rechnung ist festgeschrieben und beim Kunden.'),
  art('rechnung.bezahlt', 'Rechnung bezahlt', 'rechnungen', 'invoice.paid', 'abgeleitet', 'Eine Rechnung ist vollständig bezahlt.'),
  art('rechnung.storniert', 'Rechnung storniert', 'rechnungen', 'invoice.cancelled', 'abgeleitet', 'Eine Rechnung wurde storniert.'),
  art('rechnung.ueberfaellig', 'Rechnung überfällig', 'rechnungen', 'invoice.overdue', 'frist', 'Eine Rechnung ist nach dem Fälligkeitsdatum noch offen.'),
  art('mahnung.versendet', 'Mahnung versendet', 'mahnungen', 'dunning.sent', 'modul', 'Eine Zahlungserinnerung oder Mahnung ging an den Kunden.'),
  art('zahlung.eingegangen', 'Zahlung eingegangen', 'zahlungen', 'payment.received', 'abgeleitet', 'Geld ist eingegangen und einer Rechnung zugeordnet.'),
  art('aufgabe.angelegt', 'Aufgabe angelegt', 'aufgaben', 'task.created', 'abgeleitet', 'Eine Aufgabe ist angelegt.'),
  art('aufgabe.erledigt', 'Aufgabe erledigt', 'aufgaben', 'task.completed', 'abgeleitet', 'Eine Aufgabe ist abgehakt.'),
  art('mitarbeiter.angelegt', 'Mitarbeiter angelegt', 'mitarbeiter', 'employee.created', 'abgeleitet', 'Ein neuer Mitarbeiter ist im Team.'),
  art('mitarbeiter.abwesend', 'Mitarbeiter abwesend', 'abwesenheiten', 'employee.absent', 'abgeleitet', 'Eine Abwesenheit (Urlaub, Krankheit …) steht fest.'),
  art('zeit.freigegeben', 'Zeiten freigegeben', 'zeiten', 'time_entry.approved', 'modul', 'Arbeitszeiten wurden für die Lohnabrechnung freigegeben.'),
  art('material.knapp', 'Material knapp', 'artikel', 'material.low_stock', 'abgeleitet', 'Ein Lagerartikel ist unter den Mindestbestand gefallen.'),
  art('nachricht.eingegangen', 'Nachricht eingegangen', 'nachrichten', 'message.received', 'abgeleitet', 'Ein Kunde hat geschrieben oder angerufen.'),
  art('anruf.angenommen', 'Anruf von Macher angenommen', 'nachrichten', 'call.answered', 'modul', 'Der Telefonassistent hat einen Anruf angenommen und eingetragen.'),
  art('anruf.notfall_weitergeleitet', 'Notfall an Bereitschaft weitergegeben', 'nachrichten', 'call.emergency_forwarded', 'modul', 'Der Telefonassistent hat einen Notfall an die Bereitschaft weitergegeben.'),
  art('beleg.erfasst', 'Beleg erfasst', 'belege', 'bill.created', 'abgeleitet', 'Eine Eingangsrechnung oder Quittung ist erfasst.'),
  art('bestellung.angelegt', 'Bestellung angelegt', 'bestellungen', 'purchase_order.created', 'abgeleitet', 'Eine Materialbestellung ist angelegt.'),
  art('reklamation.eingegangen', 'Reklamation eingegangen', 'reklamationen', 'complaint.created', 'abgeleitet', 'Ein Kunde hat etwas reklamiert.'),
  art('dokument.versendet', 'Dokument versendet', 'dokumente', 'document.sent', 'modul', 'Ein Dokument (Angebot, Rechnung, Bericht) ging an den Kunden.'),
  art('dokument.erstellt', 'Dokument erstellt', 'geschaeftsdokumente', 'document.created', 'modul', 'Eine Auftragsbestätigung oder ein Lieferschein ist angelegt.'),
  art('auftragsbestaetigung.versendet', 'Auftragsbestätigung versendet', 'geschaeftsdokumente', 'order_confirmation.sent', 'modul', 'Eine Auftragsbestätigung ging an den Kunden.'),
  art('lieferschein.versendet', 'Lieferschein versendet', 'geschaeftsdokumente', 'delivery_note.sent', 'modul', 'Ein Lieferschein ging an den Kunden.'),
  art('lieferschein.unterschrieben', 'Lieferschein unterschrieben', 'geschaeftsdokumente', 'delivery_note.signed', 'modul', 'Der Kunde hat den Empfang auf dem Lieferschein bestätigt.'),
  art('portal.geoeffnet', 'Kundenbereich geöffnet', 'kunden', 'portal.opened', 'modul', 'Ein Kunde hat seinen Kundenbereich geöffnet.'),
  art('team.eingeladen', 'Team eingeladen', 'mitarbeiter', 'team.invited', 'modul', 'Mitarbeiter wurden zu Handwerk OS eingeladen.'),
  art('team.beigetreten', 'Mitarbeiter beigetreten', 'mitarbeiter', 'team.joined', 'modul', 'Ein Mitarbeiter hat sich angemeldet.'),
  art('import.abgeschlossen', 'Import abgeschlossen', 'importe', 'import.completed', 'modul', 'Ein Datenimport ist fertig (Excel/CSV, DATANORM, GAEB).'),
  art('import.rueckgaengig', 'Import rückgängig gemacht', 'importe', 'import.reverted', 'modul', 'Ein Datenimport wurde zurückgenommen.'),
  art('formular.ausgefuellt', 'Formular ausgefüllt', 'eigeneFormulare', 'form.completed', 'modul', 'Ein eigenes Formular wurde an einem Kunden, Auftrag oder Ort ausgefüllt.'),
  art('macher.aktion_ausgefuehrt', 'Macher hat etwas erledigt', 'ki-protokoll', 'assistant.action_executed', 'modul', 'Macher hat nach deiner Bestätigung eine Aktion über den Gateway ausgeführt (Bezug: das geänderte Objekt).'),
];

/** Gruppe für Auswahllisten (Webhooks, Automationen) – nach dem Objekt des Ereignisses */
const GRUPPEN: Record<string, string> = {
  kunde: 'Kunden und Anfragen',
  anfrage: 'Kunden und Anfragen',
  nachricht: 'Kunden und Anfragen',
  anruf: 'Kunden und Anfragen',
  reklamation: 'Kunden und Anfragen',
  portal: 'Kunden und Anfragen',
  angebot: 'Angebote',
  auftrag: 'Aufträge und Einsätze',
  termin: 'Aufträge und Einsätze',
  einsatz: 'Aufträge und Einsätze',
  abnahme: 'Aufträge und Einsätze',
  bericht: 'Aufträge und Einsätze',
  aufgabe: 'Aufträge und Einsätze',
  rechnung: 'Geld',
  zahlung: 'Geld',
  mahnung: 'Geld',
  beleg: 'Geld',
  dokument: 'Dokumente',
  auftragsbestaetigung: 'Dokumente',
  lieferschein: 'Dokumente',
  mitarbeiter: 'Team',
  team: 'Team',
  zeit: 'Team',
  material: 'Material',
  bestellung: 'Material',
};

/** `rechnung.bezahlt` → „Geld“ */
export function ereignisGruppe(typ: string): string {
  return GRUPPEN[typ.split('.')[0]] ?? 'Daten und Macher';
}

const nachTyp = new Map(EREIGNISSE.map((a) => [a.typ, a]));
const nachApi = new Map(EREIGNISSE.map((a) => [a.api, a]));

export function ereignisKatalog(): EreignisArt[] {
  return EREIGNISSE;
}

export function ereignisArt(typOderApi: string): EreignisArt | undefined {
  return nachTyp.get(typOderApi) ?? nachApi.get(typOderApi);
}

/** `rechnung.bezahlt` → `invoice.paid` (unbekannte Typen bleiben, wie sie sind) */
export function apiName(typ: string): string {
  return nachTyp.get(typ)?.api ?? typ;
}

// ------------------------------------------------------------------ Ableitung aus Datenereignissen

type Obj = Record<string, unknown> & Basis;
const feld = (o: Basis | undefined, f: string) => (o as Obj | undefined)?.[f];
const wechselZu = (e: DbEvent, f: string, wert: unknown) => feld(e.objekt, f) === wert && feld(e.vorher, f) !== wert;

interface Ableitung {
  /** Datenereignis, z. B. `rechnungen.updated` */
  quelle: string;
  typ: string;
  wenn?: (e: DbEvent) => boolean;
  daten?: (e: DbEvent) => unknown;
}

const ABLEITUNGEN: Ableitung[] = [
  { quelle: 'kunden.created', typ: 'kunde.angelegt' },
  { quelle: 'kunden.updated', typ: 'kunde.geaendert' },
  { quelle: 'auftraege.created', typ: 'auftrag.angelegt' },
  { quelle: 'auftraege.created', typ: 'anfrage.eingegangen', wenn: (e) => feld(e.objekt, 'phase') === 'anfrage' },
  {
    quelle: 'auftraege.updated',
    typ: 'auftrag.schritt_gewechselt',
    wenn: (e) => !!e.vorher && feld(e.objekt, 'phase') !== feld(e.vorher, 'phase'),
    daten: (e) => ({ von: feld(e.vorher, 'phase'), nach: feld(e.objekt, 'phase') }),
  },
  { quelle: 'auftraege.updated', typ: 'auftrag.gestartet', wenn: (e) => wechselZu(e, 'phase', 'in_arbeit') },
  { quelle: 'auftraege.updated', typ: 'auftrag.abgeschlossen', wenn: (e) => wechselZu(e, 'phase', 'erledigt') },
  { quelle: 'auftraege.updated', typ: 'auftrag.verloren', wenn: (e) => wechselZu(e, 'phase', 'verloren') },
  { quelle: 'termine.created', typ: 'termin.angelegt' },
  {
    quelle: 'termine.created',
    typ: 'auftrag.eingeplant',
    wenn: (e) => !!feld(e.objekt, 'auftragId') && ['einsatz', 'wartung'].includes(String(feld(e.objekt, 'art'))),
    daten: (e) => ({ auftragId: feld(e.objekt, 'auftragId'), start: feld(e.objekt, 'start'), mitarbeiterIds: feld(e.objekt, 'mitarbeiterIds') }),
  },
  { quelle: 'termine.updated', typ: 'termin.abgesagt', wenn: (e) => wechselZu(e, 'status', 'abgesagt') },
  { quelle: 'angebote.created', typ: 'angebot.erstellt' },
  { quelle: 'angebote.updated', typ: 'angebot.versendet', wenn: (e) => wechselZu(e, 'status', 'versendet') },
  { quelle: 'angebote.updated', typ: 'angebot.angenommen', wenn: (e) => wechselZu(e, 'status', 'angenommen') },
  { quelle: 'angebote.updated', typ: 'angebot.abgelehnt', wenn: (e) => wechselZu(e, 'status', 'abgelehnt') },
  { quelle: 'rechnungen.created', typ: 'rechnung.erstellt' },
  { quelle: 'rechnungen.updated', typ: 'rechnung.versendet', wenn: (e) => feld(e.vorher, 'status') === 'entwurf' && feld(e.objekt, 'status') === 'versendet' },
  { quelle: 'rechnungen.updated', typ: 'rechnung.bezahlt', wenn: (e) => wechselZu(e, 'status', 'bezahlt') },
  { quelle: 'rechnungen.updated', typ: 'rechnung.storniert', wenn: (e) => wechselZu(e, 'status', 'storniert') },
  { quelle: 'zahlungen.created', typ: 'zahlung.eingegangen', daten: (e) => ({ rechnungId: feld(e.objekt, 'rechnungId') }) },
  { quelle: 'aufgaben.created', typ: 'aufgabe.angelegt' },
  { quelle: 'aufgaben.updated', typ: 'aufgabe.erledigt', wenn: (e) => wechselZu(e, 'erledigt', true) },
  { quelle: 'mitarbeiter.created', typ: 'mitarbeiter.angelegt' },
  {
    quelle: 'abwesenheiten.created',
    typ: 'mitarbeiter.abwesend',
    wenn: (e) => feld(e.objekt, 'status') === 'genehmigt',
    daten: (e) => ({ mitarbeiterId: feld(e.objekt, 'mitarbeiterId'), von: feld(e.objekt, 'von'), bis: feld(e.objekt, 'bis') }),
  },
  {
    quelle: 'abwesenheiten.updated',
    typ: 'mitarbeiter.abwesend',
    wenn: (e) => wechselZu(e, 'status', 'genehmigt'),
    daten: (e) => ({ mitarbeiterId: feld(e.objekt, 'mitarbeiterId'), von: feld(e.objekt, 'von'), bis: feld(e.objekt, 'bis') }),
  },
  { quelle: 'artikel.created', typ: 'material.knapp', wenn: (e) => unterMindest(e.objekt) },
  { quelle: 'artikel.updated', typ: 'material.knapp', wenn: (e) => unterMindest(e.objekt) && !unterMindest(e.vorher), daten: (e) => ({ bestand: feld(e.objekt, 'bestand'), mindestbestand: feld(e.objekt, 'mindestbestand') }) },
  { quelle: 'nachrichten.created', typ: 'nachricht.eingegangen', wenn: (e) => feld(e.objekt, 'richtung') === 'ein' },
  { quelle: 'belege.created', typ: 'beleg.erfasst' },
  { quelle: 'bestellungen.created', typ: 'bestellung.angelegt' },
  { quelle: 'reklamationen.created', typ: 'reklamation.eingegangen' },
];

function unterMindest(o: Basis | undefined): boolean {
  const b = feld(o, 'bestand');
  const m = feld(o, 'mindestbestand');
  return typeof b === 'number' && typeof m === 'number' && m > 0 && b < m;
}

const ableitungenNach = new Map<string, Ableitung[]>();
for (const a of ABLEITUNGEN) ableitungenNach.set(a.quelle, [...(ableitungenNach.get(a.quelle) ?? []), a]);

/** Fachliche Ereignisse, die ein Datenereignis bedeutet (rein, für Tests und Integrationen) */
export function ableiten(e: DbEvent): DbEvent[] {
  return (ableitungenNach.get(e.typ) ?? [])
    .filter((a) => !a.wenn || a.wenn(e))
    .map((a) => ({ typ: a.typ, sammlung: e.sammlung, objekt: e.objekt, vorher: e.vorher, daten: a.daten?.(e), abgeleitet: true }));
}

const warteschlange: { e: DbEvent; akteur?: Akteur }[] = [];
let geplant = false;

/** Abgeleitete Ereignisse senden (läuft automatisch als Microtask nach der Änderung; in Tests direkt aufrufbar) */
export function ereignisseAbarbeiten() {
  geplant = false;
  while (warteschlange.length) {
    const { e, akteur } = warteschlange.shift()!;
    // Modul hat dasselbe Ereignis selbst gesendet → nicht doppelt
    if (kuerzlichGesendet(e)) continue;
    if (akteur) alsAkteur(akteur, () => emit(e));
    else emit(e);
  }
}

function einreihen(e: DbEvent) {
  warteschlange.push({ e, akteur: aktuellerAkteur() });
  if (!geplant) {
    geplant = true;
    queueMicrotask(ereignisseAbarbeiten);
  }
}

// ------------------------------------------------------------------ Ereignisprotokoll

export interface ProtokollEreignis extends Basis {
  /** deutscher Typ, z. B. `rechnung.bezahlt` */
  typ: string;
  /** API-Name, z. B. `invoice.paid` */
  api: string;
  zeit: Zeitpunkt;
  bezug?: Bezug;
  quelle: AuditQuelle;
  /** Automation-ID, „macher“ … */
  akteurId?: string;
  /** Mensch, der gehandelt hat oder für den gehandelt wurde */
  mitarbeiterId?: ID;
  /** kleine Zusatzangaben des Ereignisses (höchstens 2 KB) */
  daten?: unknown;
  abgeleitet?: boolean;
}

export const ereignisprotokoll = defineCollection<ProtokollEreignis>('ereignisprotokoll');

const MAX_DATEN = 2000;

function kleineDaten(d: unknown): unknown {
  if (d === undefined) return undefined;
  try {
    const j = JSON.stringify(d);
    return j.length > MAX_DATEN ? { gekuerzt: true } : JSON.parse(j);
  } catch {
    return undefined;
  }
}

function bezugVon(e: DbEvent): Bezug | undefined {
  if (!e.objekt?.id) return undefined;
  const s = e.sammlung ?? nachTyp.get(e.typ)?.objekt;
  return s ? { typ: s, id: e.objekt.id } : undefined;
}

/** Ein fachliches Ereignis ins Protokoll schreiben und an passende Webhooks übergeben */
export function protokollieren(e: DbEvent): ProtokollEreignis | undefined {
  const a = aktuellerAkteur();
  const bezug = bezugVon(e);
  const beispiel = !!e.objekt?.beispiel || (!!bezug && !!aufloesen(bezug)?.beispiel);
  try {
    const eintrag = ereignisprotokoll.create(
      {
        typ: e.typ,
        api: apiName(e.typ),
        zeit: new Date().toISOString(),
        bezug,
        quelle: a?.quelle ?? 'user',
        akteurId: a?.id,
        mitarbeiterId: a?.mitarbeiterId ?? (a ? undefined : aktuellerNutzerId()),
        daten: kleineDaten(e.daten),
        abgeleitet: e.abgeleitet || undefined,
        beispiel: beispiel || undefined,
      },
      { leise: true },
    );
    if (!beispiel) webhooksVormerken(eintrag);
    return eintrag;
  } catch {
    // z. B. Lesemodus – das Ereignis selbst ist trotzdem zugestellt
    return undefined;
  }
}

/** Ereignisse seit einem Zeitpunkt (älteste zuerst) – für Integrationen, KI und Auswertungen */
export function ereignisseSeit(seit?: Zeitpunkt, filter?: { typ?: string | string[]; bezug?: Bezug }): ProtokollEreignis[] {
  const typen = filter?.typ ? new Set(Array.isArray(filter.typ) ? filter.typ : [filter.typ]) : undefined;
  return ereignisprotokoll
    .where((x) => (!seit || x.zeit > seit) && (!typen || typen.has(x.typ) || typen.has(x.api)) && (!filter?.bezug || (x.bezug?.typ === filter.bezug.typ && x.bezug.id === filter.bezug.id)))
    .sort((a, b) => a.zeit.localeCompare(b.zeit));
}

// ------------------------------------------------------------------ Webhooks

export interface Webhook extends Basis {
  /** Anzeigename, z. B. „Buchhaltung“ */
  name: string;
  /** Ziel-Adresse (https) */
  url: string;
  /** API-Namen (`invoice.paid`) oder deutsche Typen; `*` = alle */
  ereignisse: string[];
  aktiv: boolean;
  /** Das Signatur-Geheimnis selbst steht nie im Webhook; hier nur, ob eines gesetzt ist */
  geheimnisGesetzt?: boolean;
  /** letzte vier Zeichen des Geheimnisses – zum Wiedererkennen */
  geheimnisEnde?: string;
  /** letzte erfolgreiche Zustellung */
  zuletztZugestelltAm?: Zeitpunkt;
  /** letzter Fehler (Klartext) */
  letzterFehler?: string;
}

export interface WebhookAuslieferung extends Basis {
  webhookId: ID;
  ereignisId: ID;
  api: string;
  status: 'wartend' | 'zugestellt' | 'fehler' | 'aufgegeben';
  versuche: number;
  /** frühester nächster Versuch */
  naechsterVersuch?: Zeitpunkt;
  zugestelltAm?: Zeitpunkt;
  antwortCode?: number;
  fehler?: string;
}

export const webhooks = defineCollection<Webhook>('webhooks');
export const webhookAuslieferungen = defineCollection<WebhookAuslieferung>('webhook_auslieferungen');

/** Wartezeiten nach dem 1.–5. Fehlversuch; scheitert auch der 6. Versuch, gilt die Auslieferung als aufgegeben */
export const WEBHOOK_WARTEZEITEN_MIN = [1, 5, 30, 120, 720];

/** Prüft die Ziel-Adresse. Gibt einen Fehlertext zurück oder undefined. */
export function webhookUrlPruefen(url: string): string | undefined {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return 'Das ist keine gültige Adresse. Sie beginnt mit https://';
  }
  if (u.protocol === 'https:') return undefined;
  if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return undefined;
  return 'Aus Sicherheitsgründen gehen nur verschlüsselte Adressen (https://).';
}

export function webhookAnlegen(w: { id?: ID; name: string; url: string; ereignisse: string[]; aktiv?: boolean; geheimnisEnde?: string }): Webhook {
  const fehler = webhookUrlPruefen(w.url);
  if (fehler) throw new Error(fehler);
  return webhooks.create({
    ...(w.id ? { id: w.id } : {}),
    name: w.name.trim() || 'Webhook',
    url: w.url.trim(),
    ereignisse: w.ereignisse.length ? w.ereignisse : ['*'],
    aktiv: w.aktiv ?? true,
    geheimnisGesetzt: w.geheimnisEnde ? true : undefined,
    geheimnisEnde: w.geheimnisEnde,
  });
}

/** Passt ein Ereignis zu den abonnierten Namen? `*` = alle, `rechnung.*`/`invoice.*` = alle zu diesem Objekt */
export function ereignisAbonniert(ereignisse: string[], e: Pick<ProtokollEreignis, 'typ' | 'api'>): boolean {
  return ereignisse.some((x) => x === '*' || x === e.api || x === e.typ || (x.endsWith('.*') && (e.typ.startsWith(x.slice(0, -1)) || e.api.startsWith(x.slice(0, -1)))));
}

const passt = (w: Webhook, e: Pick<ProtokollEreignis, 'typ' | 'api'>) => w.aktiv && !w.geloeschtAm && ereignisAbonniert(w.ereignisse, e);

function webhooksVormerken(e: ProtokollEreignis) {
  for (const w of webhooks.all()) {
    if (!passt(w, e)) continue;
    webhookAuslieferungen.create({ webhookId: w.id, ereignisId: e.id, api: e.api, status: 'wartend', versuche: 0, naechsterVersuch: e.zeit }, { leise: true });
  }
}

/** Kurzfassung eines Objekts für die Nutzlast: ohne große Felder (Fotos, Dateien) */
function kurzfassung(o: Basis | undefined): Record<string, unknown> | undefined {
  if (!o) return undefined;
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    const j = JSON.stringify(v);
    if (j !== undefined && j.length <= 2000) r[k] = v;
  }
  return r;
}

/** Nutzlast, die an die Webhook-Adresse geht (JSON) – wird beim Versand aus dem aktuellen Stand gebaut */
export function webhookNutzlast(e: ProtokollEreignis) {
  return {
    id: e.id,
    type: e.api,
    event: e.typ,
    created_at: e.zeit,
    source: e.quelle,
    actor: e.akteurId ?? e.mitarbeiterId,
    object: e.bezug ? { type: e.bezug.typ, id: e.bezug.id, data: kurzfassung(aufloesen(e.bezug)) } : undefined,
    data: e.daten,
  };
}

export type WebhookVersender = (a: { url: string; nutzlast: ReturnType<typeof webhookNutzlast>; webhook: Webhook }) => Promise<{ ok: boolean; code?: number; fehler?: string }>;

let versender: WebhookVersender | undefined;

/** Versand anbinden (Server, Edge-Funktion, Test). Ohne Versender bleibt die Warteschlange für den Server liegen. */
export function setzeWebhookVersender(v: WebhookVersender | undefined) {
  versender = v;
}

/** Ist ein Versender angebunden (werden Webhooks auf diesem Gerät wirklich zugestellt)? */
export function webhookVersandAktiv(): boolean {
  return !!versender;
}

export function wartendeAuslieferungen(jetzt: Zeitpunkt = new Date().toISOString()): WebhookAuslieferung[] {
  return webhookAuslieferungen.where((a) => (a.status === 'wartend' || a.status === 'fehler') && (!a.naechsterVersuch || a.naechsterVersuch <= jetzt));
}

/** Ergebnis eines Versands eintragen (auch vom Server nutzbar) */
export function auslieferungErgebnis(id: ID, r: { ok: boolean; code?: number; fehler?: string }) {
  const a = webhookAuslieferungen.get(id);
  if (!a) return;
  const jetzt = new Date();
  const versuche = a.versuche + 1;
  if (r.ok) {
    webhookAuslieferungen.update(id, { status: 'zugestellt', versuche, zugestelltAm: jetzt.toISOString(), antwortCode: r.code, fehler: undefined, naechsterVersuch: undefined }, { leise: true });
    webhooks.update(a.webhookId, { zuletztZugestelltAm: jetzt.toISOString(), letzterFehler: undefined }, { leise: true });
    return;
  }
  const warten = WEBHOOK_WARTEZEITEN_MIN[versuche - 1];
  webhookAuslieferungen.update(
    id,
    {
      status: warten === undefined ? 'aufgegeben' : 'fehler',
      versuche,
      antwortCode: r.code,
      fehler: r.fehler,
      naechsterVersuch: warten === undefined ? undefined : new Date(jetzt.getTime() + warten * 60_000).toISOString(),
    },
    { leise: true },
  );
  webhooks.update(a.webhookId, { letzterFehler: r.fehler ?? (r.code ? `Antwort ${r.code}` : 'Nicht erreichbar') }, { leise: true });
}

/** Fällige Auslieferungen mit dem gesetzten Versender zustellen. Gibt die Anzahl der Versuche zurück. */
export async function webhooksZustellen(): Promise<number> {
  if (!versender) return 0;
  let n = 0;
  for (const a of wartendeAuslieferungen()) {
    const w = webhooks.get(a.webhookId);
    const e = ereignisprotokoll.get(a.ereignisId);
    if (!w || w.geloeschtAm || !w.aktiv || !e) {
      webhookAuslieferungen.update(a.id, { status: 'aufgegeben', fehler: 'Webhook oder Ereignis nicht mehr vorhanden' }, { leise: true });
      continue;
    }
    n++;
    try {
      auslieferungErgebnis(a.id, await versender({ url: w.url, nutzlast: webhookNutzlast(e), webhook: w }));
    } catch (err) {
      auslieferungErgebnis(a.id, { ok: false, fehler: err instanceof Error ? err.message : 'Versand fehlgeschlagen' });
    }
  }
  return n;
}

// ------------------------------------------------------------------ Fristen (zeitabhängige Ereignisse)

/** Sendet `rechnung.ueberfaellig` einmal je Rechnung und Fälligkeitsdatum. Gibt die Anzahl zurück. */
export function pruefeFristen(stichtag: string = new Date().toISOString().slice(0, 10)): number {
  let n = 0;
  for (const r of db.rechnungen.where((x) => (x.status === 'versendet' || x.status === 'teilbezahlt') && !!x.faelligAm && x.faelligAm < stichtag)) {
    const schon = ereignisprotokoll.allMitGeloeschten().some((p) => p.typ === 'rechnung.ueberfaellig' && p.bezug?.id === r.id && (p.daten as { faelligAm?: string } | undefined)?.faelligAm === r.faelligAm);
    if (schon) continue;
    emit({ typ: 'rechnung.ueberfaellig', sammlung: 'rechnungen', objekt: r, daten: { faelligAm: r.faelligAm }, abgeleitet: true });
    n++;
  }
  return n;
}

// ------------------------------------------------------------------ Rotation

/** Ereignisprotokoll und erledigte Auslieferungen begrenzen (nur auf diesem Gerät) */
export function protokollAufraeumen(opts: { maxTage?: number; maxEintraege?: number; jetzt?: Date } = {}) {
  const jetzt = opts.jetzt ?? new Date();
  const grenze = new Date(jetzt.getTime() - (opts.maxTage ?? 90) * 86_400_000).toISOString();
  const max = opts.maxEintraege ?? 5000;
  const alle = ereignisprotokoll.allMitGeloeschten().sort((a, b) => b.zeit.localeCompare(a.zeit));
  const offen = new Set(webhookAuslieferungen.where((a) => a.status === 'wartend' || a.status === 'fehler').map((a) => a.ereignisId));
  const weg = alle.filter((e, i) => !offen.has(e.id) && (i >= max || e.zeit < grenze)).map((e) => e.id);
  vergessen('ereignisprotokoll', weg);
  const auslGrenze = new Date(jetzt.getTime() - 14 * 86_400_000).toISOString();
  vergessen(
    'webhook_auslieferungen',
    webhookAuslieferungen.allMitGeloeschten().filter((a) => (a.status === 'zugestellt' || a.status === 'aufgegeben') && a.geaendertAm < auslGrenze).map((a) => a.id),
  );
  return weg.length;
}

// ------------------------------------------------------------------ Start

let gestartet: (() => void) | undefined;

/**
 * Ereignis-Architektur einschalten: Ableitung, Protokoll, Fristprüfung, Rotation. Idempotent.
 * Läuft beim App-Start (`starteAutomationen`).
 */
export function starteEreignisse(): () => void {
  if (gestartet) return gestartet;
  const aus = on('*', (e) => {
    if (istDatenEreignis(e)) {
      for (const f of ableiten(e)) einreihen(f);
      return;
    }
    protokollieren(e);
  });
  gestartet = () => {
    aus();
    gestartet = undefined;
  };
  try {
    protokollAufraeumen();
    pruefeFristen();
  } catch (err) {
    console.warn('Ereignisprotokoll: Prüfung beim Start fehlgeschlagen', err);
  }
  return gestartet;
}
