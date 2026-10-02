import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { heute, passt, plusTage } from '@core/format';
import { kommendeEinsaetze } from '../auftraege/logik';
import { ArbeitsanweisungenSeite } from './ArbeitsanweisungenSeite';
import { AnweisungSeite } from './AnweisungSeite';
import { AnweisungenAmAuftrag } from './AnweisungenAmAuftrag';
import { AnweisungTerminPanel } from './TerminPanel';
import { anweisungAnlegen, anweisungPfad, arbeitsanweisungen } from './daten';
import { seedArbeitsanweisungen } from './seed';

const AUSFUEHRUNG = ['beauftragt', 'in_arbeit'];

export default defineModul({
  id: 'arbeitsanweisungen',
  titel: 'Arbeitsanweisungen',
  bereich: 'auftraege',
  beschreibung: 'Zeigt dem Monteur klar, was vor Ort zu tun ist – mit Schritten, Fotos und Sicherheit.',
  icon: 'wissen',
  gewicht: 48,
  navigation: 'hub',
  routen: [
    { pfad: '', element: ArbeitsanweisungenSeite },
    { pfad: ':id', element: AnweisungSeite },
  ],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Arbeitsanweisung',
      component: AnweisungenAmAuftrag,
      gewicht: 55,
      zaehler: (id) => arbeitsanweisungen.where((x) => x.auftragId === id && !x.vorlage).length || undefined,
      sichtbar: (id) => {
        const a = db.auftraege.get(id);
        return !!a && (AUSFUEHRUNG.includes(a.phase) || arbeitsanweisungen.where((x) => x.auftragId === id).length > 0);
      },
    },
  ],
  panels: [{ objekt: 'termine', component: AnweisungTerminPanel, gewicht: 70 }],
  suche: (q) =>
    arbeitsanweisungen
      .where((x) => passt(q, x.titel, x.ziel, ...x.schritte.map((s) => s.text)))
      .slice(0, 5)
      .map((x) => ({ typ: 'Arbeitsanweisung', titel: x.titel, untertitel: x.vorlage ? 'Vorlage' : db.auftraege.get(x.auftragId)?.nummer, pfad: anweisungPfad(x.id), relevanz: 40 })),
  hinweise: () => {
    // Projekt-Einsatz in den nächsten 2 Tagen, aber keiner hat aufgeschrieben, was zu tun ist
    const bis = plusTage(heute(), 2);
    return db.auftraege
      .where((a) => AUSFUEHRUNG.includes(a.phase) && (a.art === 'projekt' || !a.beschreibung))
      .filter((a) => {
        const n = kommendeEinsaetze(db.termine.where((t) => t.auftragId === a.id))[0];
        return n && n.start.slice(0, 10) <= bis && !arbeitsanweisungen.where((x) => x.auftragId === a.id).length;
      })
      .map((a) => ({
        schluessel: `anweisung-fehlt:${a.id}`,
        art: 'problem' as const,
        titel: `${a.titel}: Einsatz steht an, aber keine Arbeitsanweisung`,
        text: 'Schreib in ein paar Schritten auf, was vor Ort zu tun ist – sonst ruft der Monteur an.',
        bezug: { typ: 'auftraege' as const, id: a.id },
        gewicht: 42,
        aktionen: [{ aktion: 'anweisung.anlegen', label: 'Anweisung schreiben', primaer: true, payload: { auftragId: a.id } }],
        pfad: `/auftrag/${a.id}`,
      }));
  },
  aktionen: {
    'anweisung.anlegen': (p) => {
      const id = (p as { auftragId?: string })?.auftragId;
      if (!id) return;
      const vorlage = arbeitsanweisungen.where((x) => !!x.vorlage)[0];
      return anweisungPfad(anweisungAnlegen(id, db.auftraege.get(id)?.art === 'projekt' ? arbeitsanweisungen.where((x) => !!x.vorlage && x.titel.startsWith('Baustelle'))[0]?.id ?? vorlage?.id : vorlage?.id).id, true);
    },
  },
  seed: seedArbeitsanweisungen,
});
