import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import type { ID } from '@core/objects';
import { auftragIdAus } from '@modules/auftraege/daten';
import { istOffen } from '@modules/auftraege/logik';
import { AblaeufeSeite, AblaufBearbeiten } from './Ablaeufe';
import { ABLAUF_PFAD, angepasst, materialGeklaert, mitfuehren, weiter } from './daten';
import { ablaufHinweise } from './hinweise';
import { beiAbnahme, bezahltEvents, zusageEvents } from './regeln';

/** Ereignisse, nach denen sich der Schritt eines Auftrags ändern kann */
const MITFUEHREN = ['auftraege.created', 'auftraege.updated', 'auftraege.restored', 'termine.*', 'angebote.*', 'rechnungen.*', 'material.*', 'zahlungen.*'];

export default defineModul({
  id: 'ablauf',
  titel: 'Auftragsabläufe',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Der Ablauf deiner Aufträge: Schritte, Zuständige und Fristen – von der Anfrage bis zur Zahlung.',
  icon: 'liste',
  // niedrig: die Phasen-Automationen der Auftragsakte laufen zuerst, die feineren Schritte danach
  gewicht: 30,
  navigation: 'versteckt',
  rollen: ['chef', 'buero'],
  routen: [
    { pfad: '', element: AblaeufeSeite },
    { pfad: ':id', element: AblaufBearbeiten },
  ],
  kurzinfo: () => ({ text: angepasst() ? 'Eigene Abläufe' : 'Abläufe aus der Vorlage' }),
  hinweise: ablaufHinweise,
  aktionen: {
    'ablauf.weiter': (p) => {
      const id = (p as { auftragId?: ID } | undefined)?.auftragId;
      if (id) weiter(id);
    },
    'ablauf.material-geklaert': (p) => {
      const id = (p as { auftragId?: ID } | undefined)?.auftragId;
      if (id) materialGeklaert(id);
    },
    'ablauf.oeffnen': () => ABLAUF_PFAD,
  },
  // Buchführung des Schrittstands – immer an, unabhängig von den abschaltbaren Regeln
  init: () => {
    for (const muster of MITFUEHREN) on(muster, (e) => mitfuehren(auftragIdAus(e)));
  },
  automationen: [
    {
      id: 'ablauf.zusage',
      titel: 'Zusage → Vorbereitung',
      beschreibung: 'Nimmt der Kunde das Angebot an, steht der Auftrag auf „Vorbereitung“: Macher erinnert ans Material und sagt der Planung Bescheid.',
      standardAn: true,
      minuten: 3,
      start: () => {
        const a = on('angebote.updated', zusageEvents.angebot);
        const b = on('angebot.angenommen', zusageEvents.fachlich);
        return () => (a(), b());
      },
    },
    {
      id: 'ablauf.abnahme',
      titel: 'Abnahme → Rechnung',
      beschreibung: 'Ist die Abnahme unterschrieben, steht der Auftrag auf „Rechnung“. Fehlt sie noch, schlägt Macher vor, sie vorzubereiten.',
      standardAn: true,
      minuten: 2,
      start: () => on('abnahme.unterschrieben', (e) => beiAbnahme(auftragIdAus(e))),
    },
    {
      id: 'ablauf.bezahlt',
      titel: 'Bezahlt → Abschließen',
      beschreibung: 'Ist alles bezahlt, schließt Macher den Auftrag ab. Als Nächstes steht in der Akte: Bewertung anfragen.',
      standardAn: true,
      minuten: 2,
      start: () => {
        const a = on('rechnungen.updated', bezahltEvents.rechnung);
        const b = on('rechnung.bezahlt', bezahltEvents.fachlich);
        const c = on('zahlung.eingegangen', bezahltEvents.fachlich);
        return () => (a(), b(), c());
      },
      // einmal beim Start: Schrittstand aller laufenden Aufträge nachziehen (z. B. nach einem Import)
      pruefen: () => db.auftraege.all().filter(istOffen).forEach((a) => mitfuehren(a.id)),
    },
  ],
});
