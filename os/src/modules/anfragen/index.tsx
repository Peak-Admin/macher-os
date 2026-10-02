import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { benachrichtigen, erledigt } from '@core/macher';
import { personName } from '@core/format';
import type { Auftrag } from '@core/objects';
import { AnfragenListe, NeueAnfragenWidget } from './AnfragenListe';
import { AnfrageNeu } from './AnfrageNeu';
import { QualiPanel } from './Qualifizieren';
import { alterStunden, alterText, hatNaechstenSchritt, istUnbearbeitet } from './daten';

const qualiAktion = (a: Auftrag) => ({ aktion: 'anfrage.qualifizieren', label: 'Nächsten Schritt wählen', primaer: true, payload: { auftragId: a.id } });

export default defineModul({
  id: 'anfragen',
  titel: 'Anfragen',
  bereich: 'auftraege',
  beschreibung: 'Neue Anfragen aus Telefon, E-Mail, Website – jede bekommt einen nächsten Schritt.',
  icon: 'chat',
  gewicht: 90,
  routen: [
    { pfad: '', element: AnfragenListe },
    { pfad: 'neu', element: AnfrageNeu },
  ],
  hubWidget: NeueAnfragenWidget,
  panels: [{ objekt: 'auftraege', component: QualiPanel, gewicht: 95 }],
  erstellen: [{ label: 'Anfrage erfassen', pfad: '/auftraege/anfragen/neu', gewicht: 90 }],
  aktionen: {
    'anfrage.qualifizieren': (p) => `/auftraege/anfragen?anfrage=${(p as { auftragId: string }).auftragId}`,
  },
  hinweise: () => {
    const jetzt = new Date();
    const liste: HinweisVorschlag[] = [];
    for (const a of db.auftraege.where((x) => x.phase === 'anfrage')) {
      const naechster = hatNaechstenSchritt(a.id);
      const kunde = db.kunden.get(a.kundeId)?.name ?? 'Kunde';
      if (a.dringend && !naechster && alterStunden(a, jetzt) > 1) {
        liste.push({
          schluessel: `anfrage-dringend:${a.id}`,
          art: 'problem',
          titel: `Dringende Anfrage wartet: ${a.titel}`,
          text: `${kunde} · ${alterText(a, jetzt)} · noch kein Rückruf oder Termin.`,
          bezug: { typ: 'auftraege', id: a.id },
          gewicht: 81,
          aktionen: [qualiAktion(a)],
          pfad: `/auftraege/anfragen?anfrage=${a.id}`,
        });
      } else if (istUnbearbeitet(a, naechster, jetzt)) {
        liste.push({
          schluessel: `anfrage-unbearbeitet:${a.id}`,
          art: 'entscheidung',
          titel: `Anfrage unbearbeitet: ${a.titel}`,
          text: `${kunde} wartet ${alterText(a, jetzt)} auf eine Antwort.`,
          bezug: { typ: 'auftraege', id: a.id },
          gewicht: 72,
          aktionen: [qualiAktion(a)],
          pfad: `/auftraege/anfragen?anfrage=${a.id}`,
        });
      }
    }
    return liste;
  },
  automationen: [
    {
      id: 'anfragen.zuweisen',
      titel: 'Neue Anfragen zuweisen',
      beschreibung: 'Jede neue Anfrage bekommt automatisch eine verantwortliche Person im Büro. Bei dringenden Anfragen gibt es sofort eine Benachrichtigung.',
      standardAn: true,
      minuten: 2,
      start: () =>
        on('auftraege.created', (e) => {
          const a = e.objekt as Auftrag | undefined;
          if (!a || a.phase !== 'anfrage' || a.beispiel) return;
          const buero = db.mitarbeiter.all().find((m) => m.aktiv && m.rolle === 'buero') ?? db.mitarbeiter.all().find((m) => m.aktiv && m.rolle === 'chef');
          if (!a.verantwortlichId && buero) {
            db.auftraege.update(a.id, { verantwortlichId: buero.id }, { leise: true });
            erledigt('anfragen.zuweisen', `Anfrage „${a.titel}“ an ${personName(buero)} zugewiesen`, { bezug: { typ: 'auftraege', id: a.id } });
          }
          if (a.dringend) {
            benachrichtigen(`Dringende Anfrage: ${a.titel}`, { text: db.kunden.get(a.kundeId)?.name, bezug: { typ: 'auftraege', id: a.id }, fuer: buero?.id, wichtig: true });
          }
        }),
    },
  ],
  // Suche: Anfragen sind Aufträge – die Auftragssuche findet sie (mit Phase), kein zweiter Treffer
});
