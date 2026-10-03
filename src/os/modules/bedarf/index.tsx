import { defineModul } from '@core/modul';
import { on } from '@core/events';
import { BedarfAnsicht } from './BedarfAnsicht';
import { bedarfZusammenfassung, berechneBedarf, bestellvorschlag } from './daten';
import { BEDARF_AUTOMATION, bedarfHinweisAktualisieren, bedarfSpaeterPruefen } from './pruefung';
import { BEDARF_AKTIONEN } from './gateway';

export default defineModul({
  id: 'bedarf',
  titel: 'Bedarf',
  bereich: 'betrieb',
  gruppe: 'material',
  beschreibung: 'Erkennt, welches Material für kommende Aufträge fehlt – und schlägt die Bestellung vor.',
  icon: 'liste',
  gewicht: 62,
  routen: [{ pfad: '', element: BedarfAnsicht }],
  kurzinfo: () => {
    const s = bedarfZusammenfassung(berechneBedarf());
    if (s.auftrag) return { text: `${s.auftrag} ${s.auftrag === 1 ? 'Artikel fehlt' : 'Artikel fehlen'} für Aufträge`, ton: 'achtung' };
    if (s.mindest) return { text: `${s.mindest} unter Mindestbestand`, ton: 'aktiv' };
    return { text: 'Alles da', ton: 'erfolg' };
  },
  gateway: { aktionen: [...BEDARF_AKTIONEN] },
  aktionen: {
    'material.bestellvorschlag': () => {
      const b = bestellvorschlag();
      bedarfHinweisAktualisieren();
      return b.length === 1 ? `/betrieb/bestellungen/${b[0].id}` : '/betrieb/bestellungen';
    },
    'material.bedarf-oeffnen': () => '/betrieb/bedarf',
  },
  automationen: [
    {
      id: BEDARF_AUTOMATION,
      titel: 'Materialbedarf täglich prüfen',
      beschreibung: 'Lotte vergleicht geplantes Material aller anstehenden Aufträge mit Lager und Bestellungen und meldet sich mit einem fertigen Bestellvorschlag.',
      standardAn: true,
      minuten: 15,
      start: () => {
        const aus = ['material.*', 'artikel.*', 'bestellungen.*', 'auftraege.updated', 'termine.*', 'lagerbewegungen.*'].map((m) => on(m, bedarfSpaeterPruefen));
        const t = setInterval(bedarfSpaeterPruefen, 60 * 60 * 1000);
        return () => {
          aus.forEach((f) => f());
          clearInterval(t);
        };
      },
      pruefen: () => bedarfHinweisAktualisieren({ protokoll: true }),
    },
  ],
});
