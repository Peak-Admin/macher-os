import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import type { Auftrag } from '@core/objects';
import { ChecklistenSeite } from './ChecklistenSeite';
import { ChecklisteSeite } from './ChecklisteSeite';
import { VorlageBearbeiten } from './VorlageBearbeiten';
import { ChecklistenTerminPanel } from './TerminPanel';
import { automatischAnlegen, checklistePfad, checklisten, offenePflichtpunkte, stand } from './daten';
import { seedChecklisten } from './seed';

const AB_BEAUFTRAGT = ['beauftragt', 'in_arbeit'];

export default defineModul({
  id: 'checklisten',
  titel: 'Checklisten',
  bereich: 'auftraege',
  beschreibung: 'Führt durch wiederkehrende Arbeits- und Prüfschritte – mit Pflichtpunkten und Fotos.',
  icon: 'liste',
  gewicht: 52,
  navigation: 'hub',
  routen: [
    { pfad: '', element: ChecklistenSeite },
    { pfad: 'vorlage/:id', element: VorlageBearbeiten },
    { pfad: ':id', element: ChecklisteSeite },
  ],
  kurzinfo: () => {
    const n = checklisten.all().filter((c) => {
      const a = db.auftraege.get(c.auftragId);
      return a && a.phase !== 'erledigt' && a.phase !== 'verloren' && !stand(c).fertig;
    }).length;
    return n ? { text: n === 1 ? '1 Checkliste offen' : `${n} Checklisten offen`, ton: 'aktiv' } : undefined;
  },
  panels: [{ objekt: 'termine', component: ChecklistenTerminPanel, gewicht: 60 }],
  hinweise: () =>
    db.auftraege
      .where((a) => a.phase === 'abnahme' || a.phase === 'abrechnung')
      .flatMap((a) => {
        const offen = offenePflichtpunkte(a.id);
        if (!offen.length) return [];
        const erste = offen[0].checkliste;
        return [
          {
            schluessel: `checkliste-pflicht:${a.id}`,
            art: 'problem' as const,
            titel: `${a.titel}: ${offen.length === 1 ? '1 Pflichtpunkt' : `${offen.length} Pflichtpunkte`} vor der Abnahme offen`,
            text: offen.slice(0, 3).map((o) => o.punkt.text).join(' · '),
            bezug: { typ: 'auftraege' as const, id: a.id },
            gewicht: a.phase === 'abnahme' ? 58 : 44,
            aktionen: [{ aktion: 'checkliste.oeffnen', label: 'Checkliste öffnen', primaer: true, payload: { checklisteId: erste.id } }],
            pfad: checklistePfad(erste.id),
          },
        ];
      }),
  aktionen: {
    'checkliste.oeffnen': (p) => {
      const id = (p as { checklisteId?: string })?.checklisteId;
      return id ? checklistePfad(id) : undefined;
    },
  },
  automationen: [
    {
      id: 'checklisten.automatisch',
      titel: 'Checklisten automatisch anhängen',
      beschreibung: 'Sobald ein Auftrag beauftragt ist, hängt Macher die passenden Checklisten fürs Gewerk und die Auftragsart an.',
      standardAn: true,
      minuten: 3,
      start: () => {
        const pruefe = (a: Auftrag | undefined, vorher?: Auftrag) => {
          if (!a || !AB_BEAUFTRAGT.includes(a.phase)) return;
          if (vorher && AB_BEAUFTRAGT.includes(vorher.phase)) return;
          automatischAnlegen(a);
        };
        const x = on('auftraege.updated', (e) => pruefe(e.objekt as Auftrag, e.vorher as Auftrag));
        const y = on('auftraege.created', (e) => pruefe(e.objekt as Auftrag));
        return () => (x(), y());
      },
    },
  ],
  seed: seedChecklisten,
});
