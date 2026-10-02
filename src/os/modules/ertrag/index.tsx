import { defineModul } from '@core/modul';
import { ErtragSeite } from './ErtragSeite';

export default defineModul({
  id: 'ertrag',
  titel: 'Ertrag',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Zeigt, welche Aufträge, Kunden und Leistungen Geld verdienen.',
  icon: 'diagramm',
  gewicht: 50,
  routen: [{ pfad: '', element: ErtragSeite }],
});
