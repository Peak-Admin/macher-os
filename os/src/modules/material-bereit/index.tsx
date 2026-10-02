import { defineModul } from '@core/modul';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { benachrichtigen, erledigt } from '@core/macher';
import { pfadZu } from '@core/modul';
import { datumKurz, datumVon, plusTage } from '@core/format';
import type { ID } from '@core/objects';
import { kontextAusDb } from '../autoplanung/basis';
import { pruefeMaterial } from './daten';
import { bedarfPfad, MaterialBereit, VORLAUF_KEY } from './MaterialBereit';

const AUTOMATION = 'materialbereit.vorabend';

const checks = () => pruefeMaterial(kontextAusDb(), einstellung(VORLAUF_KEY, 5));

export default defineModul({
  id: 'material-bereit',
  titel: 'Material bereit?',
  bereich: 'plan',
  beschreibung: 'Prüft vor jedem Einsatz, ob das Material da ist – sonst sagt Macher rechtzeitig Bescheid.',
  icon: 'paket',
  gewicht: 68,
  navigation: 'hub',
  routen: [{ pfad: '', element: MaterialBereit }],
  hinweise: () => {
    const heute = kontextAusDb().heute;
    return checks()
      .filter((c) => c.ergebnis === 'problem')
      .map((c) => {
        const d = datumVon(c.termin.start);
        const fehlt = c.zeilen.filter((z) => z.pruefung.ergebnis === 'problem');
        const bedarf = bedarfPfad();
        return {
          schluessel: `material-fehlt:${c.auftrag.id}:${d}`,
          art: 'problem' as const,
          titel: `Material fehlt für Einsatz am ${datumKurz(d)}: ${c.auftrag.titel}`,
          text: fehlt.map((z) => z.pruefung.text).join(' '),
          bezug: { typ: 'auftraege' as const, id: c.auftrag.id },
          gewicht: d <= plusTage(heute, 1) ? 76 : 62,
          faellig: plusTage(d, -1),
          pfad: pfadZu({ typ: 'auftraege', id: c.auftrag.id }),
          aktionen: [
            ...(bedarf ? [{ aktion: 'materialbereit.bedarf', label: 'Bedarf öffnen', primaer: true }] : []),
            { aktion: 'materialbereit.auftrag', label: 'Material am Auftrag', primaer: !bedarf, payload: { auftragId: c.auftrag.id } },
          ],
        };
      });
  },
  aktionen: {
    'materialbereit.bedarf': () => bedarfPfad() ?? '/plan/material-bereit',
    'materialbereit.auftrag': (payload) => pfadZu({ typ: 'auftraege', id: ((payload ?? {}) as { auftragId: ID }).auftragId }) ?? '/plan/material-bereit',
  },
  automationen: [
    {
      id: AUTOMATION,
      titel: 'Material vor dem Einsatz prüfen',
      beschreibung: 'Fehlt Material für einen Einsatz heute oder morgen, bekommt das Büro sofort eine Nachricht.',
      standardAn: true,
      minuten: 10,
      start: () => () => {},
      pruefen: () => {
        const ctx = kontextAusDb();
        const key = `materialbereit.gemeldet.${ctx.heute}`;
        const gemeldet = einstellung<string[]>(key, []);
        const neu = pruefeMaterial(ctx, 1).filter((c) => c.ergebnis === 'problem' && !gemeldet.includes(c.auftrag.id));
        for (const c of neu) {
          benachrichtigen(`Material fehlt: ${c.auftrag.titel}`, {
            text: `Einsatz am ${datumKurz(c.termin.start)} – ${c.zeilen.filter((z) => z.pruefung.ergebnis === 'problem').map((z) => z.pruefung.loesung).join(' ')}`,
            bezug: { typ: 'auftraege', id: c.auftrag.id },
            wichtig: true,
          });
          erledigt(AUTOMATION, `Material geprüft: fehlt für „${c.auftrag.titel}“`, { bezug: { typ: 'auftraege', id: c.auftrag.id } });
        }
        if (neu.length) setzeEinstellung(key, [...gemeldet, ...neu.map((c) => c.auftrag.id)]);
      },
    },
  ],
});
