import { defineModul } from '@core/modul';
import { automationAn } from '@core/macher';
import { heute } from '@core/format';
import { ich } from '@core/session';
import { MeinTagSeite, MeinTagWidget } from './MeinTag';
import { tagesplanAutomation, tagesplanVerschicken, TAGESPLAN_ID } from './automationen';
import { aufgabenFuer, termineAm } from './logik';

export default defineModul({
  id: 'mein-tag',
  titel: 'Mein Tag',
  bereich: 'heute',
  beschreibung: 'Termine, Einsätze, Besichtigungen, Schulungen und Aufgaben für heute.',
  icon: 'kalender',
  gewicht: 85,
  routen: [{ pfad: '', element: MeinTagSeite }],
  hubWidget: MeinTagWidget,
  kurzinfo: () => {
    const m = ich();
    if (!m) return undefined;
    const t = termineAm(heute(), m.id).length;
    const a = aufgabenFuer(m.id, heute()).length;
    if (!t && !a) return { text: 'Heute nichts geplant' };
    return { text: [t ? `${t} ${t === 1 ? 'Termin' : 'Termine'}` : null, a ? `${a} ${a === 1 ? 'Aufgabe' : 'Aufgaben'}` : null].filter(Boolean).join(' · '), ton: 'aktiv' };
  },
  automationen: [tagesplanAutomation],
  seed: () => {
    if (automationAn(TAGESPLAN_ID)) tagesplanVerschicken();
  },
});
