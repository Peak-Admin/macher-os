import { defineModul } from '@core/modul';
import { offeneHinweise } from '@core/macher';
import { ich } from '@core/session';
import { BrauchtDichSeite, BrauchtDichWidget } from './BrauchtDich';

export default defineModul({
  id: 'braucht-dich',
  titel: 'Braucht dich',
  bereich: 'heute',
  beschreibung: 'Nur Probleme, Ausnahmen und Entscheidungen, bei denen ein Mensch gebraucht wird.',
  icon: 'achtung',
  gewicht: 95,
  routen: [{ pfad: '', element: BrauchtDichSeite }],
  hubWidget: BrauchtDichWidget,
  kurzinfo: () => {
    const m = ich();
    const n = offeneHinweise(m ? { rolle: m.rolle, mitarbeiterId: m.id } : undefined).length;
    return n ? { text: n === 1 ? '1 Punkt braucht dich' : `${n} Punkte brauchen dich`, ton: 'achtung' } : { text: 'Nichts brennt', ton: 'erfolg' };
  },
});
