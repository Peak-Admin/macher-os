import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { heute, zahl } from '@core/format';
import type { Materialbuchung } from '@core/objects';
import { Bewegungen } from './Bewegungen';
import { Inventur } from './Inventur';
import { LagerBestand } from './LagerBestand';
import { bestandAm, buchen, HAUPTLAGER, istLagerartikel, lagerbewegungen, lagerortName, ortVonMitarbeiter, standardOrt, unterMindestbestand, fahrzeugOrt } from './daten';

const VERBRAUCH = 'lager.verbrauch-abbuchen';

/** Verbrauchtes Material am Auftrag vom Lager abbuchen (Fahrzeuglager des Monteurs, sonst Standardort). */
export function verbrauchAbbuchen(m: Materialbuchung) {
  if (m.status !== 'verbraucht' || !m.artikelId || m.menge <= 0) return;
  const a = db.artikel.get(m.artikelId);
  if (!a || !istLagerartikel(a)) return;
  if (lagerbewegungen.where((b) => b.materialId === m.id).length) return;
  const fz = ortVonMitarbeiter(m.mitarbeiterId);
  const von = fz && bestandAm(a, fz) > 0 ? fz : standardOrt(a);
  buchen({ art: 'entnahme', artikelId: a.id, menge: m.menge, von, auftragId: m.auftragId, materialId: m.id, mitarbeiterId: m.mitarbeiterId, notiz: 'Verbrauch am Auftrag' });
  erledigt(VERBRAUCH, `${zahl(m.menge)} ${a.einheit} ${a.name} aus ${lagerortName(von)} abgebucht`, { bezug: { typ: 'auftraege', id: m.auftragId } });
}

export default defineModul({
  id: 'lager',
  titel: 'Lager',
  bereich: 'betrieb',
  gruppe: 'material',
  beschreibung: 'Bestände im Hauptlager und in jedem Fahrzeug. Inventur direkt am Handy.',
  icon: 'lager',
  gewicht: 50,
  routen: [
    { pfad: '', element: LagerBestand },
    { pfad: 'inventur', element: Inventur },
    { pfad: 'bewegungen', element: Bewegungen },
  ],
  kurzinfo: () => {
    const lager = db.artikel.where(istLagerartikel);
    if (!lager.length) return undefined;
    const unter = lager.filter(unterMindestbestand).length;
    return unter ? { text: `${unter} unter Mindestbestand`, ton: 'achtung' } : { text: 'Bestände in Ordnung', ton: 'erfolg' };
  },
  automationen: [
    {
      id: VERBRAUCH,
      titel: 'Verbrauch vom Lager abbuchen',
      beschreibung: 'Wird Material am Auftrag als verbraucht gebucht, zieht Macher es vom Fahrzeuglager des Monteurs oder vom Hauptlager ab.',
      standardAn: true,
      minuten: 1,
      start: () => {
        const aus1 = on('material.created', (e) => verbrauchAbbuchen(e.objekt as Materialbuchung));
        const aus2 = on('material.updated', (e) => {
          const vorher = e.vorher as Materialbuchung | undefined;
          if (vorher?.status !== 'verbraucht') verbrauchAbbuchen(e.objekt as Materialbuchung);
        });
        return () => {
          aus1();
          aus2();
        };
      },
    },
  ],
  seed: () => {
    // Beispiel: etwas Material liegt im ersten Fahrzeug
    const fz = db.betriebsmittel.where((b) => b.art === 'fahrzeug' && !!b.beispiel)[0];
    if (!fz) return;
    for (const a of db.artikel.where((x) => istLagerartikel(x) && (x.bestand ?? 0) > 2).slice(0, 3)) {
      const menge = Math.max(1, Math.floor((a.bestand ?? 0) / 4));
      lagerbewegungen.create({ art: 'umbuchung', artikelId: a.id, menge, von: HAUPTLAGER, nach: fahrzeugOrt(fz.id), datum: heute(), notiz: 'Fahrzeug bestückt', beispiel: true });
    }
  },
});
