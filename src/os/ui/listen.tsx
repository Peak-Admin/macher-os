/**
 * Gemeinsame Bausteine für Arbeitslisten: „Zuletzt bearbeitet“ (aus dem Verlauf) und das
 * Finanzmuster der Angebots- und Rechnungsliste (Brutto/Netto, Zeitraum, Status, Auftrag).
 * Logik: `./listen-logik.ts`.
 */
import { useState, type ReactNode } from 'react';
import { db } from '@core/db';
import { useEinstellung } from '@core/einstellungen';
import { heute } from '@core/format';
import { useIch } from '@core/session';
import type { Basis, ID } from '@core/objects';
import { Auswahl, Segmente } from './index';
import {
  BETRAGSARTEN,
  ZEITRAEUME,
  bearbeiterName,
  gueltigeBetragsart,
  gueltigerZeitraum,
  letzteBearbeitungen,
  nutzerSchluessel,
  passtFinanzFilter,
  zuletztText,
  type Betragsart,
  type LetzteBearbeitung,
  type Zeitraum,
} from './listen-logik';
import './listen.css';

// ------------------------------------------------------------------ Zuletzt bearbeitet

/**
 * Liefert für eine Sammlung eine Funktion „Zuletzt bearbeitet: Heute 14:32 · Anna“ je Objekt.
 * Einmal je Liste aufrufen (ein Durchlauf über den Verlauf), nicht je Zeile.
 * Ohne Verlaufseintrag (z. B. nach der Rotation) zählt `geaendertAm` des Objekts, ohne Namen.
 */
export function useZuletztBearbeitet(sammlung: string): (o: Basis) => string {
  const index = letzteBearbeitungen(db.ereignisse.all(), sammlung);
  const jetzt = new Date();
  return (o) => {
    const b: LetzteBearbeitung = index.get(o.id) ?? { zeit: o.geaendertAm };
    const vorname = b.mitarbeiterId ? db.mitarbeiter.get(b.mitarbeiterId)?.vorname : undefined;
    return zuletztText(b, bearbeiterName(b, vorname), jetzt);
  };
}

/** Dezente Metazeile, nur ab Tablet-Breite sichtbar */
export function ZuletztBearbeitet({ text }: { text: string }) {
  if (!text) return null;
  return <span className="mm-meta mm-zuletzt">Zuletzt bearbeitet: {text}</span>;
}

// ------------------------------------------------------------------ Finanzmuster

export type FinanzListe = 'angebote' | 'rechnungen';

export interface FinanzAnsicht {
  betragsart: Betragsart;
  setBetragsart: (b: Betragsart) => void;
  zeitraum: Zeitraum;
  setZeitraum: (z: Zeitraum) => void;
  auftragId: ID | '';
  setAuftragId: (id: ID | '') => void;
  /** Zeitraum und Auftrag passen? (Status filtert die Liste selbst) */
  passt: (o: { datum?: string; auftragId?: ID }) => boolean;
}

/** Brutto oder netto – je Nutzer gemerkt, gilt in allen Finanzlisten (auch im Tab „Angebote“ am Auftrag) */
export function useBetragsart(): [Betragsart, (b: Betragsart) => void] {
  const ich = useIch();
  const [roh, setze] = useEinstellung<Betragsart>(nutzerSchluessel('liste.betragsart', ich?.id), 'brutto');
  return [gueltigeBetragsart(roh), setze];
}

/**
 * Brutto/Netto und Zeitraum merkt sich die App je Nutzer (Einstellung mit Mitarbeiter-ID),
 * Brutto/Netto gilt für beide Listen gleich. Der Auftrag ist ein Filter für den Moment.
 */
export function useFinanzAnsicht(liste: FinanzListe): FinanzAnsicht {
  const ich = useIch();
  const [betragsart, setBetragsart] = useBetragsart();
  const [zeitraumRoh, setZeitraum] = useEinstellung<Zeitraum>(nutzerSchluessel(`liste.zeitraum.${liste}`, ich?.id), 'alle');
  const [auftragId, setAuftragId] = useState<ID | ''>('');
  const zeitraum = gueltigerZeitraum(zeitraumRoh);
  const tag = heute();
  return {
    betragsart,
    setBetragsart,
    zeitraum,
    setZeitraum,
    auftragId,
    setAuftragId,
    passt: (o) => passtFinanzFilter(o, { zeitraum, auftragId: auftragId || undefined }, tag),
  };
}

/**
 * Einheitliche Filterleiste für Angebote und Rechnungen: Status (Chips der Liste), darunter
 * Suche, Zeitraum, Auftrag und der helle Umschalter Brutto/Netto. Ab 320 px untereinander.
 */
export function FinanzFilter({
  ansicht,
  status,
  suche,
  auftraege,
}: {
  ansicht: FinanzAnsicht;
  /** Status-Filter der jeweiligen Liste (`<Filter>`) */
  status: ReactNode;
  /** Suchfeld der Liste */
  suche?: ReactNode;
  /** Aufträge, die in der Liste vorkommen */
  auftraege: { id: ID; label: string }[];
}) {
  const gewaehlt = ansicht.auftragId && !auftraege.some((a) => a.id === ansicht.auftragId) ? [{ id: ansicht.auftragId, label: 'Gewählter Auftrag' }] : [];
  return (
    <div className="mm-finanzfilter">
      {status}
      <div className="mm-finanzfilter-zeile">
        {suche && <div className="mm-finanzfilter-suche">{suche}</div>}
        <Auswahl label="Zeitraum" value={ansicht.zeitraum} onChange={(e) => ansicht.setZeitraum(e.target.value as Zeitraum)} optionen={ZEITRAEUME} />
        <Auswahl
          label="Auftrag"
          value={ansicht.auftragId}
          onChange={(e) => ansicht.setAuftragId(e.target.value)}
          leer="Alle Aufträge"
          optionen={[...auftraege, ...gewaehlt].map((a) => ({ wert: a.id, label: a.label }))}
        />
        <Segmente<Betragsart> label="Beträge" wert={ansicht.betragsart} onChange={ansicht.setBetragsart} optionen={BETRAGSARTEN} />
      </div>
    </div>
  );
}

/** Auftragsoptionen für den Filter aus den Auftrags-IDs einer Liste („A-2026-014 · Bad Müller“) */
export function auftragOptionen(ids: (ID | undefined)[]): { id: ID; label: string }[] {
  const eindeutig = [...new Set(ids.filter((id): id is ID => !!id))];
  return eindeutig
    .map((id) => db.auftraege.get(id))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .sort((a, b) => b.nummer.localeCompare(a.nummer, 'de'))
    .map((a) => ({ id: a.id, label: [a.nummer, a.titel].filter(Boolean).join(' · ') }));
}

/** Summe der gefilterten Liste in der gewählten Betragsart („3 Rechnungen · Summe netto 1.200,00 €“) */
export function ListenSumme({ anzahl, einzahl, mehrzahl, summe, betragsart }: { anzahl: number; einzahl: string; mehrzahl: string; summe: string; betragsart: Betragsart }) {
  if (!anzahl) return null;
  return (
    <p className="mm-listensumme" aria-live="polite">
      <span>
        {anzahl} {anzahl === 1 ? einzahl : mehrzahl}
      </span>
      <span>
        Summe {betragsart}: <strong>{summe}</strong>
      </span>
    </p>
  );
}
