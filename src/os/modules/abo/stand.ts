/**
 * Stand des Plans in der App: woher er kommt (Server oder lokal), Zustand für heute, Lesemodus.
 *
 * Den Lesemodus setzen wir nur durch, wenn Bezahlen möglich ist (Stand vom Server). Quelle mit Backend: `betriebe.plan` / `betriebe.test_bis` über `/api/abo/stand` (zwischengespeichert in der
 * Einstellung `abo.stand`). Ohne Backend: Testphase 30 Tage ab Einrichtung des Betriebs – ehrlich, ohne heimliche
 * Verlängerung. Zum Testen lässt sich die Zeit über die Einstellung `abo.versatzTage` verschieben.
 */
import { useMemo } from 'react';
import { SchreibGesperrt, db, sammlung, setzeSchreibschutz, useDatenstand, type Collection } from '@core/db';
import { emit } from '@core/events';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { heute, plusTage } from '@core/format';
import type { Basis } from '@core/objects';
import { NUR_AENDERN_SAMMLUNGEN, aktivePersonen, bilanz, planFuer, planMitId, schreibGrund, testBisAus, zustand, type Intervall, type Plan, type ServerStand, type Zustand } from './regeln';
import type { AboAntwort } from './api';

export const STAND_KEY = 'abo.stand';
export const VERSATZ_KEY = 'abo.versatzTage';
const LETZTER_STATUS_KEY = 'abo.letzterStatus';

/** Was der Server zusätzlich liefert (nur mit Stripe) */
export interface AboStand extends ServerStand {
  quelle: 'server' | 'lokal';
  abgerufenAm?: string;
  naechsteAbbuchung?: string;
  betragCent?: number;
  intervall?: Intervall;
  zahlungsart?: { art: 'sepa' | 'karte' | 'sonstige'; text: string };
  rechnungen?: { id: string; nummer?: string; datum: string; betragCent: number; status: string; pdf?: string; link?: string }[];
}

/** „Heute“ für den Plan – mit optionalem Versatz zum Testen */
export function aboHeute(): string {
  const versatz = Number(einstellung<number>(VERSATZ_KEY, 0)) || 0;
  return versatz ? plusTage(heute(), versatz) : heute();
}

export function aktuellerStand(): AboStand {
  const s = einstellung<AboStand | undefined>(STAND_KEY, undefined);
  if (s?.quelle === 'server') return s;
  const b = db.betrieb.get('betrieb');
  return { quelle: 'lokal', plan: 'test', testBis: testBisAus(b?.erstelltAm ?? new Date().toISOString()) };
}

export function aktuellerZustand(): Zustand {
  // Vor der Einrichtung gibt es nichts zu sperren
  if (!db.betrieb.get('betrieb')) return { status: 'test' };
  const stand = aktuellerStand();
  return { ...zustand(stand, aboHeute()), durchgesetzt: stand.quelle === 'server' };
}

/** Ist gerade wirklich nur Lesen erlaubt? */
export function lesemodusAktiv(z: Zustand = aktuellerZustand()): boolean {
  return z.status === 'lesemodus' && z.durchgesetzt !== false;
}

export function personen(): number {
  return aktivePersonen(db.mitarbeiter.allMitGeloeschten());
}

/** Plan für die Abrechnung: der gebuchte oder – in Test und Lesemodus – der aus der Teamgröße */
export function passenderPlan(): Plan {
  return planFuer(personen());
}

export function gebuchterPlan(z: Zustand = aktuellerZustand()): Plan | undefined {
  return planMitId(z.planId);
}

export function eigeneBilanz() {
  return bilanz({ angebote: db.angebote.allMitGeloeschten(), rechnungen: db.rechnungen.allMitGeloeschten(), zahlungen: db.zahlungen.allMitGeloeschten() });
}

/** Server-Antwort übernehmen (Cache in den Einstellungen, damit alle Geräte denselben Stand sehen) */
export function standUebernehmen(a: AboAntwort) {
  const neu: AboStand = { ...a, quelle: 'server', abgerufenAm: new Date().toISOString() };
  setzeEinstellung(STAND_KEY, neu);
  statusPruefen();
}

export function useAbo() {
  const v = useDatenstand();
  return useMemo(() => {
    const z = aktuellerZustand();
    return { stand: aktuellerStand(), zustand: z, passend: passenderPlan(), gebucht: gebuchterPlan(z), personen: personen(), bilanz: eigeneBilanz(), heute: aboHeute() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);
}

// ------------------------------------------------------------------ Lesemodus

/**
 * Schreibschutz einhängen: Der Prüfer rechnet bei jedem Schreiben den Zustand neu (billig, kein Cache nötig).
 * „Ändern ja, Anlegen nein“ für laufende Vorgänge (Rechnungen, Angebote, Aufträge, Termine) prüft ein
 * Vorschalter vor `create` – der Kern-Prüfer kennt nur den Sammlungsnamen (Kernwunsch im Bericht).
 */
export function lesemodusEinhaengen() {
  setzeSchreibschutz((name) => schreibGrund(name, aktuellerZustand(), 'aendern'));
  for (const name of NUR_AENDERN_SAMMLUNGEN) {
    const c = sammlung(name) as (Collection<Basis> & { __abo?: boolean }) | undefined;
    if (!c || c.__abo) continue;
    const anlegen = c.create;
    c.create = (neu, opts) => {
      const grund = schreibGrund(name, aktuellerZustand(), 'anlegen');
      if (grund) throw new SchreibGesperrt(grund);
      return anlegen(neu, opts);
    };
    c.__abo = true;
  }
}

/** Wechsel in den Lesemodus einmal melden (Event `abo.lesemodus`) */
export function statusPruefen() {
  if (!db.betrieb.get('betrieb')) return;
  const z = aktuellerZustand();
  const jetzt = lesemodusAktiv(z) ? 'lesemodus' : z.status === 'lesemodus' ? 'abgelaufen' : z.status;
  const vorher = einstellung<string | undefined>(LETZTER_STATUS_KEY, undefined);
  if (vorher === jetzt) return;
  setzeEinstellung(LETZTER_STATUS_KEY, jetzt);
  if (lesemodusAktiv(z)) emit({ typ: 'abo.lesemodus', daten: { grund: z.grund, planId: z.planId } });
}

export function istSchreibGesperrt(e: unknown): e is SchreibGesperrt {
  return e instanceof SchreibGesperrt || (typeof e === 'object' && e !== null && (e as { name?: string }).name === 'SchreibGesperrt');
}
