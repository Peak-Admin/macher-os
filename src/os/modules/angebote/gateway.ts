/** Aktionen der Angebote für den Macher AI Gateway (`@core/gateway`). */
import { db } from '@core/db';
import { AktionsFehler, type AbsichtDef, type AktionDef } from '@core/gateway';
import type { ID } from '@core/objects';
import { kontaktArt } from '@modules/start/daten';
import { angebotSenden } from './erstwert';
import { modellKontext, POSITIONEN_VORSCHLAGEN, vorschlagAusModell, vorschlagAusRegeln, type PositionsVorschlag } from './vorschlag';

export interface AngebotSendenDaten {
  angebotId: ID;
  /** E-Mail oder Telefonnummer; ohne Angabe die des Kunden */
  an?: string;
}

const zielFuer = (d: AngebotSendenDaten) => {
  const a = db.angebote.get(d.angebotId);
  const k = db.kunden.get(a?.kundeId);
  return (d.an || k?.email || k?.telefon || '').trim();
};

export const ANGEBOT_AKTIONEN: AktionDef<AngebotSendenDaten>[] = [
  {
    id: 'offer.send',
    titel: 'Angebot versendet',
    risiko: 'kritisch',
    endgueltig: 'Ein gesendetes Angebot lässt sich nicht zurückholen.',
    rechte: ['veroeffentlichen'],
    pruefe: (d) => {
      const a = db.angebote.get(d.angebotId);
      if (!a) return 'Das Angebot gibt es nicht mehr.';
      if (a.status !== 'entwurf' && a.status !== 'versendet') return `Angebot ${a.nummer} ist schon entschieden.`;
      if (!a.positionen.length) return `Angebot ${a.nummer} hat noch keine Positionen.`;
      if (!kontaktArt(zielFuer(d))) return `Für ${db.kunden.get(a.kundeId)?.name ?? 'den Kunden'} ist keine E-Mail oder Handynummer hinterlegt.`;
      return undefined;
    },
    fuehreAus: async (d) => {
      const ziel = zielFuer(d);
      const r = await angebotSenden(d.angebotId, ziel, kontaktArt(ziel)!);
      if (r.status === 'fehler') throw new AktionsFehler(r.fehler ?? 'Das Angebot wurde nicht versendet.');
      return { bezug: { typ: 'angebote', id: d.angebotId }, text: `An ${ziel}` };
    },
  },
];

// ------------------------------------------------------------------ Positionen vorschlagen

const katalog = () => ({ leistungen: db.leistungen.where((l) => l.aktiv), artikel: db.artikel.where((a) => a.aktiv) });

/**
 * „Bad 8 m² fliesen, alte Fliesen raus, 2 Tage, Material ca. 900 €“ → Positionen als Vorschlag.
 * Nur gezielt aus dem Angebotsformular erreichbar (`direkt`). Regeln zuerst; ist Luna (oder stärker) angeschlossen und im
 * Kostenrahmen, verbessert das Modell den Vorschlag. Es ändert nichts: Übernehmen und Senden macht der Mensch.
 */
export const ANGEBOT_ABSICHTEN: AbsichtDef<PositionsVorschlag>[] = [
  {
    id: POSITIONEN_VORSCHLAGEN,
    titel: 'Angebotspositionen vorschlagen',
    risiko: 'schreiben',
    rechte: ['geld'],
    direkt: true,
    besserMit: 2,
    kontext: (_e, _k, text) => {
      const { leistungen, artikel } = katalog();
      return modellKontext(text, leistungen, artikel);
    },
    beantworte: (text, _e, _k, { modellText }) => {
      const { leistungen, artikel } = katalog();
      const ki = modellText ? vorschlagAusModell(modellText, text, leistungen, artikel) : undefined;
      return ki ? { positionen: ki, quelle: 'ki' } : { positionen: vorschlagAusRegeln(text, leistungen, artikel), quelle: 'regeln' };
    },
  },
];
