import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { passt, relativ } from '@core/format';
import type { Dokument } from '@core/objects';
import { FotosSeite } from './FotosSeite';
import { FotosTab } from './Galerie';
import { FotoErfassen, NotizErfassen, SpracheErfassen } from './Erfassen';
import { istDoku, istFoto, laufenderAuftrag, nachherFehlt } from './daten';
import { beispielBild } from './beispiel';

export default defineModul({
  id: 'fotos',
  titel: 'Fotos & Dokumentation',
  bereich: 'auftraege',
  beschreibung: 'Speichert Fotos, Sprache und Notizen direkt am Auftrag.',
  icon: 'kamera',
  gewicht: 74,
  navigation: 'haupt',
  routen: [{ pfad: '', element: FotosSeite }],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Fotos',
      component: FotosTab,
      gewicht: 80,
      zaehler: (id) => db.dokumente.where((d) => d.auftragId === id && istFoto(d)).length || undefined,
    },
  ],
  schnell: [
    { id: 'foto', label: 'Foto', icon: 'kamera', component: FotoErfassen, gewicht: 95 },
    { id: 'sprachnotiz', label: 'Sprachnotiz', icon: 'mikro', component: SpracheErfassen, gewicht: 90 },
    { id: 'notiz', label: 'Notiz', icon: 'notiz', component: NotizErfassen, gewicht: 85 },
  ],
  kurzinfo: () => {
    const n = db.dokumente.where((d) => istDoku(d) && !d.auftragId).length;
    return n ? { text: n === 1 ? '1 Eintrag ohne Auftrag' : `${n} Einträge ohne Auftrag`, ton: 'achtung' } : undefined;
  },
  hinweise: () => {
    const ohne = db.dokumente.where((d) => istDoku(d) && !d.auftragId);
    const liste: HinweisVorschlag[] = [];
    if (ohne.length)
      liste.push({
        schluessel: 'fotos-ohne-auftrag',
        art: 'problem' as const,
        titel: ohne.length === 1 ? '1 Foto oder Notiz ohne Auftrag' : `${ohne.length} Fotos oder Notizen ohne Auftrag`,
        text: 'Ordne sie zu, sonst fehlen sie später in Bericht und Abrechnung.',
        gewicht: 36,
        pfad: '/auftraege/fotos?ohne=1',
      });
    for (const a of db.auftraege.where((x) => x.phase === 'abnahme' || x.phase === 'abrechnung')) {
      if (nachherFehlt(db.dokumente.where((d) => d.auftragId === a.id)))
        liste.push({
          schluessel: `fotos-nachher-fehlt:${a.id}`,
          art: 'info' as const,
          titel: `Nachher-Fotos fehlen: ${a.titel}`,
          text: `${a.nummer} hat Vorher-Fotos, aber keine Nachher-Fotos. Die brauchst du als Nachweis.`,
          bezug: { typ: 'auftraege' as const, id: a.id },
          gewicht: 42,
        });
    }
    return liste;
  },
  automationen: [
    {
      id: 'fotos.zuordnen',
      titel: 'Fotos dem laufenden Einsatz zuordnen',
      beschreibung: 'Fotos, Sprachnotizen und Notizen ohne Auftrag landen automatisch beim Auftrag, an dem du gerade eingeplant bist.',
      standardAn: true,
      minuten: 1,
      start: () =>
        on('dokumente.created', (e) => {
          const d = e.objekt as Dokument | undefined;
          if (!d || d.auftragId || !istDoku(d)) return;
          const auftragId = laufenderAuftrag(db.termine.all(), d.erstelltVon, d.erstelltAm);
          const a = db.auftraege.get(auftragId);
          if (!a) return;
          db.dokumente.update(d.id, { auftragId: a.id }, { text: `Automatisch ${a.nummer} zugeordnet` });
          erledigt('fotos.zuordnen', `${d.titel} dem Auftrag ${a.nummer} zugeordnet`, { bezug: { typ: 'auftraege', id: a.id } });
        }),
    },
  ],
  suche: (q) =>
    db.dokumente
      .where((d) => istDoku(d) && passt(q, d.titel, d.text, ...(d.tags ?? [])))
      .slice(0, 6)
      .map((d) => ({
        typ: d.art === 'foto' ? 'Foto' : d.art === 'sprache' ? 'Sprachnotiz' : 'Notiz',
        titel: d.titel,
        untertitel: [db.auftraege.get(d.auftragId)?.nummer, relativ(d.erstelltAm)].filter(Boolean).join(' · '),
        pfad: `/auftraege/dateien/${d.id}`,
        relevanz: 30,
      })),
  seed: () => {
    const a4 = db.auftraege.all().find((a) => a.beispiel && a.titel === 'Sanierung Wohnanlage, Haus 24');
    if (!a4) return;
    const B = { beispiel: true, auftragId: a4.id };
    db.dokumente.create({ art: 'foto', titel: 'Zählerplatz vorher', url: beispielBild('Zählerplatz vorher'), mime: 'image/svg+xml', tags: ['Vorher'], ...B });
    db.dokumente.create({ art: 'foto', titel: 'Feuchte Wand im Keller', url: beispielBild('Feuchte Wand im Keller'), mime: 'image/svg+xml', tags: ['Mangel'], text: 'Alte Verteilung im Keller, Wand feucht. Mit Hausverwaltung klären.', ...B });
    db.dokumente.create({ art: 'notiz', titel: 'Hausmeister hat Schlüssel für Keller', text: 'Hausmeister hat Schlüssel für Keller. Herr Albers ist bis 15 Uhr da.', tags: [], ...B });
  },
});
