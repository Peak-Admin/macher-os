/**
 * HeyLotte verbinden – reine Hilfen für die Einstellungsseite (`HeyLotte.tsx`).
 *
 * HeyLotte versteht, Handwerk OS entscheidet und führt aus. Die Seite spricht nur mit `/api/cloud/partner`
 * (über `supabaseCloud().serverAnfrage('partner', …)`); hier liegen die Typen dieser Antworten und die
 * Übersetzung in Handwerkersprache (Status immer als Text, nie nur als Farbe).
 */
import type { Ton } from '@core/modul';

export interface PartnerNutzer {
  partner_nutzer_id: string;
  mitarbeiter_id: string;
}

export interface Auslieferungen {
  wartend: number;
  fehler: number;
  aufgegeben: number;
  letzter_fehler: string | null;
}

export interface PartnerZugang {
  id: string;
  name: string;
  partner_workspace_id: string | null;
  schluessel_ende: string | null;
  webhook_url: string | null;
  ereignisse: string[];
  erstellt_am: string;
  zuletzt_genutzt_am: string | null;
  widerrufen_am: string | null;
  nutzer: PartnerNutzer[];
  auslieferungen: Auslieferungen;
}

export interface PartnerAufruf {
  zeit: string;
  aktion: string;
  status: number;
  mitarbeiter_id: string | null;
  partner_nutzer_id: string | null;
  code: string | null;
}

export interface PartnerStand {
  zugaenge: PartnerZugang[];
  aufrufe: PartnerAufruf[];
}

/** Antwort von `serverAnfrage` */
export interface ServerAntwort<T> {
  status: number;
  daten?: T | { fehler?: string };
}

export const ok = (status: number) => status >= 200 && status < 300;

/** Fehlertext für eine misslungene Anfrage an `/api/cloud/partner` */
export function fehlerText(a: ServerAntwort<unknown> | undefined): string {
  if (!a || a.status === 0) return 'Keine Verbindung zum Internet. Versuch es gleich noch einmal.';
  if (a.status === 501) return 'Die Cloud ist noch nicht verbunden. Sichere zuerst deine Daten.';
  if (a.status === 401) return 'Du bist nicht angemeldet. Melde dich an und versuch es noch einmal.';
  if (a.status === 403) return 'Nur der Chef kann HeyLotte verbinden.';
  const d = a.daten as { fehler?: unknown } | undefined;
  const f = d && typeof d === 'object' && typeof d.fehler === 'string' ? d.fehler : undefined;
  return f || `Das hat nicht geklappt (Fehler ${a.status}). Versuch es gleich noch einmal.`;
}

export type VerbindungsZustand = 'keine' | 'aktiv' | 'getrennt';

/** Der aktive Zugang (höchstens einer zählt) und der Zustand der Verbindung */
export function verbindung(zugaenge: PartnerZugang[]): { zustand: VerbindungsZustand; zugang?: PartnerZugang; getrennt?: PartnerZugang } {
  const aktiv = zugaenge.find((z) => !z.widerrufen_am);
  if (aktiv) return { zustand: 'aktiv', zugang: aktiv };
  const getrennt = [...zugaenge].filter((z) => z.widerrufen_am).sort((a, b) => (b.widerrufen_am ?? '').localeCompare(a.widerrufen_am ?? ''))[0];
  return getrennt ? { zustand: 'getrennt', getrennt } : { zustand: 'keine' };
}

export const ZUSTAND_TEXT: Record<VerbindungsZustand, { text: string; ton: Ton }> = {
  keine: { text: 'Nicht verbunden', ton: 'neutral' },
  aktiv: { text: 'Verbunden', ton: 'erfolg' },
  getrennt: { text: 'Getrennt', ton: 'neutral' },
};

/** „…x9Zq“ – nur das Ende des Schlüssels, nie der ganze */
export const schluesselAnzeige = (ende: string | null | undefined) => (ende ? `…${ende}` : 'Unbekannt');

/** Wie es um die Benachrichtigungen an Lotte steht – als Satz */
export function zustellungStand(z: Pick<PartnerZugang, 'webhook_url' | 'auslieferungen'>): { text: string; ton: Ton } {
  if (!z.webhook_url) return { text: 'Keine Adresse eingetragen', ton: 'neutral' };
  const a = z.auslieferungen;
  const n = (k: number, eins: string, viele: string) => (k === 1 ? `1 ${eins}` : `${k} ${viele}`);
  if (a.aufgegeben > 0) return { text: `${n(a.aufgegeben, 'Nachricht', 'Nachrichten')} nicht zugestellt – Lotte hat sie nie bekommen`, ton: 'achtung' };
  if (a.fehler > 0) return { text: `${n(a.fehler, 'Zustellung', 'Zustellungen')} fehlgeschlagen – neuer Versuch folgt`, ton: 'achtung' };
  if (a.wartend > 0) return { text: `${n(a.wartend, 'Nachricht wartet', 'Nachrichten warten')} auf Zustellung`, ton: 'neutral' };
  return { text: 'Alles zugestellt', ton: 'erfolg' };
}

/** Kurzlabel für den Status-Baustein der Zustellung */
export function zustellungLabel(z: Pick<PartnerZugang, 'webhook_url' | 'auslieferungen'>): string {
  if (!z.webhook_url) return 'Aus';
  const a = z.auslieferungen;
  if (a.aufgegeben > 0 || a.fehler > 0) return 'Fehler';
  if (a.wartend > 0) return 'Wartet';
  return 'In Ordnung';
}

/** Aktionen der Action API in Handwerkersprache (Namen aus `src/os/server/partner/aktionen.ts`) */
export const AKTION_LABEL: Record<string, string> = {
  'find-customer': 'Kunden suchen',
  'create-customer': 'Kunden anlegen',
  'create-task': 'Aufgabe anlegen',
  'create-quote': 'Angebotsentwurf anlegen',
};

export const aktionLabel = (name: string) => AKTION_LABEL[name] ?? name;

/** Ereignisse, die Lotte abonnieren kann */
export const EREIGNISSE: { typ: string; titel: string }[] = [
  { typ: 'customer.created', titel: 'Kunde angelegt' },
  { typ: 'job.created', titel: 'Auftrag angelegt' },
  { typ: 'appointment.created', titel: 'Termin angelegt' },
  { typ: 'quote.created', titel: 'Angebot erstellt' },
  { typ: 'quote.accepted', titel: 'Angebot angenommen' },
  { typ: 'invoice.paid', titel: 'Rechnung bezahlt' },
  { typ: 'invoice.overdue', titel: 'Rechnung überfällig' },
  { typ: 'task.created', titel: 'Aufgabe angelegt' },
];

export function ereignisText(liste: string[]): string {
  if (!liste.length) return 'Keine Ereignisse';
  if (liste.includes('*')) return 'Alle Ereignisse';
  return liste.map((t) => EREIGNISSE.find((e) => e.typ === t)?.titel ?? t).join(', ');
}

const CODE_TEXT: Record<string, string> = {
  unauthorized: 'Abgelehnt: Schlüssel ungültig',
  forbidden: 'Abgelehnt: fehlendes Recht',
  unknown_user: 'Abgelehnt: Nutzer nicht zugeordnet',
  inactive_user: 'Abgelehnt: Mitarbeiter nicht aktiv',
  wrong_organization: 'Abgelehnt: anderer Betrieb',
  user_required: 'Abgelehnt: Nutzer fehlt',
  invalid_input: 'Abgelehnt: Angaben fehlen oder falsch',
  invalid_body: 'Abgelehnt: Anfrage fehlerhaft',
  unknown_action: 'Abgelehnt: unbekannte Aktion',
  not_found: 'Nicht gefunden',
  duplicate: 'Rückfrage: Kunde gibt es vielleicht schon',
  possible_duplicate: 'Rückfrage: Kunde gibt es vielleicht schon',
  idempotency_conflict: 'Abgelehnt: doppelter Aufruf',
  in_progress: 'Läuft noch',
  rate_limited: 'Abgelehnt: zu viele Aufrufe',
  internal: 'Fehler in Handwerk OS',
};

/** Status eines Aufrufs als Text, z. B. „Erledigt“ oder „Abgelehnt: fehlendes Recht“ */
export function aufrufStatus(a: Pick<PartnerAufruf, 'status' | 'code'>): { text: string; ton: Ton } {
  if (ok(a.status)) return { text: 'Erledigt', ton: 'erfolg' };
  if (a.code && CODE_TEXT[a.code]) return { text: CODE_TEXT[a.code], ton: a.code === 'in_progress' ? 'neutral' : 'achtung' };
  if (a.status === 0) return { text: 'Läuft noch', ton: 'neutral' };
  if (a.status === 401) return { text: CODE_TEXT.unauthorized, ton: 'achtung' };
  if (a.status === 403) return { text: CODE_TEXT.forbidden, ton: 'achtung' };
  if (a.status === 404) return { text: 'Nicht gefunden', ton: 'achtung' };
  if (a.status === 409) return { text: 'Rückfrage nötig', ton: 'achtung' };
  if (a.status === 429) return { text: CODE_TEXT.rate_limited, ton: 'achtung' };
  if (a.status >= 500) return { text: CODE_TEXT.internal, ton: 'achtung' };
  return { text: `Abgelehnt (Fehler ${a.status})`, ton: 'achtung' };
}

/** Lotte-Nutzer-ID prüfen (Text aus HeyLotte, z. B. „lotte_user_928“) */
export function nutzerIdPruefen(id: string, vorhanden: string[] = []): string | undefined {
  const t = id.trim();
  if (!t) return 'Trag die Lotte-Nutzer-ID ein, z. B. lotte_user_928.';
  if (/\s/.test(t)) return 'Die Nutzer-ID enthält keine Leerzeichen.';
  if (t.length > 200) return 'Die Nutzer-ID ist zu lang.';
  if (vorhanden.includes(t)) return 'Dieser Lotte-Nutzer ist schon zugeordnet.';
  return undefined;
}

/** Workspace-ID ist freiwillig; wenn, dann ohne Leerzeichen */
export function workspacePruefen(id: string): string | undefined {
  const t = id.trim();
  if (!t) return undefined;
  if (/\s/.test(t)) return 'Die Workspace-ID enthält keine Leerzeichen.';
  if (t.length > 200) return 'Die Workspace-ID ist zu lang.';
  return undefined;
}

// ------------------------------------------------------------------ Zuletzt gesehener Stand (für die Karte im Hub)

let gemerkt: { zustand: VerbindungsZustand; schluesselEnde?: string | null } | undefined;

/** Die Seite merkt sich nach jedem Laden den Zustand – so zeigt die Karte im Hub keinen erfundenen Stand */
export function zustandMerken(zugaenge: PartnerZugang[]) {
  const v = verbindung(zugaenge);
  gemerkt = { zustand: v.zustand, schluesselEnde: v.zugang?.schluessel_ende };
}

/** Status für den Connector „HeyLotte“ in `connectoren.ts` */
export function hubStatus(): { zustand: 'verbunden' | 'nicht_verbunden'; text: string } {
  if (!gemerkt) return { zustand: 'nicht_verbunden', text: 'Stand siehst du nach dem Öffnen' };
  if (gemerkt.zustand === 'aktiv') return { zustand: 'verbunden', text: `Schlüssel ${schluesselAnzeige(gemerkt.schluesselEnde)}` };
  if (gemerkt.zustand === 'getrennt') return { zustand: 'nicht_verbunden', text: 'Verbindung getrennt' };
  return { zustand: 'nicht_verbunden', text: 'Noch nicht verbunden' };
}
