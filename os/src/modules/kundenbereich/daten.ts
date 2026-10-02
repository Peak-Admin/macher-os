/**
 * Kundenbereich: Zugänge (Token je Kunde, mit Ablauf, widerrufbar) und was der Kunde sehen darf.
 *
 * Der Kunde sieht nur Daten, die über seine kundeId (direkt oder über den Auftrag) zu ihm gehören –
 * keine Entwürfe, keine internen Termine, nur Dokumente mit `fuerKunde`.
 */
import { db, defineCollection, vermerken } from '@core/db';
import { emit } from '@core/events';
import { ablehnen, annehmen } from '@modules/angebote/daten';
import { benachrichtigen } from '@core/macher';
import { heute, plusTage, summen } from '@core/format';
import type { Angebot, Basis, Datum, Dokument, ID, Rechnung, Termin, Zeitpunkt } from '@core/objects';

export interface Portalzugang extends Basis {
  kundeId: ID;
  token: string;
  gueltigBis: Datum;
  widerrufenAm?: Zeitpunkt;
  letzterZugriffAm?: Zeitpunkt;
}

export const portalzugaenge = defineCollection<Portalzugang>('portalzugaenge');

export const STANDARD_TAGE = 90;

/** 24 Zeichen, URL-sicher, nicht erratbar */
export function neuesToken(): string {
  const bytes = new Uint8Array(18);
  globalThis.crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export type ZugangsPruefung = { ok: true; zugang: Portalzugang } | { ok: false; grund: 'unbekannt' | 'widerrufen' | 'abgelaufen' };

export function zugangPruefen(z: Portalzugang | undefined, stichtag: Datum = heute()): ZugangsPruefung {
  if (!z || z.geloeschtAm) return { ok: false, grund: 'unbekannt' };
  if (z.widerrufenAm) return { ok: false, grund: 'widerrufen' };
  if (z.gueltigBis < stichtag) return { ok: false, grund: 'abgelaufen' };
  return { ok: true, zugang: z };
}

export function zugangZuToken(token: string | undefined): Portalzugang | undefined {
  if (!token) return undefined;
  return portalzugaenge.allMitGeloeschten().find((z) => z.token === token);
}

export function aktiverZugang(kundeId: ID, stichtag: Datum = heute()): Portalzugang | undefined {
  return portalzugaenge
    .where((z) => z.kundeId === kundeId)
    .filter((z) => zugangPruefen(z, stichtag).ok)
    .sort((a, b) => b.gueltigBis.localeCompare(a.gueltigBis))[0];
}

export function zugangErzeugen(kundeId: ID, tage = STANDARD_TAGE, opts: { beispiel?: boolean } = {}): Portalzugang {
  const z = portalzugaenge.create({ kundeId, token: neuesToken(), gueltigBis: plusTage(heute(), tage), beispiel: opts.beispiel });
  vermerken({ typ: 'kunden', id: kundeId }, 'portal.erzeugt', 'Link zum Kundenbereich erzeugt');
  return z;
}

export function zugangWiderrufen(id: ID) {
  const z = portalzugaenge.get(id);
  if (!z) return;
  portalzugaenge.update(id, { widerrufenAm: new Date().toISOString() });
  vermerken({ typ: 'kunden', id: z.kundeId }, 'portal.widerrufen', 'Link zum Kundenbereich gesperrt');
}

export function zugangVerlaengern(id: ID, tage = STANDARD_TAGE) {
  portalzugaenge.update(id, { gueltigBis: plusTage(heute(), tage) });
}

export function portalLink(token: string, basis = globalThis.location?.origin ?? ''): string {
  return `${basis}/k/${token}`;
}

// ------------------------------------------------------------------ Was der Kunde sieht

export interface PortalDaten {
  termine: Termin[];
  angebote: Angebot[];
  dokumente: Dokument[];
  rechnungen: Rechnung[];
}

export function portalDaten(kundeId: ID, jetzt = new Date()): PortalDaten {
  const auftragIds = new Set(db.auftraege.where((a) => a.kundeId === kundeId).map((a) => a.id));
  const gehoert = (x: { kundeId?: ID; auftragId?: ID }) => x.kundeId === kundeId || (!!x.auftragId && auftragIds.has(x.auftragId));
  const ab = new Date(jetzt.getTime() - 86_400_000).toISOString();
  return {
    termine: db.termine
      .where((t) => gehoert(t) && t.art !== 'intern' && t.status !== 'abgesagt' && t.ende >= ab)
      .sort((a, b) => a.start.localeCompare(b.start)),
    angebote: db.angebote.where((a) => gehoert(a) && a.status !== 'entwurf').sort((a, b) => b.datum.localeCompare(a.datum)),
    dokumente: db.dokumente
      .where((d) => !!d.fuerKunde && (gehoert(d) || (d.bezug?.typ === 'kunden' && d.bezug.id === kundeId)))
      .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm)),
    rechnungen: db.rechnungen.where((r) => r.kundeId === kundeId && r.status !== 'entwurf').sort((a, b) => b.datum.localeCompare(a.datum)),
  };
}

export function bruttoVon(positionen: Angebot['positionen'], rabattProzent = 0): number {
  const b = db.betrieb.get('betrieb');
  return summen(positionen, b?.kleinunternehmer ? 0 : (b?.ustSatz ?? 19), rabattProzent).brutto;
}

/** Rechnungsstatus aus Kundensicht */
export function rechnungStatusKunde(r: Pick<Rechnung, 'status' | 'faelligAm'>, stichtag = heute()): { text: string; ton: 'erfolg' | 'achtung' | 'aktiv' | 'neutral' } {
  if (r.status === 'bezahlt') return { text: 'Bezahlt', ton: 'erfolg' };
  if (r.status === 'storniert') return { text: 'Storniert', ton: 'neutral' };
  if (r.faelligAm < stichtag) return { text: 'Zahlung überfällig', ton: 'achtung' };
  if (r.status === 'teilbezahlt') return { text: 'Teilweise bezahlt', ton: 'aktiv' };
  return { text: `Offen, fällig ${r.faelligAm.split('-').reverse().join('.')}`, ton: 'aktiv' };
}

export function angebotEntscheidbar(a: Pick<Angebot, 'status' | 'gueltigBis'>, stichtag = heute()): boolean {
  return a.status === 'versendet' && a.gueltigBis >= stichtag;
}

export type Entscheidung = 'angenommen' | 'abgelehnt';

/**
 * Kunde nimmt ein Angebot an oder lehnt es ab – mit Namensbestätigung.
 * Setzt den Status, schreibt den Verlauf und feuert `angebot.angenommen`.
 */
export function angebotEntscheiden(kundeId: ID, angebotId: ID, entscheidung: Entscheidung, name: string): { ok: true } | { ok: false; fehler: string } {
  const a = db.angebote.get(angebotId);
  if (!a || a.kundeId !== kundeId) return { ok: false, fehler: 'Dieses Angebot gibt es nicht.' };
  if (!angebotEntscheidbar(a)) return { ok: false, fehler: a.gueltigBis < heute() && a.status === 'versendet' ? 'Das Angebot ist abgelaufen. Bitte melden Sie sich kurz bei uns.' : 'Über dieses Angebot wurde schon entschieden.' };
  const unterschrift = name.trim();
  if (unterschrift.length < 3 || !/\s/.test(unterschrift)) return { ok: false, fehler: 'Bitte geben Sie Ihren vollständigen Namen ein (Vor- und Nachname).' };
  const zeit = new Date().toISOString();
  const text = `Angebot ${a.nummer} ${entscheidung === 'angenommen' ? 'angenommen' : 'abgelehnt'} von ${unterschrift} (Kundenbereich)`;
  // Derselbe Ablauf wie im Büro (Phase, ältere Versionen, Stunden fürs Planen) – nur mit Namen aus dem Kundenbereich
  if (entscheidung === 'angenommen') annehmen(angebotId, { name: unterschrift, quelle: 'portal', text: `Im Kundenbereich angenommen von ${unterschrift}` });
  else {
    ablehnen(angebotId, `Im Kundenbereich abgelehnt von ${unterschrift}`);
    emit({ typ: 'angebot.abgelehnt', objekt: db.angebote.get(angebotId), daten: { angebotId, auftragId: a.auftragId, name: unterschrift, quelle: 'portal', zeit } });
    // Annahmen meldet die Regel „Benachrichtigungen“; Absagen nur hier
    benachrichtigen(`Angebot abgelehnt: ${a.titel}`, { text: `${db.kunden.get(kundeId)?.name ?? 'Kunde'} – bestätigt von ${unterschrift}`, bezug: { typ: 'angebote', id: angebotId }, wichtig: true });
  }
  vermerken({ typ: 'auftraege', id: a.auftragId }, `angebot.${entscheidung}`, text, { name: unterschrift, zeit });
  vermerken({ typ: 'kunden', id: kundeId }, `angebot.${entscheidung}`, text);
  return { ok: true };
}

export function nachrichtSenden(kundeId: ID, text: string, auftragId?: ID): { ok: true } | { ok: false; fehler: string } {
  const t = text.trim();
  if (t.length < 2) return { ok: false, fehler: 'Bitte schreiben Sie kurz, worum es geht.' };
  if (t.length > 4000) return { ok: false, fehler: 'Die Nachricht ist zu lang. Bitte kürzen Sie sie auf 4000 Zeichen.' };
  db.nachrichten.create({ kanal: 'portal', richtung: 'ein', kundeId, auftragId: auftragId || undefined, text: t, gelesen: false, betreff: 'Nachricht aus dem Kundenbereich' });
  // Benachrichtigung kommt von der Regel „Benachrichtigungen“ (Kundennachricht) – nicht doppelt
  return { ok: true };
}
