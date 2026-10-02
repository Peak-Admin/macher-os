import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { passt } from '@core/format';
import { BetriebsmittelListe } from './BetriebsmittelListe';
import { BetriebsmittelDetail } from './BetriebsmittelDetail';
import { BetriebsmittelFormular } from './BetriebsmittelFormular';
import { DefektSchnell, MitarbeiterGeraete, WerHatWasWidget } from './Widgets';
import { ART_LABEL, kurzinfoFuer, wiederEinsatzbereit, woIst, zurueckgeben } from './daten';

const Liste = () => <BetriebsmittelListe art="werkzeug" />;

export default defineModul({
  id: 'werkzeuge',
  titel: 'Werkzeuge',
  bereich: 'betrieb',
  gruppe: 'werkzeuge',
  beschreibung: 'Werkzeuge, Ausgabe, Standort und Verfügbarkeit – wer hat was?',
  icon: 'werkzeug',
  gewicht: 65,
  routen: [
    { pfad: '', element: Liste },
    { pfad: 'neu', element: BetriebsmittelFormular },
    { pfad: ':id', element: BetriebsmittelDetail },
    { pfad: ':id/bearbeiten', element: BetriebsmittelFormular },
  ],
  detail: [{ objekt: 'betriebsmittel', pfad: (id) => `/betrieb/werkzeuge/${id}` }],
  hubWidget: WerHatWasWidget,
  kurzinfo: () => kurzinfoFuer('werkzeug'),
  panels: [{ objekt: 'mitarbeiter', component: MitarbeiterGeraete, gewicht: 40 }],
  schnell: [{ id: 'defekt-melden', label: 'Defekt melden', icon: 'achtung', component: DefektSchnell, gewicht: 30 }],
  erstellen: [{ label: 'Werkzeug oder Gerät anlegen', pfad: '/betrieb/werkzeuge/neu', gewicht: 25 }],
  hinweise: () =>
    db.betriebsmittel
      .where((b) => b.status === 'defekt')
      .map((b) => ({
        schluessel: `betriebsmittel-defekt:${b.id}`,
        art: 'problem' as const,
        titel: `Defekt: ${b.name}`,
        text: [b.notiz?.split('\n').filter((z) => z.startsWith('Defekt')).pop(), woIst(b).text].filter(Boolean).join(' · '),
        bezug: { typ: 'betriebsmittel' as const, id: b.id },
        gewicht: b.art === 'fahrzeug' ? 60 : 45,
        aktionen: [{ aktion: 'betriebsmittel.repariert', label: 'Wieder einsatzbereit', payload: { id: b.id } }],
        pfad: `/betrieb/werkzeuge/${b.id}`,
      })),
  aktionen: {
    'betriebsmittel.repariert': (p) => {
      wiederEinsatzbereit((p as { id: string }).id);
    },
    'betriebsmittel.zurueck': (p) => {
      zurueckgeben((p as { id: string }).id);
    },
  },
  suche: (q) =>
    db.betriebsmittel
      .where((b) => b.status !== 'ausgemustert' && passt(q, b.name, b.inventarnummer, b.kennzeichen, b.hersteller, b.seriennummer))
      .slice(0, 8)
      .map((b) => ({ typ: ART_LABEL[b.art], titel: b.name, untertitel: [b.inventarnummer ?? b.kennzeichen, woIst(b).text].filter(Boolean).join(' · '), pfad: `/betrieb/werkzeuge/${b.id}`, relevanz: 55 })),
});
