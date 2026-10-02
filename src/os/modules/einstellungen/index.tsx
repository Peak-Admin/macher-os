import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { tageZwischen, heute } from '@core/format';
import { Betriebsdaten } from './Betriebsdaten';
import { DatenSicherung, sicherungHerunterladen } from './DatenSicherung';
import { Papierkorb } from './Papierkorb';
import { LETZTE_SICHERUNG_KEY, fehlendeRechnungsangaben } from './daten';

const SEITEN = [
  { worte: /einstellung|betrieb|adresse|steuer|ust|iban|bank|zahlungsziel|arbeitszeit|kleinunternehmer|stundensatz|betriebsbereich|kostenstelle/i, titel: 'Betriebsdaten', untertitel: 'Name, Adresse, Steuer, Bank, Stundensatz, Betriebsbereiche', pfad: '/betrieb/einstellungen' },
  { worte: /sicherung|backup|export|import|beispiel|onboarding|einrichtung|zurücksetzen/i, titel: 'Daten & Sicherung', untertitel: 'Sicherung, Beispieldaten, Einrichtung', pfad: '/betrieb/einstellungen/daten' },
  { worte: /papierkorb|gelöscht|wiederherstellen/i, titel: 'Papierkorb', untertitel: 'Gelöschtes wiederherstellen', pfad: '/betrieb/einstellungen/papierkorb' },
];

export default defineModul({
  id: 'einstellungen',
  titel: 'Einstellungen',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Betriebsdaten, Datensicherung und Papierkorb.',
  icon: 'einstellungen',
  gewicht: 60,
  routen: [
    { pfad: '', element: Betriebsdaten },
    { pfad: 'daten', element: DatenSicherung },
    { pfad: 'papierkorb', element: Papierkorb },
  ],
  kurzinfo: () => {
    const fehlt = fehlendeRechnungsangaben(db.betrieb.get('betrieb'));
    if (fehlt.length) return { text: `Fehlt: ${fehlt[0]}${fehlt.length > 1 ? ` und ${fehlt.length - 1} mehr` : ''}`, ton: 'achtung' };
    return { text: 'Betriebsdaten vollständig', ton: 'erfolg' };
  },
  suche: (q) => SEITEN.filter((s) => s.worte.test(q)).map((s) => ({ typ: 'Einstellung', titel: s.titel, untertitel: s.untertitel, pfad: s.pfad, relevanz: 25 })),
  hinweise: () => {
    const b = db.betrieb.get('betrieb');
    if (!b) return [];
    const liste = [];
    const fehlt = fehlendeRechnungsangaben(b);
    // Just in time: erst erinnern, wenn es schon echte Angebote oder Rechnungen gibt – vor dem ersten Senden fragt der Briefkopf-Check
    const dokumente = db.angebote.all().some((a) => !a.beispiel) || db.rechnungen.all().some((r) => !r.beispiel);
    if (fehlt.length && dokumente) {
      liste.push({
        schluessel: `einstellungen-rechnungsangaben:${fehlt.join(',')}`,
        art: 'problem' as const,
        titel: 'Betriebsdaten für Rechnungen vervollständigen',
        text: `Es fehlt: ${fehlt.join(', ')}. Ohne Anschrift und Steuernummer ist eine Rechnung nicht vollständig.`,
        gewicht: 64,
        fuerRollen: ['chef' as const],
        pfad: '/betrieb/einstellungen',
      });
    }
    const letzte = einstellung<string | undefined>(LETZTE_SICHERUNG_KEY, undefined);
    const seit = letzte ? tageZwischen(letzte.slice(0, 10), heute()) : tageZwischen(b.erstelltAm.slice(0, 10), heute());
    if (seit >= 30) {
      liste.push({
        schluessel: `einstellungen-sicherung:${letzte ?? 'nie'}`,
        art: 'entscheidung' as const,
        titel: letzte ? `Letzte Datensicherung ist ${seit} Tage her` : 'Noch keine Datensicherung heruntergeladen',
        text: 'Deine Daten liegen auf diesem Gerät. Eine Sicherung schützt dich, wenn das Gerät kaputtgeht oder verloren geht.',
        gewicht: 30,
        fuerRollen: ['chef' as const],
        pfad: '/betrieb/einstellungen/daten',
        aktionen: [{ aktion: 'einstellungen.sicherung', label: 'Sicherung herunterladen', primaer: true }],
      });
    }
    return liste;
  },
  aktionen: {
    'einstellungen.sicherung': () => {
      sicherungHerunterladen();
      return '/betrieb/einstellungen/daten';
    },
  },
});
