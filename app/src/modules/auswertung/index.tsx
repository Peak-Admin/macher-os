import { defineModul } from '@core/modul';
import { AuswertungSeite, AuswertungWidget } from './AuswertungSeite';

export default defineModul({
  id: 'auswertung',
  titel: 'Auswertung',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Zeigt die wichtigsten Zahlen zu Umsatz, Aufträgen, Auslastung und offenen Beträgen.',
  icon: 'diagramm',
  gewicht: 64,
  rollen: ['chef'],
  routen: [{ pfad: '', element: AuswertungSeite }],
  hubWidget: AuswertungWidget,
});
