import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { heute, personName } from '@core/format';
import { kontextAusDb } from '../verfuegbarkeit/daten';
import { kalenderwoche } from '../kalender/daten';
import { auslastung, teamWoche } from './daten';
import { AuslastungSeite, AuslastungWidget } from './Auslastung';

export default defineModul({
  id: 'auslastung',
  titel: 'Auslastung',
  bereich: 'plan',
  beschreibung: 'Zeigt, wo Mitarbeiter noch frei oder schon überlastet sind.',
  icon: 'diagramm',
  gewicht: 70,
  routen: [{ pfad: '', element: AuslastungSeite }],
  hubWidget: AuslastungWidget,
  kurzinfo: () => {
    const d = auslastung(kontextAusDb(), heute(), 1);
    if (!d.length) return undefined;
    const s = teamWoche(d, 0);
    return { text: s.verfuegbar ? `${Math.round(s.quote * 100)} % diese Woche` : 'Diese Woche niemand da', ton: s.quote > 1 ? 'achtung' : 'neutral' };
  },
  hinweise: () => {
    const liste: HinweisVorschlag[] = [];
    for (const m of auslastung(kontextAusDb(), heute(), 2)) {
      m.wochen.forEach((w, i) => {
        if (w.bewertung !== 'ueberlast') return;
        liste.push({
          schluessel: `auslastung-ueberlast:${m.mitarbeiterId}:${w.wochenStart}`,
          art: 'entscheidung',
          titel: `${personName(db.mitarbeiter.get(m.mitarbeiterId))} ist ${i === 0 ? 'diese' : 'nächste'} Woche überlastet`,
          text: `${w.text} (KW ${kalenderwoche(w.wochenStart)}). Verteile Einsätze um oder plane sie später ein.`,
          gewicht: i === 0 ? 62 : 50,
          fuerRollen: ['chef', 'buero'],
          pfad: `/plan/einsatzplanung?woche=${w.wochenStart}`,
        });
      });
    }
    return liste;
  },
});
