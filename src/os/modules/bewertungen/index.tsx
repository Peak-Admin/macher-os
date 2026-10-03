import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { einstellung } from '@core/einstellungen';
import { erledigt } from '@core/macher';
import type { Auftrag, ID } from '@core/objects';
import { BewertungenSeite } from './Bewertungen';
import { BewertungPanelAuftrag, EmpfehlungPanelKunde } from './Panels';
import { LINK_KEY, anfrageSenden, anfrageVerwerfen, anfrageVorbereiten, bewertungen, empfehlungFuer, sollAnfragen } from './daten';
import { BEWERTUNG_AKTIONEN } from './gateway';

const REGEL = 'bewertungen.vorbereiten';
const PFAD = '/auftraege/bewertungen';

function vorbereitenWennPassend(a: Auftrag, vorherPhase: Auftrag['phase'] | undefined) {
  if (!sollAnfragen(a, vorherPhase, bewertungen.all())) return;
  anfrageVorbereiten(a);
  erledigt(REGEL, `Bewertungsanfrage für ${db.kunden.get(a.kundeId)?.name ?? 'Kunde'} vorbereitet`, {
    text: `${a.nummer} ist erledigt. Du musst nur noch freigeben.`,
    bezug: { typ: 'auftraege', id: a.id },
  });
}

export default defineModul({
  id: 'bewertungen',
  titel: 'Bewertungen & Empfehlungen',
  bereich: 'auftraege',
  beschreibung: 'Nach erledigter Arbeit automatisch nach einer Bewertung fragen und Empfehlungen nachverfolgen.',
  icon: 'stern',
  gewicht: 28,
  navigation: 'hub',
  routen: [{ pfad: '', element: BewertungenSeite }],
  panels: [
    { objekt: 'auftraege', component: BewertungPanelAuftrag, gewicht: 20 },
    { objekt: 'kunden', component: EmpfehlungPanelKunde, gewicht: 30 },
  ],

  hinweise: () => {
    const liste: HinweisVorschlag[] = [];
    const ohneLink = !einstellung<string>(LINK_KEY, '').trim();
    for (const b of bewertungen.where((b) => b.art === 'anfrage' && b.status === 'vorbereitet')) {
      const a = db.auftraege.get(b.auftragId);
      const k = db.kunden.get(b.kundeId);
      if (!a || !k || a.geloeschtAm || k.geloeschtAm) continue;
      liste.push({
        schluessel: `bewertung-freigabe:${a.id}`,
        art: 'freigabe',
        titel: `Bewertung anfragen: ${k.name}`,
        text: ohneLink ? `${a.titel || a.nummer} ist erledigt. Trag zuerst deinen Google-Bewertungslink ein.` : `${a.titel || a.nummer} ist erledigt. Die Anfrage ist vorbereitet.`,
        bezug: { typ: 'auftraege', id: a.id },
        gewicht: 18,
        fuerRollen: ['chef', 'buero'],
        aktionen: [
          { aktion: 'bewertung.anfragen', label: ohneLink ? 'Link eintragen' : 'Anfrage senden', primaer: true, payload: { auftragId: a.id } },
          { aktion: 'bewertung.verwerfen', label: 'Nicht fragen', payload: { auftragId: a.id } },
        ],
        pfad: PFAD,
      });
    }
    for (const k of db.kunden.where((k) => k.quelle === 'empfehlung' && !empfehlungFuer(k.id))) {
      liste.push({
        schluessel: `empfehler-fehlt:${k.id}`,
        art: 'info',
        titel: `Wer hat ${k.name} empfohlen?`,
        text: 'Trag den Empfehler ein, dann kannst du dich bei ihm bedanken.',
        bezug: { typ: 'kunden', id: k.id },
        gewicht: 12,
        pfad: `${PFAD}?tab=empfehlungen`,
      });
    }
    return liste;
  },

  gateway: { aktionen: [...BEWERTUNG_AKTIONEN] },
  aktionen: {
    'bewertung.anfragen': (payload) => {
      const auftragId = (payload as { auftragId?: ID })?.auftragId;
      if (!auftragId) return;
      const r = anfrageSenden(auftragId);
      if (r.ok) return;
      if (r.grund === 'kein_link') return `${PFAD}?tab=einstellung`;
      if (r.grund === 'kein_kontakt') return `/auftraege/kunden/${db.auftraege.get(auftragId)?.kundeId ?? ''}`;
    },
    'bewertung.verwerfen': (payload) => {
      const auftragId = (payload as { auftragId?: ID })?.auftragId;
      if (auftragId) anfrageVerwerfen(auftragId);
    },
  },

  automationen: [
    {
      id: REGEL,
      titel: 'Bewertungsanfrage vorbereiten',
      beschreibung: 'Ist ein Auftrag erledigt, bereitet Lotte die Bewertungsanfrage vor. Reklamationen, unzufriedene und kürzlich gefragte Kunden lässt sie aus. Du gibst nur frei.',
      standardAn: true,
      minuten: 5,
      start: () => on('auftraege.updated', (e) => vorbereitenWennPassend(e.objekt as Auftrag, (e.vorher as Auftrag | undefined)?.phase)),
    },
  ],

  init: () => {
    on('kunde.zusammengefuehrt', (e) => {
      const { zielId, quelleId } = e.daten as { zielId: ID; quelleId: ID };
      // `kundeId` hängt das Zusammenführen selbst um (alle Sammlungen) – hier nur der Empfehler
      for (const b of bewertungen.where((x) => x.empfohlenVonKundeId === quelleId)) bewertungen.update(b.id, { empfohlenVonKundeId: zielId });
    });
  },

  seed: () => {
    // Erledigter Beispielauftrag → vorbereitete Anfrage zur Freigabe.
    // Empfehlungen erfinden wir nicht: „Wer hat empfohlen?“ fragt Lotte beim Kunden mit Quelle Empfehlung.
    const erledigterAuftrag = db.auftraege.all().find((a) => a.beispiel && a.phase === 'erledigt');
    if (erledigterAuftrag) anfrageVorbereiten(erledigterAuftrag, true);
  },
});
