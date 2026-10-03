/** Aktionen der Mahnungen für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import { AktionsFehler, type AktionDef } from '@core/gateway';
import { tageZwischen } from '@core/format';
import type { Datum, ID } from '@core/objects';
import { offenePosten } from '../rechnungen/logik';
import type { RechnungX } from '../rechnungen/typen';
import { mahnungen, mahnungMailto, naechsteStufe, senden, vorbereiten, type Stufe } from './daten';

/** Vorbereitete (noch nicht versendete) Mahnung einer Rechnung */
const vorbereitet = (rechnungId: ID) => mahnungen.where((m) => m.rechnungId === rechnungId && m.status === 'vorbereitet')[0];

/** Welche Rechnungen sind „länger als N Tage offen“, überfällig – und heute für eine Erinnerung dran? */
export function erinnerungsKandidaten(heute: Datum, tage = 14): { r: RechnungX; stufe: Stufe; tageOffen: number }[] {
  return offenePosten()
    .map((r) => ({ r, stufe: naechsteStufe(r, undefined, heute) ?? vorbereitet(r.id)?.stufe, tageOffen: tageZwischen(r.datum, heute) }))
    .filter((x): x is { r: RechnungX; stufe: Stufe; tageOffen: number } => !!x.stufe && x.tageOffen > tage && x.r.faelligAm < heute);
}

export const MAHNUNG_AKTIONEN: AktionDef<{ rechnungId: ID }>[] = [
  {
    // Nächste Stufe (Zahlungserinnerung, 1. Mahnung …) nach den Mahnregeln vorbereiten und freigeben
    id: 'invoice.remind',
    titel: 'Zahlungserinnerung freigegeben',
    risiko: 'kritisch',
    rechte: ['geld', 'veroeffentlichen'],
    endgueltig: 'Was beim Kunden angekommen ist, lässt sich nicht zurückholen.',
    pruefe: (d, k) => {
      const r = offenePosten().find((x) => x.id === d.rechnungId);
      if (!r) return 'Die Rechnung ist nicht mehr offen – vielleicht wurde inzwischen bezahlt.';
      if (!vorbereitet(r.id) && !naechsteStufe(r, undefined, k.heute)) return `Für ${r.nummer} ist gerade keine Erinnerung dran.`;
      return undefined;
    },
    fuehreAus: (d, k) => {
      const r = offenePosten().find((x) => x.id === d.rechnungId);
      if (!r) throw new AktionsFehler('Die Rechnung ist nicht mehr offen.');
      const stufe = vorbereitet(r.id)?.stufe ?? naechsteStufe(r, undefined, k.heute);
      const m = vorbereitet(r.id) ?? (stufe ? vorbereiten(r, stufe, undefined, k.heute) : undefined);
      const gesendet = m && senden(m.id);
      if (!gesendet) throw new AktionsFehler(`Für ${r.nummer} konnte kein Schreiben freigegeben werden.`);
      const kunde = db.kunden.get(r.kundeId);
      // Handwerk OS verschickt das Schreiben nicht selbst: Die E-Mail öffnet der Mensch in seinem Mailprogramm
      return {
        bezug: { typ: 'rechnungen', id: r.id },
        text: kunde?.email ? `E-Mail an ${kunde.name} bereit` : `${kunde?.name ?? 'Kunde'} hat keine E-Mail – druck das Schreiben aus der Mahnung.`,
        oeffnen: kunde?.email ? [{ label: `E-Mail an ${kunde.name}`, url: mahnungMailto(gesendet) }] : undefined,
      };
    },
  },
];
