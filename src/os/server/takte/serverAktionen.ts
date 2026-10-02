/**
 * Entscheiden ohne die App zu öffnen: Aktionen an einer Push-Mitteilung tragen einen signierten,
 * befristeten Schlüssel. Der Service Worker schickt ihn an `/api/takte/aktion`; der Server prüft
 * Signatur und Recht und schreibt die Änderung direkt in `objekte` (mit Eintrag im Zeitstrahl).
 *
 * Nur wenige, klar umrissene Aktionen laufen so – alles andere öffnet wie bisher die App.
 * Geheimnis: `TAKTE_GEHEIMNIS`, sonst `CRON_SECRET`. Nur auf dem Server verwenden.
 */
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Abwesenheit, Mitarbeiter, Termin, Zeiteintrag } from '@core/objects';
import type { TaktAktion } from '@modules/takte/inhalt';
import { textVonMinuten, uhrVon } from '@modules/takte/zeit';
import { darf, type BetriebsDaten, type ObjektZeile } from './planen';

/** Aktion → nötiges Recht (leer = nur für sich selbst) */
export const SERVER_AKTIONEN: Record<string, { label: string; recht?: string }> = {
  'abwesenheit.genehmigen': { label: 'Genehmigt', recht: 'personal' },
  'abwesenheit.ablehnen': { label: 'Abgelehnt', recht: 'personal' },
  'termin.bestaetigen': { label: 'Termin bestätigt', recht: 'planen' },
  'takte.zeiten-bestaetigen': { label: 'Zeiten bestätigt' },
};

/** Schlüssel gilt so lange (danach öffnet der Knopf die App) */
export const GUELTIG_MS = 24 * 3600_000;

export interface SchluesselInhalt {
  /** Betrieb */
  b: string;
  /** Mitarbeiter, der entscheidet */
  m: string;
  /** Aktion */
  a: string;
  /** Payload der Aktion */
  p?: unknown;
  /** Takt */
  t: string;
  /** gültig bis (ms) */
  bis: number;
}

export const geheimnis = () => process.env.TAKTE_GEHEIMNIS ?? process.env.CRON_SECRET;

const signatur = (daten: string, geheim: string) => createHmac('sha256', geheim).update(daten).digest('base64url');

export function schluesselErstellen(inhalt: SchluesselInhalt, geheim: string): string {
  const daten = Buffer.from(JSON.stringify(inhalt)).toString('base64url');
  return `${daten}.${signatur(daten, geheim)}`;
}

export function schluesselPruefen(schluessel: string, geheim: string, jetzt = Date.now()): SchluesselInhalt | undefined {
  const [daten, sig] = schluessel.split('.');
  if (!daten || !sig) return undefined;
  const erwartet = Buffer.from(signatur(daten, geheim));
  const gegeben = Buffer.from(sig);
  if (erwartet.length !== gegeben.length || !timingSafeEqual(erwartet, gegeben)) return undefined;
  try {
    const inhalt = JSON.parse(Buffer.from(daten, 'base64url').toString()) as SchluesselInhalt;
    return inhalt.bis > jetzt ? inhalt : undefined;
  } catch {
    return undefined;
  }
}

/** Hängt an jede serverseitig ausführbare Aktion einen Schlüssel (ohne Geheimnis: unverändert) */
export function aktionenMitSchluessel(
  aktionen: TaktAktion[],
  ctx: { betriebId: string; mitarbeiterId: string; takt: string; geheim?: string; jetzt?: number },
): (TaktAktion & { schluessel?: string })[] {
  const geheim = ctx.geheim;
  return aktionen.map((a) =>
    geheim && SERVER_AKTIONEN[a.aktion]
      ? { ...a, schluessel: schluesselErstellen({ b: ctx.betriebId, m: ctx.mitarbeiterId, a: a.aktion, p: a.payload, t: ctx.takt, bis: (ctx.jetzt ?? Date.now()) + GUELTIG_MS }, geheim) }
      : a,
  );
}

type Ergebnis = { zeilen: ObjektZeile[]; text: string } | { fehler: string };

const ereignis = (m: Mitarbeiter, bezug: { typ: string; id: string }, typ: string, text: string, jetzt: Date): ObjektZeile => {
  const id = randomUUID();
  const t = jetzt.toISOString();
  return { sammlung: 'ereignisse', id, daten: { id, typ, bezug, text, vonMitarbeiterId: m.id, erstelltAm: t, geaendertAm: t, erstelltVon: m.id } };
};

/** Rein: welche Zeilen ändern sich? Prüft Recht und Zustand. */
export function aktionAnwenden(aktion: string, payload: unknown, d: BetriebsDaten, m: Mitarbeiter, jetzt = new Date()): Ergebnis {
  const def = SERVER_AKTIONEN[aktion];
  if (!def) return { fehler: 'Diese Aktion geht nur in der App.' };
  if (def.recht && !darf(d.einstellungen, m.rolle, def.recht)) return { fehler: 'Dafür fehlt dir das Recht.' };
  const p = (payload ?? {}) as Record<string, string>;
  const t = jetzt.toISOString();

  if (aktion === 'abwesenheit.genehmigen' || aktion === 'abwesenheit.ablehnen') {
    const a = d.bestand.abwesenheiten.find((x) => x.id === p.id) as Abwesenheit | undefined;
    if (!a) return { fehler: 'Den Antrag gibt es nicht mehr.' };
    if (a.status !== 'beantragt') return { fehler: `Der Antrag ist schon ${a.status === 'genehmigt' ? 'genehmigt' : 'abgelehnt'}.` };
    const status = aktion === 'abwesenheit.genehmigen' ? 'genehmigt' : 'abgelehnt';
    return {
      zeilen: [
        { sammlung: 'abwesenheiten', id: a.id, daten: { ...a, status } as unknown as Record<string, unknown> },
        ereignis(m, { typ: 'abwesenheiten', id: a.id }, status, `${status === 'genehmigt' ? 'Genehmigt' : 'Abgelehnt'} – direkt aus der Benachrichtigung`, jetzt),
      ],
      text: status === 'genehmigt' ? 'Urlaub genehmigt.' : 'Antrag abgelehnt.',
    };
  }

  if (aktion === 'termin.bestaetigen') {
    const termin = d.bestand.termine.find((x) => x.id === p.terminId) as Termin | undefined;
    if (!termin) return { fehler: 'Den Termin gibt es nicht mehr.' };
    if (termin.status !== 'geplant') return { fehler: 'Der Termin ist schon bestätigt oder erledigt.' };
    return {
      zeilen: [{ sammlung: 'termine', id: termin.id, daten: { ...termin, status: 'bestaetigt' } as unknown as Record<string, unknown> }, ereignis(m, { typ: 'termine', id: termin.id }, 'bestaetigt', 'Bestätigt – direkt aus der Benachrichtigung', jetzt)],
      text: 'Termin bestätigt.',
    };
  }

  // takte.zeiten-bestaetigen: nur die eigenen Zeiten
  if (p.mitarbeiterId !== m.id) return { fehler: 'Du kannst nur deine eigenen Zeiten bestätigen.' };
  const zeiten = d.bestand.zeiten.filter((z) => z.mitarbeiterId === m.id && z.datum === p.datum) as Zeiteintrag[];
  if (!zeiten.length) return { fehler: 'Für diesen Tag ist noch keine Zeit erfasst.' };
  const uhr = uhrVon(jetzt);
  const zeilen: ObjektZeile[] = [];
  for (const z of zeiten) {
    const neu = !z.ende && z.datum === uhr.datum ? { ...z, ende: textVonMinuten(Math.max(uhr.minuten, 0)) } : z;
    if (neu !== z) zeilen.push({ sammlung: 'zeiten', id: z.id, daten: neu as unknown as Record<string, unknown> });
    if (neu.ende) zeilen.push(ereignis(m, { typ: 'zeiten', id: z.id }, 'bestaetigt', 'Vom Mitarbeiter bestätigt (aus der Benachrichtigung)', jetzt));
  }
  const key = `takte.zeiten-bestaetigt.${m.id}.${p.datum}`;
  zeilen.push({ sammlung: 'einstellungen', id: key, daten: { id: key, wert: t, erstelltAm: t, geaendertAm: t } });
  return { zeilen, text: 'Zeiten bestätigt.' };
}
