/**
 * Reine Regeln für „Dein Plan“: Planwahl nach Teamgröße, Testphase, Zustände, Lesemodus, Wertspitzen.
 *
 * Keine Abhängigkeit zu React, zur Datenschicht oder zu Pfad-Aliasen – dieselbe Datei nutzen die
 * Route Handler unter `src/app/api/abo/**`. Die Planwerte kommen aus `plaene.ts`, der gemeinsamen
 * Quelle für App und Website (`src/content/preise.ts`).
 */
import { PLAN_QUELLE as quelle } from './plaene';

export type PlanId = 'solo' | 'team' | 'betrieb' | 'unternehmen';
export type Intervall = 'monat' | 'jahr';

export interface Plan {
  id: PlanId;
  name: string;
  /** höchstens so viele aktive Leute; `null` = unbegrenzt */
  bis: number | null;
  /** Monatspreis netto in Cent bei monatlicher Zahlung; `null` = auf Anfrage */
  monatlichCent: number | null;
  /** Monatspreis netto in Cent bei jährlicher Zahlung */
  jaehrlichCent: number | null;
}

export const PLAENE: Plan[] = quelle.plaene.map((p) => ({
  id: p.id,
  name: p.name,
  bis: p.bis,
  monatlichCent: p.monatlich == null ? null : p.monatlich * 100,
  jaehrlichCent: p.jaehrlich == null ? null : p.jaehrlich * 100,
}));

export const TEST_TAGE: number = quelle.testTage;
export const KULANZ_TAGE: number = quelle.kulanzTage;
/** Preise sind bis zur Freigabe vorläufig – überall sichtbar kennzeichnen */
export const PREISE_VORLAEUFIG: boolean = quelle.vorlaeufig;

export function planMitId(id: string | undefined): Plan | undefined {
  return PLAENE.find((p) => p.id === id);
}

/** Der kleinste Plan, in den diese Zahl aktiver Leute passt */
export function planFuer(personen: number): Plan {
  return PLAENE.find((p) => p.bis == null || personen <= p.bis) ?? PLAENE[PLAENE.length - 1];
}

/** Kann man diesen Plan selbst buchen? (sonst Angebot auf Anfrage) */
export function buchbar(p: Plan): boolean {
  return p.monatlichCent != null && p.jaehrlichCent != null;
}

/** Betrag je Abbuchung in Cent (monatlich: ein Monat, jährlich: zwölf Monate) */
export function abbuchungCent(p: Plan, intervall: Intervall): number | null {
  if (intervall === 'jahr') return p.jaehrlichCent == null ? null : p.jaehrlichCent * 12;
  return p.monatlichCent;
}

/** Ersparnis bei jährlicher Zahlung in ganzen Prozent */
export function jahresRabattProzent(p: Plan): number {
  if (!p.monatlichCent || !p.jaehrlichCent) return 0;
  return Math.round((1 - p.jaehrlichCent / p.monatlichCent) * 100);
}

/** Aktive Leute im Team (ohne Papierkorb und Beispieldaten), mindestens 1 – der Chef zählt immer. */
export function aktivePersonen(mitarbeiter: { aktiv?: boolean; geloeschtAm?: string; beispiel?: boolean }[]): number {
  return Math.max(1, mitarbeiter.filter((m) => m.aktiv !== false && !m.geloeschtAm && !m.beispiel).length);
}

// ------------------------------------------------------------------ Datum (ohne Kern-Import, auch für den Server)

function isoDatum(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function plusTage(datum: string, tage: number): string {
  const d = new Date(datum + 'T12:00:00');
  d.setDate(d.getDate() + tage);
  return isoDatum(d);
}
export function tageZwischen(von: string, bis: string): number {
  return Math.round((new Date(bis + 'T12:00:00').getTime() - new Date(von + 'T12:00:00').getTime()) / 86_400_000);
}

/**
 * Letzter Testtag (einschließlich): 30 Tage nach dem Tag der Einrichtung.
 * Tag 0 = Einrichtung, Tag 30 = letzter Testtag, ab Tag 31 Lesemodus.
 */
export function testBisAus(einrichtung: string): string {
  return plusTage(einrichtung.slice(0, 10), TEST_TAGE);
}

// ------------------------------------------------------------------ Zustand

export type AboStatus = 'test' | 'aktiv' | 'zahlung_offen' | 'lesemodus' | 'gekuendigt';
export type LeseGrund = 'test_abgelaufen' | 'zahlung' | 'beendet';

/**
 * Stand laut Datenvertrag (`betriebe.plan`, `betriebe.test_bis`). `plan` ist kodiert:
 * - `test` – Testphase bis `testBis`
 * - `<planId>` – bezahlt, läuft
 * - `<planId>:zahlung_offen:<YYYY-MM-DD>` – Abbuchung fehlgeschlagen seit
 * - `<planId>:gekuendigt:<YYYY-MM-DD>` – gekündigt, läuft bis einschließlich
 * - `lesemodus` – Abo beendet
 */
export interface ServerStand {
  plan: string;
  testBis?: string;
}

export interface Zustand {
  status: AboStatus;
  /** gebuchter Plan (nicht in der Testphase) */
  planId?: PlanId;
  testBis?: string;
  /** Tag der Testphase (0 = Einrichtung) */
  tag?: number;
  tageUebrig?: number;
  mahnstufe?: 1 | 2 | 3;
  offenSeit?: string;
  /** letzter Tag vor dem Lesemodus bei offener Zahlung */
  kulanzBis?: string;
  /** gekündigt: läuft bis einschließlich */
  aktivBis?: string;
  grund?: LeseGrund;
  /**
   * Nur wenn Bezahlen wirklich möglich ist (Stand kommt vom Server mit Stripe), wird der Lesemodus durchgesetzt.
   * Ohne Bezahlmöglichkeit sperren wir niemanden aus – die Testphase bleibt trotzdem sichtbar abgelaufen.
   */
  durchgesetzt?: boolean;
}

export function planKodieren(planId: PlanId, status?: 'zahlung_offen' | 'gekuendigt', datum?: string): string {
  return status && datum ? `${planId}:${status}:${datum}` : planId;
}

export function planLesen(roh: string | undefined): { planId?: PlanId; status?: 'zahlung_offen' | 'gekuendigt'; datum?: string; test?: boolean; beendet?: boolean } {
  const [id, status, datum] = (roh ?? 'test').split(':');
  if (id === 'test') return { test: true };
  if (id === 'lesemodus') return { beendet: true };
  const planId = planMitId(id)?.id;
  if (!planId) return { test: true };
  if ((status === 'zahlung_offen' || status === 'gekuendigt') && /^\d{4}-\d{2}-\d{2}$/.test(datum ?? '')) return { planId, status, datum };
  return { planId };
}

/** Mahnstufe nach Tagen seit der fehlgeschlagenen Abbuchung: sofort 1, ab Tag 5 Stufe 2, ab Tag 10 Stufe 3 */
export function mahnstufe(offenSeit: string, heute: string): 1 | 2 | 3 {
  const t = tageZwischen(offenSeit, heute);
  return t >= 10 ? 3 : t >= 5 ? 2 : 1;
}

export function zustand(stand: ServerStand, heute: string): Zustand {
  const p = planLesen(stand.plan);
  if (p.beendet) return { status: 'lesemodus', grund: 'beendet' };
  if (p.test || !p.planId) {
    const testBis = stand.testBis ?? heute;
    const tageUebrig = tageZwischen(heute, testBis);
    const tag = TEST_TAGE - tageUebrig;
    if (tageUebrig < 0) return { status: 'lesemodus', grund: 'test_abgelaufen', testBis, tag };
    return { status: 'test', testBis, tag, tageUebrig };
  }
  if (p.status === 'zahlung_offen') {
    const kulanzBis = plusTage(p.datum!, KULANZ_TAGE - 1);
    if (heute > kulanzBis) return { status: 'lesemodus', grund: 'zahlung', planId: p.planId, offenSeit: p.datum };
    return { status: 'zahlung_offen', planId: p.planId, offenSeit: p.datum, kulanzBis, mahnstufe: mahnstufe(p.datum!, heute), tageUebrig: tageZwischen(heute, kulanzBis) };
  }
  if (p.status === 'gekuendigt') {
    if (heute > p.datum!) return { status: 'lesemodus', grund: 'beendet', planId: p.planId };
    return { status: 'gekuendigt', planId: p.planId, aktivBis: p.datum, tageUebrig: tageZwischen(heute, p.datum!) };
  }
  return { status: 'aktiv', planId: p.planId };
}

export const STATUS_TEXT: Record<AboStatus, string> = {
  test: 'Testphase',
  aktiv: 'Aktiv',
  zahlung_offen: 'Abbuchung offen',
  lesemodus: 'Nur lesen',
  gekuendigt: 'Gekündigt',
};

// ------------------------------------------------------------------ Lesemodus

/**
 * Immer frei: Protokoll, Einstellungen, Benachrichtigungen, Erledigt, Hinweise, Chat, Kundenbereich-Zugänge,
 * Ereignisprotokoll und Webhook-Warteschlange (Kern – sonst gehen fachliche Ereignisse und Zustellungen verloren)
 */
export const SYSTEM_SAMMLUNGEN = ['ereignisse', 'einstellungen', 'benachrichtigungen', 'erledigungen', 'hinweise', 'chat', 'portalzugaenge', 'ereignisprotokoll', 'webhook_auslieferungen'];
/** Laufende Vorgänge (Geldeingang, Mahnungen, Kundennachrichten) dürfen auch Neues anlegen */
export const LAUFENDE_SAMMLUNGEN = ['zahlungen', 'mahnungen', 'nachrichten'];
/**
 * Bestehendes ändern ja, Neues anlegen nein – damit Kundenbereich (Angebot annehmen, Termin bestätigen)
 * und offene Rechnungen (als bezahlt markieren) weiterlaufen.
 */
export const NUR_AENDERN_SAMMLUNGEN = ['rechnungen', 'angebote', 'auftraege', 'termine'];

export const LESE_GRUND_TEXT: Record<LeseGrund, string> = {
  test_abgelaufen: 'Deine Testphase ist vorbei. Alles bleibt lesbar und exportierbar – zum Anlegen und Ändern wähl deinen Plan.',
  zahlung: 'Die Abbuchung hat 14 Tage lang nicht geklappt. Alles bleibt lesbar und exportierbar – mit einer gültigen Zahlungsart geht es sofort weiter.',
  beendet: 'Dein Plan ist beendet. Alles bleibt lesbar und exportierbar – zum Weiterarbeiten wähl einen Plan.',
};

/** Grund, warum nicht geschrieben werden darf – oder `undefined`, wenn es erlaubt ist. */
export function schreibGrund(sammlung: string, z: Zustand, aktion: 'anlegen' | 'aendern'): string | undefined {
  if (z.status !== 'lesemodus' || z.durchgesetzt === false) return undefined;
  if (SYSTEM_SAMMLUNGEN.includes(sammlung) || LAUFENDE_SAMMLUNGEN.includes(sammlung)) return undefined;
  if (aktion === 'aendern' && NUR_AENDERN_SAMMLUNGEN.includes(sammlung)) return undefined;
  return LESE_GRUND_TEXT[z.grund ?? 'beendet'];
}

// ------------------------------------------------------------------ Wertspitzen

/** Hinweise nur an drei Tagen der Testphase: ab Tag 21, ab Tag 27 und am letzten Tag (30) */
export function wertspitze(z: Zustand): 21 | 27 | 30 | undefined {
  if (z.status !== 'test' || z.tag == null) return undefined;
  if (z.tag >= 30) return 30;
  if (z.tag >= 27) return 27;
  if (z.tag >= 21) return 21;
  return undefined;
}

export interface Bilanz {
  angebote: number;
  rechnungen: number;
  bezahltCent: number;
}

const euroGanz = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const mehrzahl = (n: number, eins: string, viele: string) => `${n.toLocaleString('de-DE')} ${n === 1 ? eins : viele}`;

/** „Seit dem Start: 14 Angebote, 9 Rechnungen, 23.400 € bezahlt“ – nur echte Zahlen, Leeres weglassen */
export function bilanzText(b: Bilanz): string | undefined {
  const teile = [
    b.angebote ? mehrzahl(b.angebote, 'Angebot', 'Angebote') : '',
    b.rechnungen ? mehrzahl(b.rechnungen, 'Rechnung', 'Rechnungen') : '',
    b.bezahltCent ? `${euroGanz.format(Math.round(b.bezahltCent / 100))} bezahlt` : '',
  ].filter(Boolean);
  return teile.length ? `Seit dem Start: ${teile.join(', ')}` : undefined;
}

/** Bilanz aus den eigenen Daten (ohne Beispieldaten, Papierkorb, Entwürfe und Stornos) */
export function bilanz(d: {
  angebote: { status: string; beispiel?: boolean; geloeschtAm?: string }[];
  rechnungen: { status: string; beispiel?: boolean; geloeschtAm?: string }[];
  zahlungen: { betrag: number; beispiel?: boolean; geloeschtAm?: string }[];
}): Bilanz {
  const echt = <T extends { beispiel?: boolean; geloeschtAm?: string }>(x: T) => !x.beispiel && !x.geloeschtAm;
  return {
    angebote: d.angebote.filter((a) => echt(a) && a.status !== 'entwurf').length,
    rechnungen: d.rechnungen.filter((r) => echt(r) && r.status !== 'entwurf' && r.status !== 'storniert').length,
    bezahltCent: d.zahlungen.filter(echt).reduce((s, z) => s + (z.betrag > 0 ? z.betrag : 0), 0),
  };
}

// ------------------------------------------------------------------ Kündigen

export const KUENDIGUNGS_GRUENDE: { wert: string; label: string; stripe: string }[] = [
  { wert: 'zu_teuer', label: 'Zu teuer für uns', stripe: 'too_expensive' },
  { wert: 'fehlt', label: 'Uns fehlt etwas Wichtiges', stripe: 'missing_features' },
  { wert: 'kompliziert', label: 'Zu kompliziert im Alltag', stripe: 'too_complex' },
  { wert: 'wenig', label: 'Wir nutzen es zu wenig', stripe: 'unused' },
  { wert: 'anderes_programm', label: 'Wir wechseln zu einem anderen Programm', stripe: 'switched_service' },
  { wert: 'sonstiges', label: 'Etwas anderes', stripe: 'other' },
];
