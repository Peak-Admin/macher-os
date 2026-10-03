/** Automatisch erledigen: Auswertung je Regel + Querschnitts-Prüfung aller `pruefen()`. */
import { db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { heute } from '@core/format';
import { automationAn, automationPruefen, erledigt } from '@core/macher';
import { pruefeFristen, webhooksZustellen } from '@core/ereignisse';
import { alleAutomationen, type Automation } from '@core/modul';
import type { Erledigung } from '@core/objects';

export const PRUEFUNG_ID = 'macher.pruefung';
export const INTERVALL_MS = 30 * 60 * 1000;

export interface RegelStatistik {
  anzahl: number;
  /** Summe der geschätzten Minuten */
  minuten: number;
  zuletzt?: string;
}

/** Wie oft lief die Regel im Zeitraum, wie viel Zeit hat sie geschätzt gespart? */
export function statistik(erledigungen: Erledigung[], regel: string, seit: string): RegelStatistik {
  const liste = erledigungen.filter((e) => e.regel === regel && e.erstelltAm >= seit);
  const alle = erledigungen.filter((e) => e.regel === regel);
  return {
    anzahl: liste.length,
    minuten: liste.reduce((s, e) => s + (e.minutenGespart ?? 0), 0),
    zuletzt: alle.reduce<string | undefined>((m, e) => (!m || e.erstelltAm > m ? e.erstelltAm : m), undefined),
  };
}

/** „ca. 2,5 Std.“ / „ca. 20 Min.“ – immer als Schätzung */
export function zeitText(minuten: number): string {
  if (minuten <= 0) return '–';
  if (minuten < 60) return `ca. ${Math.round(minuten)} Min.`;
  const std = Math.round((minuten / 60) * 2) / 2;
  return `ca. ${std.toLocaleString('de-DE')} Std.`;
}

/** Alle eingeschalteten Regeln mit `pruefen()` einmal laufen lassen. Gibt die Anzahl zurück. */
export function pruefeAlle(): number {
  let n = 0;
  for (const a of alleAutomationen()) {
    if (a.id === PRUEFUNG_ID || !a.pruefen || !automationAn(a.id)) continue;
    try {
      automationPruefen(a);
      n++;
    } catch (e) {
      console.error(`Prüfung ${a.id} fehlgeschlagen`, e);
    }
  }
  // Fristen als Ereignisse melden (z. B. `rechnung.ueberfaellig`) und fällige Webhooks zustellen
  try {
    pruefeFristen();
    void webhooksZustellen();
  } catch (e) {
    console.error('Fristprüfung fehlgeschlagen', e);
  }
  setzeEinstellung('macher.pruefung.zuletzt', new Date().toISOString());
  tagesprotokoll(n);
  return n;
}

/** Einmal am Tag im Erledigt-Protokoll vermerken – nicht bei jedem 30-Minuten-Lauf. */
function tagesprotokoll(n: number) {
  const t = heute();
  if (einstellung<string | undefined>('macher.pruefung.tag', undefined) === t) return;
  setzeEinstellung('macher.pruefung.tag', t);
  if (!db.betrieb.get('betrieb')?.onboardingFertig) return;
  erledigt(PRUEFUNG_ID, 'Tägliche Prüfung erledigt', { text: `${n === 1 ? '1 Regel' : `${n} Regeln`} auf Fristen und offene Punkte geprüft.` });
}

export const pruefungAutomation: Automation = {
  id: PRUEFUNG_ID,
  titel: 'Regelmäßig alles prüfen',
  beschreibung: 'Prüft beim Start und alle 30 Minuten, solange Handwerk OS offen ist, alle Fristen, Wartungen und offenen Punkte.',
  standardAn: true,
  minuten: 10,
  start: () => {
    const t = setInterval(pruefeAlle, INTERVALL_MS);
    return () => clearInterval(t);
  },
  // Beim Start ruft der Kern bereits jedes `pruefen()` auf – hier nur das Tagesprotokoll.
  pruefen: () => tagesprotokoll(alleAutomationen().filter((a) => a.id !== PRUEFUNG_ID && a.pruefen && automationAn(a.id)).length),
};
