import { defineModul, alleModule, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { datum, heute, passt, plusTage, relativ } from '@core/format';
import type { Auftrag } from '@core/objects';
import { ReklamationListe } from './ReklamationListe';
import { ReklamationNeu } from './ReklamationNeu';
import { ReklamationDetail } from './ReklamationDetail';
import { AnlageGewaehrleistungPanel, AuftragReklamationenTab, KundeReklamationenPanel, MangelSchnell } from './Einhaengen';
import { BEWERTUNG_TEXT, nacharbeitAnlegen, naechsteReklamationsnummer, offen, pruefen, reklamationen, statusAusNacharbeit, type Reklamation } from './daten';

const REGEL_NACHARBEIT = 'reklamationen.nacharbeit';
const REGEL_STATUS = 'reklamationen.status';
const pfad = (id: string) => `/auftraege/reklamationen/${id}`;
const registriert = (id: string) => alleModule().some((m) => !!m.aktionen?.[id]);

function nacharbeitFuer(r: Reklamation | undefined) {
  if (!r || r.bewertung === 'offen' || r.nacharbeitAuftragId || !offen(r)) return;
  const a = nacharbeitAnlegen(r.id);
  if (a) {
    erledigt(REGEL_NACHARBEIT, `Nacharbeitsauftrag ${a.nummer} angelegt`, {
      text: `${r.titel} – ${BEWERTUNG_TEXT[r.bewertung]}${r.fristBis ? `, Frist ${datum(r.fristBis)}` : ''}.`,
      bezug: { typ: 'auftraege', id: a.id },
    });
  }
}

export default defineModul({
  id: 'reklamationen',
  titel: 'Gewährleistung & Reklamationen',
  bereich: 'auftraege',
  beschreibung: 'Mängel aufnehmen, Gewährleistung automatisch prüfen, Nacharbeit fristgerecht erledigen.',
  icon: 'schild',
  gewicht: 52,
  routen: [
    { pfad: '', element: ReklamationListe },
    { pfad: 'neu', element: ReklamationNeu },
    { pfad: ':id', element: ReklamationDetail },
  ],
  erstellen: [{ label: 'Mangel aufnehmen', pfad: '/auftraege/reklamationen/neu', gewicht: 40 }],
  schnell: [{ id: 'mangel', label: 'Mangel melden', icon: 'schild', component: MangelSchnell, gewicht: 35 }],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Reklamationen',
      component: AuftragReklamationenTab,
      gewicht: 40,
      // nur zeigen, wenn es Reklamationen gibt oder die Arbeit fertig ist (dann kann ein Mangel kommen)
      sichtbar: (id) => {
        const a = db.auftraege.get(id);
        return reklamationen.where((r) => r.auftragId === id || r.nacharbeitAuftragId === id).length > 0 || (!!a && ['abnahme', 'abrechnung', 'erledigt'].includes(a.phase) && a.art !== 'reklamation');
      },
      zaehler: (id) => reklamationen.where((r) => (r.auftragId === id || r.nacharbeitAuftragId === id) && offen(r)).length || undefined,
    },
  ],
  panels: [
    { objekt: 'kunden', component: KundeReklamationenPanel, gewicht: 70 },
    { objekt: 'anlagen', component: AnlageGewaehrleistungPanel, gewicht: 40 },
  ],
  kurzinfo: () => {
    const n = reklamationen.where(offen).length;
    return n ? { text: n === 1 ? '1 offene Reklamation' : `${n} offene Reklamationen`, ton: 'aktiv' } : undefined;
  },
  automationen: [
    {
      id: REGEL_NACHARBEIT,
      titel: 'Nacharbeit anlegen',
      beschreibung: 'Ist bei einer Reklamation entschieden, ob Gewährleistung oder kostenpflichtig, legt Macher den Nacharbeitsauftrag mit Frist an.',
      standardAn: true,
      minuten: 8,
      start: () => {
        const a = on('reklamationen.created', (e) => nacharbeitFuer(e.objekt as Reklamation));
        const b = on('reklamationen.updated', (e) => {
          const r = e.objekt as Reklamation;
          if ((e.vorher as Reklamation | undefined)?.bewertung === 'offen') nacharbeitFuer(r);
        });
        return () => {
          a();
          b();
        };
      },
    },
    {
      id: REGEL_STATUS,
      titel: 'Reklamationsstatus nachführen',
      beschreibung: 'Läuft die Nacharbeit, steht die Reklamation auf „In Arbeit“; ist sie fertig, auf „Erledigt“. Nacharbeit auf Gewährleistung wird ohne Rechnung abgeschlossen.',
      standardAn: true,
      minuten: 2,
      start: () =>
        on('auftraege.updated', (e) => {
          const a = e.objekt as Auftrag | undefined;
          if (!a || a.art !== 'reklamation') return;
          const r = reklamationen.all().find((x) => x.nacharbeitAuftragId === a.id);
          if (!r) return;
          const neu = statusAusNacharbeit(r, a);
          if (neu) {
            reklamationen.update(r.id, { status: neu, erledigtAm: neu === 'erledigt' ? heute() : r.erledigtAm });
            if (neu === 'erledigt') erledigt(REGEL_STATUS, `Reklamation ${r.nummer} erledigt`, { text: r.titel, bezug: { typ: 'auftraege', id: a.id } });
          }
          if (a.phase === 'abrechnung' && (e.vorher as Auftrag | undefined)?.phase !== 'abrechnung' && r.bewertung !== 'kostenpflichtig') {
            db.auftraege.update(a.id, { phase: 'erledigt', abgeschlossenAm: a.abgeschlossenAm ?? new Date().toISOString() }, { text: `${r.bewertung === 'kulanz' ? 'Kulanz' : 'Gewährleistung'} – keine Rechnung` });
          }
        }),
    },
  ],
  hinweise: () => {
    const t = heute();
    const out: HinweisVorschlag[] = [];
    for (const r of reklamationen.where(offen)) {
      const kunde = db.kunden.get(r.kundeId)?.name ?? 'Kunde';
      const nacharbeit = db.auftraege.get(r.nacharbeitAuftragId);
      const termin = nacharbeit ? db.termine.where((x) => x.auftragId === nacharbeit.id && x.status !== 'abgesagt')[0] : undefined;
      if (r.fristBis && r.fristBis <= plusTage(t, 3)) {
        const ueber = r.fristBis < t;
        out.push({
          schluessel: `reklamation-frist:${r.id}:${r.fristBis}`,
          art: 'problem',
          titel: `${ueber ? 'Frist überschritten' : 'Frist läuft ab'}: ${r.titel} (${kunde})`,
          text: `Mangel beseitigen bis ${datum(r.fristBis)} (${relativ(r.fristBis)}). ${termin ? `Termin am ${datum(termin.start)}.` : 'Noch kein Termin.'}`,
          gewicht: ueber ? 84 : 74,
          faellig: r.fristBis,
          bezug: nacharbeit ? { typ: 'auftraege', id: nacharbeit.id } : { typ: 'kunden', id: r.kundeId },
          pfad: pfad(r.id),
          aktionen: nacharbeit && !termin && registriert('plan.einplanen') ? [{ aktion: 'plan.einplanen', label: 'Nacharbeit einplanen', primaer: true, payload: { auftragId: nacharbeit.id } }] : undefined,
        });
      }
      if (r.bewertung === 'offen') {
        out.push({
          schluessel: `reklamation-klaeren:${r.id}`,
          art: 'entscheidung',
          titel: `Gewährleistung klären: ${r.titel} (${kunde})`,
          text: pruefen(r).ergebnis === 'unklar' ? 'Abnahme- oder Abschlussdatum fehlt. Trag es ein, dann prüft Macher.' : 'Entscheide: Gewährleistung, kostenpflichtig oder Kulanz.',
          gewicht: 62,
          bezug: { typ: 'kunden', id: r.kundeId },
          fuerRollen: ['chef', 'buero'],
          pfad: pfad(r.id),
        });
      }
      if (r.bewertung === 'kostenpflichtig' && nacharbeit?.phase === 'angebot' && !db.angebote.where((x) => x.auftragId === nacharbeit.id).length) {
        out.push({
          schluessel: `reklamation-angebot:${r.id}`,
          art: 'entscheidung',
          titel: `Kostenpflichtige Nacharbeit: ${kunde} informieren`,
          text: `${r.titel}: Gewährleistung ist abgelaufen. Schick dem Kunden ein Angebot oder entscheide dich für Kulanz.`,
          gewicht: 50,
          bezug: { typ: 'auftraege', id: nacharbeit.id },
          fuerRollen: ['chef', 'buero'],
          pfad: pfad(r.id),
          aktionen: registriert('angebot.erstellen') ? [{ aktion: 'angebot.erstellen', label: 'Angebot erstellen', primaer: true, payload: { auftragId: nacharbeit.id } }] : undefined,
        });
      }
    }
    return out;
  },
  suche: (q) =>
    reklamationen
      .where((r) => passt(q, r.nummer, r.titel, r.beschreibung, db.kunden.get(r.kundeId)?.name, 'reklamation mangel gewährleistung'))
      .slice(0, 6)
      .map((r) => ({ typ: 'Reklamation', titel: r.titel, untertitel: [r.nummer, db.kunden.get(r.kundeId)?.name].filter(Boolean).join(' · '), pfad: pfad(r.id), relevanz: 55 })),
  seed: () => {
    if (reklamationen.all().some((r) => r.beispiel)) return;
    const t = heute();
    // Auf Gewährleistung: Mangel an einem kürzlich abgeschlossenen Projekt
    const projekt = db.auftraege.all().find((a) => a.beispiel && a.phase === 'erledigt' && a.art === 'projekt');
    if (projekt) {
      reklamationen.create({
        nummer: naechsteReklamationsnummer(),
        titel: 'Abdeckung lose, Fuge gerissen',
        beschreibung: 'Kundin hat angerufen: An der neuen Küchenzeile hat sich eine Abdeckung gelöst, daneben ist die Fuge gerissen.',
        kundeId: projekt.kundeId,
        auftragId: projekt.id,
        ortId: projekt.ortId,
        gemeldetAm: plusTage(t, -1),
        kanal: 'telefon',
        grundlage: 'bgb_bau',
        bewertung: 'gewaehrleistung',
        fristBis: plusTage(t, 2),
        status: 'neu',
        beispiel: true,
      });
    }
    // Kostenpflichtig: ältere Anlage, Gewährleistung längst abgelaufen
    const anlage = db.anlagen.all().find((a) => a.beispiel && db.kunden.get(a.kundeId)?.art === 'hausverwaltung');
    if (anlage) {
      const basis = { anlageId: anlage.id, gemeldetAm: t, grundlage: 'bgb' as const, abnahmeAm: plusTage(t, -3 * 365) };
      reklamationen.create({
        ...basis,
        nummer: naechsteReklamationsnummer(),
        titel: `${anlage.typ}: Störung kommt immer wieder`,
        kundeId: anlage.kundeId,
        ortId: anlage.ortId,
        kanal: 'email',
        bewertung: pruefen(basis).ergebnis === 'gewaehrleistung' ? 'gewaehrleistung' : 'kostenpflichtig',
        fristBis: plusTage(t, 14),
        status: 'neu',
        beispiel: true,
      });
    }
  },
});
