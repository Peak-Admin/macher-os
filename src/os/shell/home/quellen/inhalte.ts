/**
 * Inhalte von Mission Mittelstand für das Home: Ansprechpartner, Neuigkeiten, Ankündigung.
 * Dafür gibt es noch kein Backend. Die Software spricht nur mit dieser Schnittstelle; bis das Paket Fundament
 * eine echte Quelle per `setzeHomeInhalte()` anhängt, liefern die Beispielinhalte aus `beispiel-inhalte.ts`.
 * Jede Quelle lädt für sich – fällt eine aus, funktionieren die anderen Widgets weiter.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Rolle } from '@core/objects';
import type { Ankuendigung, ContactPerson, NewsItem } from '../typen';
import { beispielInhalte } from './beispiel-inhalte';

export interface HomeInhalte {
  /** zugeordneter Ansprechpartner des Betriebs; null = noch keiner zugeordnet */
  ansprechpartner(): Promise<ContactPerson | null>;
  neuigkeiten(rolle: Rolle): Promise<NewsItem[]>;
  /** aktuelle Ankündigungen – der Banner zeigt davon höchstens eine */
  ankuendigungen(rolle: Rolle): Promise<Ankuendigung[]>;
}

let quelle: HomeInhalte = beispielInhalte;

const zwischenspeicher = new Map<string, unknown>();

export function setzeHomeInhalte(q: HomeInhalte | undefined) {
  quelle = q ?? beispielInhalte;
  zwischenspeicher.clear();
}

export function homeInhalte(): HomeInhalte {
  return quelle;
}

export type Ladezustand<T> = { status: 'laedt' } | { status: 'fehler'; nochmal: () => void } | { status: 'da'; daten: T; nochmal: () => void };

/**
 * Lädt eine Quelle unabhängig von den anderen – mit Fehlerzustand und „Erneut versuchen“.
 * Geladenes bleibt für die Sitzung im Zwischenspeicher: Verschieben im Editor lädt nichts neu.
 */
export function useLaden<T>(schluessel: string, laden: () => Promise<T>): Ladezustand<T> {
  const [versuch, setVersuch] = useState(0);
  const [fehler, setFehler] = useState<string>();
  const [, setGeladen] = useState(0);
  const lauf = `${schluessel}#${versuch}`;
  const nochmal = useCallback(() => {
    zwischenspeicher.delete(schluessel);
    setVersuch((v) => v + 1);
  }, [schluessel]);
  useEffect(() => {
    if (zwischenspeicher.has(schluessel)) return;
    let aktiv = true;
    laden().then(
      (daten) => {
        zwischenspeicher.set(schluessel, daten);
        if (aktiv) setGeladen((n) => n + 1);
      },
      () => aktiv && setFehler(lauf),
    );
    return () => {
      aktiv = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lauf]);
  if (zwischenspeicher.has(schluessel)) return { status: 'da', daten: zwischenspeicher.get(schluessel) as T, nochmal };
  if (fehler === lauf) return { status: 'fehler', nochmal };
  return { status: 'laedt' };
}
