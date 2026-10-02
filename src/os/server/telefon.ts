/**
 * Telefon-Eingang auf dem Server – reine Logik ohne Netz (getestet in `telefon.test.ts`).
 * Genutzt von `src/app/api/telefon/eingang/route.ts`.
 *
 * Der Server legt nur das Gesprächsergebnis als Nachricht ab (`kanal: 'telefon'`, `anruf.status: 'neu'`).
 * Kunde erkennen, Anfrage/Rückruf anlegen und Notfall melden macht die App (Automation `telefon.ki-anrufe`) –
 * eine Stelle für die Fachlogik, gleich für Probeanruf, Simulator und echten Anbieter.
 */
import { rohNachricht } from '@/os/modules/telefon/agent';
import type { TelefonEreignis, WerkzeugName } from '@/os/modules/telefon/anbieter/typen';
import { normTelefon, type KundeZeile } from './postfach';

export interface TelefonBestand {
  nachrichten: { id: string; anruf?: { anrufId?: string } }[];
  kunden: KundeZeile[];
}

export interface TelefonPlan {
  /** neue Nachrichten (je beendetem Anruf eine) */
  zeilen: { id: string; daten: Record<string, unknown> }[];
  /** Antworten auf Werkzeugaufrufe im Gespräch */
  werkzeuge: { anrufId: string; werkzeug: WerkzeugName; ergebnis: unknown }[];
  doppelt: number;
}

/** Werkzeug `kunde_suchen`: nur „bekannt“ – der Anrufer ist nicht verifiziert, also keine Kundendaten ans Telefon */
export function kundeBekannt(kunden: KundeZeile[], telefon: string | undefined): boolean {
  const n = normTelefon(telefon);
  return !!n && kunden.some((k) => !k.geloeschtAm && (normTelefon(k.telefon) === n || !!k.ansprechpartner?.some((a) => normTelefon(a.telefon) === n)));
}

export function telefonEingangPlanen(ereignisse: TelefonEreignis[], bestand: TelefonBestand, neu: { id: () => string; jetzt: Date }): TelefonPlan {
  const plan: TelefonPlan = { zeilen: [], werkzeuge: [], doppelt: 0 };
  const bekannt = new Set(bestand.nachrichten.map((n) => n.anruf?.anrufId).filter(Boolean));
  const zeit = neu.jetzt.toISOString();
  for (const e of ereignisse) {
    if (e.typ === 'anruf.beendet') {
      if (bekannt.has(e.ergebnis.anrufId)) {
        plan.doppelt++;
        continue;
      }
      bekannt.add(e.ergebnis.anrufId);
      const id = neu.id();
      plan.zeilen.push({ id, daten: { id, erstelltAm: zeit, geaendertAm: zeit, ...rohNachricht(e.ergebnis) } });
    } else if (e.typ === 'werkzeug.aufgerufen') {
      // Geschrieben wird erst am Gesprächsende (anruf.beendet) – im Gespräch nur nachschlagen und bestätigen
      const ergebnis = e.werkzeug === 'kunde_suchen' ? { bekannt: kundeBekannt(bestand.kunden, String(e.argumente.telefon ?? '')) } : { ok: true };
      plan.werkzeuge.push({ anrufId: e.anrufId, werkzeug: e.werkzeug, ergebnis });
    }
  }
  return plan;
}
