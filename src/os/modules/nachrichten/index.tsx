import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { passt, relativ } from '@core/format';
import type { Nachricht } from '@core/objects';
import { AuftragNachrichtenTab, AuftragVerlauf, InternVerlauf, KundeNachrichtenTab, KundeVerlauf, NachrichtWeiter, NachrichtenWidget, Posteingang } from './Posteingang';
import { istUngelesen, nachrichtenHinweise, passenderAuftrag, threadVon } from './daten';
import { ich } from '@core/session';

const ungelesenBei = (pruefe: (n: Nachricht) => boolean) => db.nachrichten.where((n) => pruefe(n) && istUngelesen(n, ich()?.id)).length || undefined;

export default defineModul({
  id: 'nachrichten',
  titel: 'Nachrichten',
  bereich: 'auftraege',
  beschreibung: 'Bündelt die Kommunikation mit Kunden und im Team – je Auftrag.',
  icon: 'chat',
  gewicht: 72,
  navigation: 'haupt',
  routen: [
    { pfad: '', element: Posteingang },
    { pfad: 'auftrag/:id', element: AuftragVerlauf },
    { pfad: 'kunde/:id', element: KundeVerlauf },
    { pfad: 'intern', element: InternVerlauf },
    { pfad: ':id', element: NachrichtWeiter },
  ],
  detail: [{ objekt: 'nachrichten', pfad: (id) => `/auftraege/nachrichten/${id}` }],
  hubWidget: NachrichtenWidget,
  tabs: [
    { objekt: 'auftraege', titel: 'Nachrichten', component: AuftragNachrichtenTab, gewicht: 70, zaehler: (id) => ungelesenBei((n) => n.auftragId === id) },
    { objekt: 'kunden', titel: 'Nachrichten', component: KundeNachrichtenTab, gewicht: 60, zaehler: (id) => ungelesenBei((n) => n.kundeId === id || db.auftraege.get(n.auftragId)?.kundeId === id) },
  ],
  kurzinfo: () => {
    const n = db.nachrichten.where((x) => x.richtung === 'ein' && !x.gelesen).length;
    return n ? { text: n === 1 ? '1 Kundennachricht ungelesen' : `${n} Kundennachrichten ungelesen`, ton: 'achtung' } : undefined;
  },
  hinweise: () => nachrichtenHinweise(db.nachrichten.all(), db.auftraege.all(), db.kunden.all(), new Date()),
  automationen: [
    {
      id: 'nachrichten.zuordnen',
      titel: 'Kundennachrichten dem Auftrag zuordnen',
      beschreibung: 'Schreibt ein Kunde ohne Bezug und hat er genau einen offenen Auftrag, landet die Nachricht automatisch in dessen Verlauf.',
      standardAn: true,
      minuten: 1,
      start: () =>
        on('nachrichten.created', (e) => {
          const n = e.objekt as Nachricht | undefined;
          if (!n) return;
          const auftragId = passenderAuftrag(n, db.auftraege.all());
          const a = db.auftraege.get(auftragId);
          if (!a) return;
          db.nachrichten.update(n.id, { auftragId: a.id }, { text: `Automatisch ${a.nummer} zugeordnet` });
          erledigt('nachrichten.zuordnen', `Nachricht von ${db.kunden.get(n.kundeId)?.name ?? 'Kunde'} dem Auftrag ${a.nummer} zugeordnet`, { bezug: { typ: 'auftraege', id: a.id } });
        }),
    },
  ],
  suche: (q) =>
    db.nachrichten
      .where((n) => passt(q, n.text, n.betreff, db.kunden.get(n.kundeId)?.name))
      .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))
      .slice(0, 5)
      .map((n) => ({
        typ: 'Nachricht',
        titel: n.betreff || (n.text.length > 60 ? n.text.slice(0, 59) + '…' : n.text),
        untertitel: [db.kunden.get(n.kundeId)?.name, db.auftraege.get(n.auftragId)?.nummer, relativ(n.erstelltAm)].filter(Boolean).join(' · '),
        pfad: threadVon(n).pfad,
        relevanz: 30,
      })),
});
