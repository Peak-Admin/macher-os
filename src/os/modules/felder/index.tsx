import { defineModul, pfadZu } from '@core/modul';
import { panelFuer } from './EigeneAngaben';
import { Felder } from './Felder';
import { SAMMLUNG_LABEL, eigeneFelder, eigeneFormulare, feldwertTreffer, objektTitel } from './daten';

/**
 * Eigene Felder & Formulare: Angaben, die Macher nicht kennt, an Kunde, Ort, Anlage, Auftrag (auch Aufmaß,
 * Wartung, Abnahme), Mitarbeiter und Termin. Hängt sich als Panel „Eigene Angaben“ in die Detailansichten –
 * kein neuer Bereich, unsichtbar, solange es keine eigenen Felder gibt. Verwaltung im Kontext unter
 * Betrieb › Einstellungen.
 */
export default defineModul({
  id: 'felder',
  titel: 'Eigene Felder',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Eigene Felder und Formulare für Kunden, Orte, Anlagen, Aufträge und Termine.',
  icon: 'liste',
  gewicht: 30,
  navigation: 'versteckt',
  routen: [{ pfad: '', element: Felder }],
  panels: (['kunden', 'orte', 'anlagen', 'auftraege', 'mitarbeiter', 'termine'] as const).map((objekt) => ({ objekt, component: panelFuer(objekt), gewicht: 20 })),
  kurzinfo: () => {
    const n = eigeneFelder.all().length;
    const f = eigeneFormulare.all().length;
    if (!n && !f) return undefined;
    return { text: [n ? (n === 1 ? '1 eigenes Feld' : `${n} eigene Felder`) : '', f ? (f === 1 ? '1 Formular' : `${f} Formulare`) : ''].filter(Boolean).join(', ') };
  },
  suche: (q) => {
    const treffer = feldwertTreffer(q).flatMap(({ wert, feld, text }) => {
      const pfad = pfadZu(wert.bezug);
      if (!pfad) return [];
      return [{ typ: SAMMLUNG_LABEL[wert.bezug.typ] ?? 'Eintrag', titel: objektTitel(wert.bezug), untertitel: `${feld.label}: ${text}`, pfad, relevanz: 45 }];
    });
    if (/eigene?s? feld|felder|formular|zusatzfeld|zusatzangabe|prüfprotokoll|pruefprotokoll/i.test(q))
      treffer.push({ typ: 'Funktion', titel: 'Eigene Felder & Formulare', untertitel: 'Eigenes Feld hinzufügen, Formulare anlegen', pfad: '/betrieb/felder', relevanz: 30 });
    return treffer;
  },
});
