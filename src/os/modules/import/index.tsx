import { defineModul } from '@core/modul';
import { Assistent } from './Assistent';
import { importRueckgaengig, importe } from './daten';

/**
 * Daten übernehmen (Import & Wechselassistent): Kunden, Ansprechpartner, Mitarbeiter, Artikel, Leistungen,
 * Preise, offene Angebote, Aufträge und Rechnungen aus Excel oder CSV.
 * Erreichbar im Kontext: Betrieb › Einstellungen › Daten & Sicherung, per Suche („Excel“, „Import“) und per Link
 * `/betrieb/import?art=kunden` aus Leerzuständen.
 */
export default defineModul({
  id: 'import',
  titel: 'Daten übernehmen',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Kunden, Artikel, Preise und offene Rechnungen aus Excel oder einem anderen Programm übernehmen.',
  icon: 'upload',
  gewicht: 35,
  navigation: 'versteckt',
  routen: [{ pfad: '', element: Assistent }],
  aktionen: {
    'import.rueckgaengig': (payload) => {
      const id = (payload as { importId?: string } | undefined)?.importId;
      if (id) importRueckgaengig(id);
      return '/betrieb/import';
    },
  },
  suche: (q) => {
    if (!/import|excel|csv|übernehm|uebernehm|wechsel|umstieg|umzug|altes programm|datev|lexware|sevdesk|liste einlesen|einlesen/i.test(q)) return [];
    const letzter = [...importe.all()].sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))[0];
    return [
      {
        typ: 'Funktion',
        titel: 'Daten übernehmen',
        untertitel: letzter ? 'Kunden, Artikel, Preise, offene Rechnungen aus Excel oder CSV · zuletzt genutzt' : 'Kunden, Artikel, Preise, offene Rechnungen aus Excel oder CSV',
        pfad: '/betrieb/import',
        relevanz: 35,
      },
    ];
  },
});
