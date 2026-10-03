import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { heute, passt, relativ } from '@core/format';
import type { Nachricht } from '@core/objects';
import { TelefonSeite, offeneRueckrufe } from './TelefonSeite';
import { AnrufFormular } from './AnrufFormular';
import { istUeberfaellig, offeneAuftraegeVon } from './daten';
import { AssistentSeite } from './AssistentSeite';
import { istKiAnruf, rohAnrufVerarbeiten } from './assistent';
import { TELEFON_AKTIONEN } from './gateway';

/** neue Anrufe vom Telefonassistenten, die noch eingetragen werden müssen */
const rohAnrufe = () => db.nachrichten.where((n) => istKiAnruf(n) && n.anruf?.status === 'neu' && !n.beispiel);

export default defineModul({
  id: 'telefon',
  titel: 'Telefon & Empfang',
  bereich: 'auftraege',
  beschreibung: 'Anrufe in Sekunden notieren – daraus wird Anfrage oder Rückruf.',
  icon: 'telefon',
  gewicht: 80,
  routen: [
    { pfad: '', element: TelefonSeite },
    { pfad: 'assistent', element: AssistentSeite },
  ],
  gateway: { aktionen: TELEFON_AKTIONEN },
  kurzinfo: () => {
    const n = offeneRueckrufe().length;
    return n ? { text: n === 1 ? '1 offener Rückruf' : `${n} offene Rückrufe`, ton: 'aktiv' } : undefined;
  },
  schnell: [
    {
      id: 'anruf',
      label: 'Anruf notieren',
      icon: 'telefon',
      gewicht: 75,
      component: ({ fertig, auftragId }) => <AnrufFormular fertig={fertig} auftragId={auftragId} kompakt />,
    },
  ],
  erstellen: [{ label: 'Anruf notieren', pfad: '/auftraege/telefon', gewicht: 85 }],
  aktionen: {
    'rueckruf.erledigt': (p) => {
      const id = (p as { aufgabeId: string }).aufgabeId;
      db.aufgaben.update(id, { erledigt: true, erledigtAm: new Date().toISOString() });
    },
  },
  hinweise: () => {
    const tag = heute();
    const fehler = db.nachrichten
      .where((n) => istKiAnruf(n) && n.anruf?.status === 'fehler')
      .map(
        (n): HinweisVorschlag => ({
          schluessel: `ki-anruf:${n.id}`,
          art: 'problem',
          titel: `Anruf von Lotte nicht eingetragen: ${n.betreff?.replace(/^Anruf von /, '') ?? 'Unbekannt'}`,
          text: [n.text.split('\n')[0], n.anruf?.fehler].filter(Boolean).join(' · '),
          bezug: { typ: 'nachrichten', id: n.id },
          gewicht: 72,
          pfad: '/auftraege/telefon',
        }),
      );
    return fehler.concat(offeneRueckrufe()
      .filter((a) => istUeberfaellig(a, tag) || (a.prioritaet === 'hoch' && a.faellig === tag))
      .map(
        (a): HinweisVorschlag => ({
          schluessel: `rueckruf:${a.id}`,
          art: 'problem',
          titel: istUeberfaellig(a, tag) ? `Rückruf überfällig: ${a.titel.replace(/^Rückruf: /, '')}` : `Dringender Rückruf: ${a.titel.replace(/^Rückruf: /, '')}`,
          text: [a.notiz?.split('\n')[0], a.faellig ? `fällig ${relativ(a.faellig)}` : null].filter(Boolean).join(' · '),
          bezug: { typ: 'aufgaben', id: a.id },
          fuerMitarbeiterId: a.zustaendigId,
          gewicht: istUeberfaellig(a, tag) ? 64 : 70,
          aktionen: [{ aktion: 'rueckruf.erledigt', label: 'Erledigt', payload: { aufgabeId: a.id } }],
          pfad: '/auftraege/telefon',
        }),
      ));
  },
  automationen: [
    {
      id: 'telefon.ki-anrufe',
      titel: 'Anrufe vom Telefonassistenten eintragen',
      beschreibung: 'Nimmt Lotte einen Anruf an, wird daraus eine Anfrage, ein Rückruf oder eine Notiz – mit erkanntem Kunden. Notfälle gehen sofort an die Bereitschaft.',
      standardAn: true,
      minuten: 4,
      start: () =>
        on('nachrichten.created', (e) => {
          const n = e.objekt as Nachricht | undefined;
          if (!n || !istKiAnruf(n) || n.anruf?.status !== 'neu' || n.beispiel) return;
          void rohAnrufVerarbeiten(n).then((r) => r.ok && !r.doppelt && erledigt('telefon.ki-anrufe', `Anruf eingetragen: ${r.nachricht.betreff ?? 'Anruf'}`, { bezug: { typ: 'nachrichten', id: r.nachricht.id } }));
        }),
      // Abgeglichene Anrufe (vom Server abgelegt) kommen ohne Ereignis an – beim Prüfen nachholen
      pruefen: () => {
        for (const n of rohAnrufe()) void rohAnrufVerarbeiten(n);
      },
    },
    {
      id: 'telefon.zuordnen',
      titel: 'Anrufe dem Auftrag zuordnen',
      beschreibung: 'Hat der Anrufer genau einen offenen Auftrag, hängt Lotte die Gesprächsnotiz automatisch an diesen Auftrag.',
      standardAn: true,
      minuten: 1,
      start: () =>
        on('nachrichten.created', (e) => {
          const n = e.objekt as Nachricht | undefined;
          if (!n || n.kanal !== 'telefon' || n.auftragId || !n.kundeId || n.beispiel) return;
          const offen = offeneAuftraegeVon(n.kundeId);
          if (offen.length !== 1) return;
          db.nachrichten.update(n.id, { auftragId: offen[0].id }, { leise: true });
          erledigt('telefon.zuordnen', `Anruf an Auftrag „${offen[0].titel}“ gehängt`, { bezug: { typ: 'auftraege', id: offen[0].id } });
        }),
    },
  ],
  suche: (q) =>
    [
      ...(/telefonassistent|assistent|anrufbeantworter|ki|notfall|bereitschaft|rangehen/i.test(q)
        ? [{ typ: 'Einstellung', titel: 'Telefonassistent', untertitel: 'Wann Lotte rangeht, Notfälle, Bereitschaft, Probeanruf', pfad: '/auftraege/telefon/assistent', relevanz: 35 }]
        : []),
      ...db.nachrichten
      .where((n) => n.kanal === 'telefon' && passt(q, n.betreff, n.text))
      .slice(0, 4)
      .map((n) => ({ typ: 'Anruf', titel: n.betreff ?? 'Anruf', untertitel: n.text.split('\n')[0], pfad: '/auftraege/telefon', relevanz: 30 })),
    ],
  seed: () => {
    // Beispiel-Anrufe, damit „Letzte Anrufe“ nicht leer startet
    if (!db.auftraege.all().some((a) => a.beispiel)) return;
    const stoerung = db.auftraege.all().find((a) => a.beispiel && a.phase === 'anfrage' && a.dringend);
    if (stoerung) {
      db.nachrichten.create({ kanal: 'telefon', richtung: 'ein', kundeId: stoerung.kundeId, auftragId: stoerung.id, betreff: `Anruf von ${db.kunden.get(stoerung.kundeId)?.name ?? 'Kundin'} · heute noch`, text: stoerung.beschreibung ?? stoerung.titel, gelesen: true, beispiel: true }, { leise: true });
    }
    const hv = db.kunden.all().find((k) => k.beispiel && k.art === 'hausverwaltung');
    if (hv) {
      db.nachrichten.create({ kanal: 'telefon', richtung: 'ein', kundeId: hv.id, betreff: `Anruf von ${hv.name}`, text: 'Fragt nach dem Stand der Arbeiten in Haus 24.', gelesen: true, beispiel: true }, { leise: true });
      // Beispiel: ein Anruf, den der Telefonassistent angenommen hätte (als Beispiel markiert)
      const anliegen = 'Frage zur letzten Rechnung, bitte zurückrufen.';
      db.nachrichten.create(
        {
          kanal: 'telefon',
          richtung: 'ein',
          kundeId: hv.id,
          betreff: `Anruf von ${hv.name}`,
          text: `${anliegen}\nErreichbar: bis 17 Uhr`,
          gelesen: false,
          beispiel: true,
          anruf: {
            quelle: 'ki-assistent',
            anbieter: 'simulator',
            nummer: hv.telefon,
            beginn: new Date().toISOString(),
            dauerSekunden: 70,
            zusammenfassung: `${hv.name} hat eine Frage zur letzten Rechnung und bittet um Rückruf bis 17 Uhr.`,
            felder: { anliegen, name: hv.name, erreichbarkeit: 'bis 17 Uhr', ...(hv.telefon ? { rueckrufnummer: hv.telefon } : {}) },
            dringlichkeit: 'normal',
            ergebnis: 'rueckruf',
            transkript: [
              { wer: 'assistent', text: 'Guten Tag, Sie sprechen mit dem digitalen Assistenten. Worum geht es?' },
              { wer: 'anrufer', text: 'Ich habe eine Frage zur letzten Rechnung. Rufen Sie mich bitte zurück, ich bin bis 17 Uhr im Büro.' },
              { wer: 'assistent', text: 'Danke, ich habe alles aufgenommen und gebe es an das Team weiter.' },
            ],
            status: 'verarbeitet',
          },
        },
        { leise: true },
      );
      db.aufgaben.create({ titel: `Rückruf: ${hv.name}`, notiz: `${anliegen}\nErreichbar: bis 17 Uhr`, bezug: { typ: 'kunden', id: hv.id }, faellig: heute(), erledigt: false, prioritaet: 'normal', quelle: 'rueckruf', beispiel: true }, { leise: true });
    }
  },
});
