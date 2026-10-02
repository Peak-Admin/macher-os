/**
 * Reine Logik der öffentlichen Links (Server: `src/app/api/oeffentlich/*`) (Kundenbereich `/k/:token`, Terminbuchung `/buchen/:token`).
 *
 * Die App des Betriebs legt je Link eine fertige „öffentliche Sicht“ ab (Sammlung `oeffentliche_sichten`,
 * ID = Token) – nur das, was der Kunde sehen darf. Der Server liefert sie nach Prüfung aus.
 * Was der Kunde tut (geöffnet, Nachricht, Angebot annehmen, Termin buchen), landet als
 * `oeffentliche_eingaben` beim Betrieb; die App verarbeitet es mit derselben Logik wie im Büro.
 */
export type OeffentlicheArt = 'portal' | 'buchung';

export interface SichtZeile {
  art: OeffentlicheArt;
  token: string;
  /** YYYY-MM-DD */
  gueltigBis?: string;
  widerrufen?: boolean;
  sicht: unknown;
}

export interface LinkZeile {
  token: string;
  betrieb_id: string;
  art: string;
  gueltig_bis?: string | null;
}

export const TOKEN_MUSTER = /^[A-Za-z0-9_-]{16,64}$/;

export function artPruefen(x: unknown): OeffentlicheArt | undefined {
  return x === 'portal' || x === 'buchung' ? x : undefined;
}

/** Darf diese Sicht ausgeliefert werden? */
export function sichtGueltig(z: SichtZeile | undefined, art: OeffentlicheArt, link: LinkZeile | undefined, jetzt = new Date()): boolean {
  if (!z || z.art !== art || z.widerrufen) return false;
  const tag = jetzt.toISOString().slice(0, 10);
  if (z.gueltigBis && z.gueltigBis < tag) return false;
  if (link) {
    if (link.art && link.art !== art) return false;
    if (link.gueltig_bis && link.gueltig_bis.slice(0, 10) < tag) return false;
  }
  return true;
}

export type EingabeTyp = 'geoeffnet' | 'nachricht' | 'angebot' | 'buchung';

export interface Eingabe {
  art: OeffentlicheArt;
  token: string;
  typ: EingabeTyp;
  daten: Record<string, unknown>;
}

const TYPEN: Record<OeffentlicheArt, EingabeTyp[]> = { portal: ['geoeffnet', 'nachricht', 'angebot'], buchung: ['geoeffnet', 'buchung'] };

const text = (x: unknown, max: number) => (typeof x === 'string' ? x.trim().slice(0, max) : undefined);

/** Eingabe vom Kunden prüfen und auf erlaubte Felder kürzen. Fehlertext in Sie-Form. */
export function eingabePruefen(roh: unknown): { ok: true; eingabe: Eingabe } | { ok: false; fehler: string } {
  if (!roh || typeof roh !== 'object') return { ok: false, fehler: 'Ungültige Anfrage.' };
  const r = roh as Record<string, unknown>;
  const art = artPruefen(r.art);
  const token = typeof r.token === 'string' && TOKEN_MUSTER.test(r.token) ? r.token : undefined;
  const typ = r.typ as EingabeTyp;
  if (!art || !token || !TYPEN[art].includes(typ)) return { ok: false, fehler: 'Ungültige Anfrage.' };
  const d = (r.daten && typeof r.daten === 'object' ? r.daten : {}) as Record<string, unknown>;
  let daten: Record<string, unknown> = {};
  if (typ === 'nachricht') {
    const t = text(d.text, 4000);
    if (!t || t.length < 2) return { ok: false, fehler: 'Bitte schreiben Sie kurz, worum es geht.' };
    daten = { text: t, auftragId: text(d.auftragId, 80) };
  } else if (typ === 'angebot') {
    const entscheidung = d.entscheidung === 'angenommen' || d.entscheidung === 'abgelehnt' ? d.entscheidung : undefined;
    const name = text(d.name, 120);
    const angebotId = text(d.angebotId, 80);
    if (!entscheidung || !angebotId) return { ok: false, fehler: 'Ungültige Anfrage.' };
    if (!name || name.length < 3 || !/\s/.test(name)) return { ok: false, fehler: 'Bitte geben Sie Ihren vollständigen Namen ein (Vor- und Nachname).' };
    daten = { angebotId, entscheidung, name };
  } else if (typ === 'buchung') {
    const name = text(d.name, 120);
    const telefon = text(d.telefon, 40);
    if (!name || name.length < 2) return { ok: false, fehler: 'Bitte geben Sie Ihren Namen an.' };
    if (!telefon || telefon.replace(/[^\d]/g, '').length < 6) return { ok: false, fehler: 'Bitte geben Sie eine Telefonnummer an, unter der wir Sie erreichen.' };
    const start = text(d.start, 40);
    const fensterId = text(d.fensterId, 80);
    if (!start || !fensterId || Number.isNaN(Date.parse(start))) return { ok: false, fehler: 'Bitte wählen Sie einen Termin.' };
    daten = { fensterId, start, name, telefon, email: text(d.email, 160), strasse: text(d.strasse, 120), plz: text(d.plz, 10), ort: text(d.ort, 80), anliegen: text(d.anliegen, 2000) };
  } else {
    daten = { bezug: text(d.bezug, 120) };
  }
  return { ok: true, eingabe: { art, token, typ, daten } };
}
