import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { euro, heute, passt, tageZwischen } from '@core/format';
import type { Auftrag, ID, RechnungsArt } from '@core/objects';
import { darf } from '@core/session';
import { RechnungenListe } from './RechnungenListe';
import { RechnungNeu } from './RechnungNeu';
import { RechnungDetail } from './RechnungDetail';
import { RechnungDruck } from './Druck';
import { AuftragRechnungenTab, KundeRechnungenTab } from './Tabs';
import { abschlussRechnung, ART_LABEL, ENTWURF_TAGE, gueltigeRechnungen, nummerText, passendeArt, rechnungErstellen, rechnungsSummen } from './logik';
import { alleRechnungen } from './typen';
import { RECHNUNG_AKTIONEN, RECHNUNG_SENDEN } from './gateway';

const pfad = (id: ID) => `/betrieb/rechnungen/${id}`;

export default defineModul({
  id: 'rechnungen',
  titel: 'Rechnungen',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Rechnungen aus dem Auftrag – Abschlag, Teil, Schluss, Storno und E-Rechnung.',
  icon: 'euro',
  gewicht: 90,
  rollen: ['chef', 'buero'],
  routen: [
    { pfad: '', element: RechnungenListe },
    { pfad: 'neu', element: RechnungNeu },
    { pfad: ':id', element: RechnungDetail },
  ],
  vollbildRouten: [{ pfad: '/druck/rechnung/:id', element: RechnungDruck }],
  detail: [{ objekt: 'rechnungen', pfad }],
  kurzinfo: () => {
    const e = alleRechnungen().filter((r) => r.status === 'entwurf').length;
    return e ? { text: e === 1 ? '1 Entwurf wartet auf Versand' : `${e} Entwürfe warten auf Versand`, ton: 'aktiv' } : undefined;
  },
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Rechnungen',
      component: AuftragRechnungenTab,
      gewicht: 62,
      zaehler: (id) => alleRechnungen().filter((r) => r.auftragId === id).length || undefined,
      sichtbar: (id) => {
        if (!darf('geld')) return false;
        const a = db.auftraege.get(id);
        return !!a && (['beauftragt', 'in_arbeit', 'abnahme', 'abrechnung', 'erledigt'].includes(a.phase) || alleRechnungen().some((r) => r.auftragId === id));
      },
    },
    {
      objekt: 'kunden',
      titel: 'Rechnungen',
      component: KundeRechnungenTab,
      gewicht: 55,
      zaehler: (id) => alleRechnungen().filter((r) => r.kundeId === id).length || undefined,
      sichtbar: (id) => darf('geld') && alleRechnungen().some((r) => r.kundeId === id),
    },
  ],
  hinweise: () => {
    const liste = [];
    // Auftrag in Abrechnung, aber keine Rechnung
    for (const a of db.auftraege.where((x) => x.phase === 'abrechnung')) {
      if (abschlussRechnung(a.id) || gueltigeRechnungen(a.id).some((r) => r.status === 'entwurf')) continue;
      const art = passendeArt(a.id);
      liste.push({
        schluessel: `rechnung-fehlt:${a.id}`,
        art: 'entscheidung' as const,
        titel: `${art === 'schluss' ? 'Schlussrechnung' : 'Rechnung'} schreiben: ${a.titel}`,
        text: `${a.nummer} · ${db.kunden.get(a.kundeId)?.name ?? ''} – der Auftrag ist fertig, aber noch nicht abgerechnet.`,
        bezug: { typ: 'auftraege' as const, id: a.id },
        gewicht: 81,
        fuerRollen: ['chef' as const, 'buero' as const],
        aktionen: [{ aktion: 'rechnung.erstellen', label: art === 'schluss' ? 'Schlussrechnung erstellen' : 'Rechnung erstellen', primaer: true, payload: { auftragId: a.id, art } }],
      });
    }
    // Entwürfe, die liegen bleiben
    for (const r of alleRechnungen().filter((x) => x.status === 'entwurf')) {
      const alter = tageZwischen(r.erstelltAm.slice(0, 10), heute());
      if (alter <= ENTWURF_TAGE && !r.vonMacher) continue;
      liste.push({
        schluessel: `rechnung-entwurf:${r.id}`,
        art: 'freigabe' as const,
        titel: r.vonMacher && alter <= ENTWURF_TAGE ? `Rechnung prüfen und senden: ${r.titel}` : `Rechnungsentwurf liegt seit ${alter} Tagen`,
        text: `${db.kunden.get(r.kundeId)?.name ?? ''} · ${euro(rechnungsSummen(r).zahlbetrag)} – Geld kommt erst, wenn die Rechnung raus ist.`,
        bezug: { typ: 'rechnungen' as const, id: r.id },
        gewicht: alter > ENTWURF_TAGE ? 72 : 58,
        fuerRollen: ['chef' as const, 'buero' as const],
        pfad: pfad(r.id),
        aktionen: [{ aktion: 'rechnung.oeffnen', label: 'Prüfen und senden', primaer: true, payload: { rechnungId: r.id } }],
      });
    }
    return liste;
  },
  gateway: { aktionen: [...RECHNUNG_AKTIONEN, ...RECHNUNG_SENDEN] },
  aktionen: {
    'rechnung.erstellen': (payload) => {
      const p = payload as { auftragId: ID; art?: RechnungsArt; prozent?: number; nachAufwand?: boolean };
      const r = rechnungErstellen(p.auftragId, p.art ?? passendeArt(p.auftragId), { prozent: p.prozent, nachAufwand: p.nachAufwand });
      return r ? pfad(r.id) : undefined;
    },
    'rechnung.oeffnen': (payload) => pfad((payload as { rechnungId: ID }).rechnungId),
  },
  automationen: [
    {
      id: 'rechnungen.entwurf-bei-abrechnung',
      titel: 'Rechnung vorbereiten, wenn der Auftrag fertig ist',
      beschreibung: 'Kommt ein Auftrag in die Phase „Abrechnung“, legt Macher den Rechnungsentwurf aus Angebot, Material und Zeiten an – nach Abschlägen gleich als Schlussrechnung.',
      standardAn: true,
      minuten: 15,
      start: () =>
        on('auftraege.updated', (e) => {
          const a = e.objekt as Auftrag | undefined;
          const vorher = e.vorher as Auftrag | undefined;
          if (!a || a.phase !== 'abrechnung' || vorher?.phase === 'abrechnung') return;
          // schon abgerechnet oder ein Entwurf liegt bereit → nichts tun; nur Abschläge da → Schlussrechnung
          if (abschlussRechnung(a.id) || gueltigeRechnungen(a.id).some((r) => r.status === 'entwurf')) return;
          const r = rechnungErstellen(a.id, passendeArt(a.id), { vonMacher: true });
          if (r)
            erledigt('rechnungen.entwurf-bei-abrechnung', `Rechnungsentwurf für ${a.nummer} vorbereitet`, {
              text: `${a.titel} · ${euro(rechnungsSummen(r).zahlbetrag)}`,
              bezug: { typ: 'rechnungen', id: r.id },
            });
        }),
    },
  ],
  suche: (q) =>
    (darf('geld') ? alleRechnungen() : [])
      .filter((r) => passt(q, r.nummer, r.titel, db.kunden.get(r.kundeId)?.name, db.auftraege.get(r.auftragId)?.nummer))
      .slice(0, 8)
      .map((r) => ({
        typ: 'Rechnung',
        titel: `${nummerText(r)} · ${r.titel}`,
        untertitel: `${db.kunden.get(r.kundeId)?.name ?? ''} · ${ART_LABEL[r.art]} · ${euro(rechnungsSummen(r).zahlbetrag)}`,
        pfad: pfad(r.id),
        relevanz: r.nummer && q.replace(/\s/g, '').toLowerCase().includes(r.nummer.toLowerCase()) ? 90 : 55,
      })),
  erstellen: [{ label: 'Rechnung schreiben', pfad: '/betrieb/rechnungen/neu', gewicht: 55 }],
});
