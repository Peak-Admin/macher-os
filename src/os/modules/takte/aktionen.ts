/**
 * Aktionen der Takte (laufen über die `aktionAusfuehren`-Registry, registriert im Modul Benachrichtigungen)
 * und das Ausführen von Aktionen, die aus einer Benachrichtigung kommen.
 */
import { db, vermerken } from '@core/db';
import { heute } from '@core/format';
import { aktionAusfuehren, aktionVorhanden } from '@core/modul';
import { messen } from '@core/messung';
import type { Datum, ID } from '@core/objects';
import { merkeZeitenBestaetigt } from './browser';
import { textVonMinuten, uhrVon } from './zeit';

export const ZEITEN_BESTAETIGEN = 'takte.zeiten-bestaetigen';

/**
 * Ein Tipp bestätigt die Zeiten des Tages: Was heute noch läuft, endet jetzt; jeder Eintrag bekommt
 * den Vermerk „bestätigt“ im Zeitstrahl. Die Freigabe durch das Büro bleibt davon unberührt.
 */
export function zeitenBestaetigen(p: { mitarbeiterId: ID; datum: Datum }, jetzt = new Date()): number {
  if (!db.zeiten.where((x) => x.mitarbeiterId === p.mitarbeiterId && x.datum === p.datum).length) {
    throw new Error('Für diesen Tag ist noch keine Zeit erfasst. Trag sie zuerst nach.');
  }
  const ende = textVonMinuten(uhrVon(jetzt).minuten);
  if (p.datum === heute()) {
    for (const z of db.zeiten.where((x) => x.mitarbeiterId === p.mitarbeiterId && x.datum === p.datum && !x.ende)) {
      if (aktionVorhanden('zeiten.beenden')) aktionAusfuehren('zeiten.beenden', { zeitId: z.id, ende });
      else db.zeiten.update(z.id, { ende }, { text: `Beendet um ${ende} (Zeiten bestätigt)` });
    }
  }
  const eintraege = db.zeiten.where((x) => x.mitarbeiterId === p.mitarbeiterId && x.datum === p.datum && !!x.ende);
  for (const z of eintraege) vermerken({ typ: 'zeiten', id: z.id }, 'bestaetigt', 'Vom Mitarbeiter bestätigt (Takt „Zeiten bestätigen“)');
  merkeZeitenBestaetigt(p.mitarbeiterId, p.datum);
  messen('gewohnheit.zeiten_bestaetigt', { anzahl: eintraege.length });
  return eintraege.length;
}

export type Weg = 'benachrichtigung' | 'ansicht';

/**
 * Führt eine Aktion aus einem Takt aus und misst sie. Wirft, wenn die Aktion fehlt.
 * Rückgabe: optionaler Pfad, zu dem die Aktion führen will.
 */
export function taktAktionAusfuehren(takt: string, aktion: string, payload: unknown, weg: Weg): string | void {
  if (!aktionVorhanden(aktion)) throw new Error('Diese Aktion gibt es hier nicht mehr. Öffne den Eintrag und entscheide dort.');
  const ziel = aktionAusfuehren(aktion, payload);
  messen('gewohnheit.aktion_aus_benachrichtigung', { takt, aktion, weg });
  return ziel;
}

/** `?aktion=…&payload=…` aus dem Link der Benachrichtigung lesen */
export function aktionAusLink(suche: URLSearchParams): { aktion: string; payload: unknown } | undefined {
  const aktion = suche.get('aktion');
  if (!aktion) return undefined;
  const roh = suche.get('payload');
  let payload: unknown;
  try {
    payload = roh ? JSON.parse(roh) : undefined;
  } catch {
    payload = undefined;
  }
  return { aktion, payload };
}

/** Link für eine Aktion an der Benachrichtigung (für Service Worker und E-Mail) */
export function aktionsLink(pfad: string, aktion: string, payload: unknown): string {
  const q = new URLSearchParams({ quelle: 'benachrichtigung', aktion });
  if (payload !== undefined) q.set('payload', JSON.stringify(payload));
  return `${pfad}?${q}`;
}
