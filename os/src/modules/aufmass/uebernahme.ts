import { db, vermerken } from '@core/db';
import type { Angebot, ID } from '@core/objects';
import { entwurfFuer, positionenAnhaengen } from '@modules/angebote/daten';
import { alsPositionen, aufmasse } from './daten';

/** Mengen aus dem Aufmaß an den offenen Angebotsentwurf des Auftrags hängen (oder neuen anlegen) */
export function inAngebotUebernehmen(aufmassId: ID): Angebot | undefined {
  const a = aufmasse.get(aufmassId);
  if (!a) return undefined;
  const positionen = alsPositionen(a, db.leistungen.all());
  if (!positionen.length) return undefined;
  const entwurf = entwurfFuer(a.auftragId);
  const neu = positionenAnhaengen(entwurf.id, positionen, a.angebotId === entwurf.id ? a.positionIds : []);
  aufmasse.update(a.id, { angebotId: entwurf.id, uebernommenAm: new Date().toISOString(), positionIds: positionen.map((p) => p.id) }, { text: `In Angebot ${entwurf.nummer} übernommen` });
  vermerken({ typ: 'auftraege', id: a.auftragId }, 'aufmass.uebernommen', `Aufmaß in Angebot ${entwurf.nummer} übernommen`);
  return neu;
}
