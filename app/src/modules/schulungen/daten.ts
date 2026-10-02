/**
 * Schulungen – eigene Sammlung `schulungen`.
 * Zeit, Titel und Teilnehmer stehen im Termin (`art: 'schulung'`) – die Schulung
 * ergänzt nur Inhalte, Anbieter, Qualifikation und das Ergebnis.
 */
import { db, defineCollection } from '@core/db';
import { datumVon, tageZwischen } from '@core/format';
import type { Basis, Datum, ID, Mitarbeiter, Nachweis, Qualifikation, Termin, Zeitpunkt } from '@core/objects';
import { aktuellerNachweis, gueltigBisAus } from '@modules/qualifikationen/daten';

export interface Schulung extends Basis {
  terminId: ID;
  qualifikationId?: ID;
  inhalte?: string;
  anbieter?: string;
  status: 'geplant' | 'abgeschlossen' | 'abgesagt';
  /** wer tatsächlich teilgenommen hat (beim Abschluss bestätigt) */
  teilgenommenIds?: ID[];
  abgeschlossenAm?: Zeitpunkt;
}

export const schulungen = defineCollection<Schulung>('schulungen');

export const STATUS_LABEL: Record<Schulung['status'], string> = {
  geplant: 'Geplant',
  abgeschlossen: 'Abgeschlossen',
  abgesagt: 'Abgesagt',
};

/** Nachweise für alle Teilnehmer erzeugen bzw. verlängern. Gibt die Anzahl zurück. */
export function nachweiseErzeugen(s: Schulung): number {
  if (!s.qualifikationId || !s.teilgenommenIds?.length) return 0;
  const t = db.termine.get(s.terminId);
  const q = db.qualifikationen.get(s.qualifikationId);
  if (!t || !q) return 0;
  const erworbenAm = datumVon(t.start);
  const gueltigBis = gueltigBisAus(erworbenAm, q.gueltigMonate);
  let n = 0;
  for (const maId of s.teilgenommenIds) {
    const doppelt = db.nachweise.all().find((x) => x.mitarbeiterId === maId && x.qualifikationId === q.id && x.erworbenAm === erworbenAm);
    if (doppelt) continue;
    db.nachweise.create({ mitarbeiterId: maId, qualifikationId: q.id, erworbenAm, gueltigBis });
    n++;
  }
  return n;
}

export interface Vorschlag {
  qualifikation: Qualifikation;
  personen: { mitarbeiter: Mitarbeiter; grund: string; tage?: number }[];
}

/**
 * „Wer muss als Nächstes?“ – je Qualifikation die Mitarbeiter, deren Nachweis abgelaufen ist,
 * in den nächsten 90 Tagen abläuft oder (bei Pflicht-Qualifikationen) fehlt.
 * Wer schon für eine geplante Schulung angemeldet ist, fällt heraus.
 */
export function vorschlaege(opts: {
  heute: Datum;
  qualifikationen: Qualifikation[];
  mitarbeiter: Mitarbeiter[];
  nachweise: Nachweis[];
  schulungen: Schulung[];
  termine: Termin[];
  /** Qualifikationen, die über Unterweisungen laufen (nicht per Schulung) */
  ohneQualiIds?: Set<ID>;
}): Vorschlag[] {
  const { heute, qualifikationen, mitarbeiter, nachweise } = opts;
  const angemeldet = new Set<string>();
  for (const s of opts.schulungen) {
    if (s.status !== 'geplant' || !s.qualifikationId || s.geloeschtAm) continue;
    const t = opts.termine.find((x) => x.id === s.terminId);
    if (!t || datumVon(t.start) < heute) continue;
    t.mitarbeiterIds.forEach((m) => angemeldet.add(`${s.qualifikationId}:${m}`));
  }
  const aktive = mitarbeiter.filter((m) => m.aktiv && !m.geloeschtAm);
  const liste: Vorschlag[] = [];
  for (const q of qualifikationen) {
    if (q.geloeschtAm || opts.ohneQualiIds?.has(q.id)) continue;
    const personen: Vorschlag['personen'] = [];
    for (const m of aktive) {
      if (angemeldet.has(`${q.id}:${m.id}`)) continue;
      const n = aktuellerNachweis(nachweise, m.id, q.id);
      if (n?.gueltigBis) {
        const tage = tageZwischen(heute, n.gueltigBis);
        if (tage < 0) personen.push({ mitarbeiter: m, grund: 'abgelaufen', tage });
        else if (tage <= 90) personen.push({ mitarbeiter: m, grund: tage === 0 ? 'läuft heute ab' : `läuft in ${tage} Tagen ab`, tage });
      } else if (!n && q.kategorie === 'pflicht' && m.rolle !== 'buero') {
        personen.push({ mitarbeiter: m, grund: 'fehlt noch' });
      }
    }
    if (personen.length) {
      personen.sort((a, b) => (a.tage ?? 9999) - (b.tage ?? 9999));
      liste.push({ qualifikation: q, personen });
    }
  }
  // Dringendstes zuerst
  return liste.sort((a, b) => (a.personen[0].tage ?? 9999) - (b.personen[0].tage ?? 9999));
}
