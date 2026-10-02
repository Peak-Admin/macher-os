import { db, vermerken } from '@core/db';
import { euro } from '@core/format';
import type { Angebot, ID } from '@core/objects';
import { entwurfFuer, positionenAnhaengen } from '@modules/angebote/daten';
import { aufmasse, zusammenfassen } from '@modules/aufmass/daten';
import { alsPositionen, kalkulationen, leereZeile, rechne, zeileAusLeistung, type KalkZeile } from './daten';

/** Mengen aus den Aufmaßen des Auftrags als Kalkulationszeilen (Aufmaß → Kalkulation) */
export function zeilenAusAufmass(auftragId: ID): { zeilen: KalkZeile[]; aufmassIds: ID[] } {
  const liste = aufmasse.where((a) => a.auftragId === auftragId);
  const leistungen = db.leistungen.all();
  const artikel = db.artikel.all();
  const zeilen = liste.flatMap((a) =>
    zusammenfassen(a, leistungen).map((s) => {
      const l = leistungen.find((x) => x.id === s.leistungId);
      return l ? zeileAusLeistung(l, artikel, s.menge) : { ...leereZeile(), text: s.text, menge: s.menge, einheit: s.einheit };
    }),
  );
  return { zeilen, aufmassIds: zeilen.length ? liste.map((a) => a.id) : [] };
}

/**
 * Kalkulierte Preise in den Angebotsentwurf des Auftrags übernehmen. Was diese Kalkulation (oder das Aufmaß,
 * aus dem sie ihre Mengen hat) dort schon eingetragen hat, wird ersetzt – nie doppelt.
 */
export function kalkulationUebernehmen(kalkulationId: ID): Angebot | undefined {
  const k = kalkulationen.get(kalkulationId);
  if (!k) return undefined;
  const pos = alsPositionen(k);
  if (!pos.length) return undefined;
  const ang = entwurfFuer(k.auftragId);
  const ersetzen = [
    ...(k.angebotId === ang.id ? (k.positionIds ?? []) : []),
    ...(k.ausAufmassIds ?? []).flatMap((id) => {
      const a = aufmasse.get(id);
      return a?.angebotId === ang.id ? (a.positionIds ?? []) : [];
    }),
  ];
  const neu = positionenAnhaengen(ang.id, pos, ersetzen);
  kalkulationen.update(k.id, { angebotId: ang.id, positionIds: pos.map((p) => p.id) }, { text: `In Angebot ${ang.nummer} übernommen` });
  vermerken({ typ: 'auftraege', id: k.auftragId }, 'kalkulation.uebernommen', `Kalkulation in Angebot ${ang.nummer} übernommen (${euro(rechne(k).summe.preis)} netto)`);
  return neu;
}
