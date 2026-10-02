import { defineModul } from '@core/modul';
import { ich } from '@core/session';
import { ErledigtSeite, ErledigtWidget } from './Erledigt';
import { erledigungenIm, minutenText, zusammenfassen } from './logik';

export default defineModul({
  id: 'erledigt',
  titel: 'Erledigt',
  bereich: 'heute',
  beschreibung: 'Was Macher heute schon automatisch erledigt hat – mit Rückgängig.',
  icon: 'check',
  gewicht: 40,
  routen: [{ pfad: '', element: ErledigtSeite }],
  hubWidget: ErledigtWidget,
  kurzinfo: () => {
    const s = zusammenfassen(erledigungenIm('heute', ich()));
    if (!s.anzahl) return { text: 'Heute noch nichts' };
    return { text: `${s.anzahl} erledigt${s.minuten ? ` · ${minutenText(s.minuten)} gespart` : ''}`, ton: 'erfolg' };
  },
});
