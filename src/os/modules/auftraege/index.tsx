import { defineModul, aktionAusfuehren, aktionVorhanden } from '@core/modul';
import { db } from '@core/db';
import { on, type DbEvent } from '@core/events';
import { passt } from '@core/format';
import { nummerAnzeige } from '@core/nummern';
import type { Basis, ID, Rechnung, Termin, Zeiteintrag, Angebot } from '@core/objects';
import { AuftragAkte } from './AuftragAkte';
import { AuftraegeSeite, AuftragNeuRoute, PipelineWidget } from './AuftraegeSeite';
import { auftragHinweise } from './hinweise';
import { istOffen, phaseLabel } from './logik';
import {
  aufgabeSicherstellen,
  auftragIdAus,
  auftragPfad,
  beiAbnahmeUnterschrieben,
  beiAngebotAngenommen,
  beiEinsatzGestartet,
  beiTerminErledigt,
  beiZahlung,
  setzePhase,
} from './daten';
import { AUFTRAG_AKTIONEN } from './gateway';

const wechsel = <T extends Basis>(e: DbEvent, feld: keyof T, werte: unknown[]) => {
  const neu = e.objekt as T | undefined;
  const alt = e.vorher as T | undefined;
  return !!neu && werte.includes(neu[feld]) && (!alt || !werte.includes(alt[feld]));
};
const auftragVon = (p: unknown): ID | undefined => (p as { auftragId?: ID } | undefined)?.auftragId;
const alleOffenen = () => db.auftraege.all().filter(istOffen).map((a) => a.id);

export default defineModul({
  id: 'auftraege',
  titel: 'Aufträge',
  bereich: 'auftraege',
  beschreibung: 'Die zentrale Auftragsakte: alles, was beim Kunden zu erledigen ist.',
  icon: 'auftraege',
  gewicht: 96,
  routen: [
    { pfad: '', element: AuftraegeSeite },
    { pfad: 'neu', element: AuftragNeuRoute },
    { pfad: '/auftrag/:id', element: AuftragAkte },
  ],
  hubWidget: PipelineWidget,
  kurzinfo: () => {
    const n = db.auftraege.all().filter(istOffen).length;
    return { text: n === 1 ? '1 laufender Auftrag' : `${n} laufende Aufträge`, ton: n ? 'aktiv' : 'neutral' };
  },
  detail: [{ objekt: 'auftraege', pfad: auftragPfad }],
  erstellen: [{ label: 'Auftrag anlegen', pfad: '/auftraege/auftraege/neu', gewicht: 95 }],
  suche: (q) =>
    db.auftraege
      .where((a) => {
        const k = db.kunden.get(a.kundeId);
        const o = db.orte.get(a.ortId);
        return passt(q, a.nummer, a.titel, a.beschreibung, k?.name, k?.firma, o?.bezeichnung, o?.adresse.strasse, o?.adresse.ort);
      })
      .sort((x, y) => Number(istOffen(y)) - Number(istOffen(x)) || y.geaendertAm.localeCompare(x.geaendertAm))
      .slice(0, 8)
      .map((a) => ({
        typ: 'Auftrag',
        titel: a.titel,
        untertitel: [nummerAnzeige(a.nummer), db.kunden.get(a.kundeId)?.name, phaseLabel(a.phase)].filter(Boolean).join(' · '),
        pfad: auftragPfad(a.id),
        relevanz: istOffen(a) ? 75 : 55,
      })),
  hinweise: auftragHinweise,
  gateway: { aktionen: [...AUFTRAG_AKTIONEN] },
  aktionen: {
    'auftrag.oeffnen': (p) => (auftragVon(p) ? auftragPfad(auftragVon(p)!) : undefined),
    'auftrag.einplanen': (p) => {
      const id = auftragVon(p);
      if (!id) return;
      if (aktionVorhanden('plan.einplanen')) return aktionAusfuehren('plan.einplanen', { auftragId: id });
      aufgabeSicherstellen(id, 'Einsatz einplanen', 'auftrag');
      return auftragPfad(id);
    },
    'auftrag.nachfassen': (p) => {
      const id = auftragVon(p);
      if (!id) return;
      aufgabeSicherstellen(id, 'Beim Kunden nachfassen', 'auftrag');
      return auftragPfad(id);
    },
    'auftrag.verloren': (p) => {
      const id = auftragVon(p);
      if (id) setzePhase(id, 'verloren', { grund: 'Keine Rückmeldung vom Kunden' });
    },
    'auftrag.zur-abnahme': (p) => {
      const id = auftragVon(p);
      if (id) setzePhase(id, 'abnahme');
    },
  },
  automationen: [
    {
      id: 'auftrag.angebot-angenommen',
      titel: 'Angebot angenommen → Beauftragt',
      beschreibung: 'Sagt der Kunde zu, steht der Auftrag sofort auf „Beauftragt“ und erscheint bei „Offen einzuplanen“.',
      standardAn: true,
      minuten: 2,
      start: () => {
        const a = on('angebote.updated', (e) => wechsel<Angebot>(e, 'status', ['angenommen']) && beiAngebotAngenommen((e.objekt as Angebot).auftragId));
        const b = on('angebot.angenommen', (e) => beiAngebotAngenommen(auftragIdAus(e)));
        return () => (a(), b());
      },
    },
    {
      id: 'auftrag.einsatz-gestartet',
      titel: 'Erster Einsatz gestartet → In Arbeit',
      beschreibung: 'Startet ein Monteur den ersten Einsatz oder die Zeit am Auftrag, steht der Auftrag auf „In Arbeit“.',
      standardAn: true,
      minuten: 1,
      start: () => {
        const a = on('einsatz.gestartet', (e) => beiEinsatzGestartet(auftragIdAus(e)));
        const b = on('termine.updated', (e) => wechsel<Termin>(e, 'status', ['unterwegs', 'vor_ort']) && beiEinsatzGestartet((e.objekt as Termin).auftragId));
        const c = on('zeiten.created', (e) => {
          const z = e.objekt as Zeiteintrag;
          if (z.auftragId && z.art === 'arbeit' && !z.ende) beiEinsatzGestartet(z.auftragId);
        });
        return () => (a(), b(), c());
      },
    },
    {
      id: 'auftrag.termine-erledigt',
      titel: 'Alle Einsätze erledigt → Abnahme',
      beschreibung: 'Sind alle Einsätze erledigt und keine Aufgaben mehr offen, steht der Auftrag auf „Abnahme“. Sonst fragt Lotte nach.',
      standardAn: true,
      minuten: 2,
      start: () => {
        const a = on('termine.updated', (e) => wechsel<Termin>(e, 'status', ['erledigt']) && beiTerminErledigt((e.objekt as Termin).auftragId));
        const b = on('einsatz.beendet', (e) => beiTerminErledigt(auftragIdAus(e)));
        return () => (a(), b());
      },
      pruefen: () => alleOffenen().forEach(beiTerminErledigt),
    },
    {
      id: 'auftrag.abnahme-unterschrieben',
      titel: 'Abnahme unterschrieben → Abrechnung',
      beschreibung: 'Hat der Kunde die Abnahme unterschrieben, steht der Auftrag auf „Abrechnung“ – die Rechnung ist dran.',
      standardAn: true,
      minuten: 2,
      start: () => on('abnahme.unterschrieben', (e) => beiAbnahmeUnterschrieben(auftragIdAus(e))),
    },
    {
      id: 'auftrag.bezahlt',
      titel: 'Rechnung bezahlt → Erledigt',
      beschreibung: 'Ist die Schluss- oder Einzelrechnung bezahlt und nichts mehr offen, schließt Lotte den Auftrag ab.',
      standardAn: true,
      minuten: 3,
      start: () => {
        const a = on('rechnungen.updated', (e) => wechsel<Rechnung>(e, 'status', ['bezahlt']) && beiZahlung((e.objekt as Rechnung).auftragId));
        const b = on('zahlung.eingegangen', (e) => beiZahlung(auftragIdAus(e)));
        return () => (a(), b());
      },
      pruefen: () => alleOffenen().forEach(beiZahlung),
    },
  ],
});
