/**
 * Dokumenten-Engine: eine gemeinsame Grundlage für alle Geschäftsdokumente.
 *
 * - Registry der Dokumentarten (`arten.ts`) – Quelle bleibt die jeweilige Sammlung (Angebot, Rechnung, Abnahme …)
 * - Variablen (`variablen.ts`) über die Textbausteine aus „Vorlagen“
 * - Nummernkreise je Art (`nummern.ts`), Versionen & Historie (`historie.ts`)
 * - Versand Vorbereiten → Vorschau → Bestätigen (`versand.ts`, `VersandDialog.tsx`)
 * - neue Arten Auftragsbestätigung und Lieferschein (`daten.ts`) – erzeugt im Kontext des Auftrags, kein Menüpunkt
 */
import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on, type DbEvent } from '@core/events';
import { heute, passt, tageZwischen } from '@core/format';
import type { Bezug, ID } from '@core/objects';
import { darf } from '@core/session';
import { artVon, dokumentArt, type DokumentArtId } from './arten';
import { geschaeftsdokumente, GESCHAEFTS_LABEL } from './daten';
import { DokumentDetail } from './DokumentDetail';
import { DokumentDruck } from './DokumentDruck';
import { versionMerken, type VersionAnlass } from './historie';
import { eckdatenVon } from './versand';

const pfad = (id: ID) => `/auftraege/dokumente/${id}`;

/** Version zu einem fachlichen Event festhalten (Archiv: was ging wann raus) */
function merken(bezug: Bezug | undefined, anlass: VersionAnlass, extra: Parameters<typeof versionMerken>[3] = {}) {
  if (!bezug?.id) return;
  const art = artVon(bezug);
  if (!art) return;
  versionMerken(bezug, art.id, anlass, { ...eckdatenVon(bezug), ...extra });
}

const bezugAus = (typ: string, e: DbEvent): Bezug | undefined => (e.objekt?.id ? { typ, id: e.objekt.id } : undefined);

export default defineModul({
  id: 'dokumente',
  titel: 'Dokumente',
  bereich: 'auftraege',
  beschreibung: 'Auftragsbestätigung, Lieferschein und alle anderen Geschäftsdokumente – mit Nummer, Briefkopf, Versand und Verlauf.',
  icon: 'dokument',
  gewicht: 50,
  navigation: 'versteckt',
  routen: [{ pfad: ':id', element: DokumentDetail }],
  vollbildRouten: [{ pfad: '/druck/dokument/:id', element: DokumentDruck }],
  detail: [{ objekt: 'geschaeftsdokumente', pfad }],
  aktionen: {
    /** `{ auftragId, art }` → Entwurf der Art am Auftrag (oder vorhandenen) öffnen */
    'dokument.erstellen': (payload) => {
      const { auftragId, art } = (payload ?? {}) as { auftragId?: ID; art?: DokumentArtId };
      if (!auftragId || !art || !db.auftraege.get(auftragId)) return undefined;
      return dokumentArt(art)?.erzeugen?.(auftragId);
    },
  },
  hinweise: () => {
    const liste: HinweisVorschlag[] = [];
    for (const d of geschaeftsdokumente.where((x) => x.status === 'entwurf' && x.art === 'auftragsbestaetigung')) {
      const alter = tageZwischen(d.erstelltAm.slice(0, 10), heute());
      if (alter < 3) continue;
      liste.push({
        schluessel: `dokument-entwurf:${d.id}`,
        art: 'freigabe',
        titel: `Auftragsbestätigung senden: ${db.auftraege.get(d.auftragId)?.titel ?? d.titel}`,
        text: `Der Entwurf ${d.nummer} liegt seit ${alter} Tagen. Dein Kunde wartet auf die Bestätigung.`,
        bezug: { typ: 'auftraege', id: d.auftragId },
        gewicht: 45,
        fuerRollen: ['chef', 'buero'],
        pfad: pfad(d.id),
      });
    }
    return liste;
  },
  init: () => {
    // Versionen: fachliche Events der Quell-Module → Dokumenthistorie (gleicher Vorgang wird zusammengeführt)
    on('dokument.versendet', (e) => {
      const d = (e.daten ?? {}) as { bezug?: Bezug; kanal?: 'email' | 'sms' | 'whatsapp'; status?: 'gesendet' | 'geoeffnet' | 'fehler' };
      merken(d.bezug, 'versendet', { kanal: d.kanal, versandStatus: d.status });
    });
    on('rechnung.versendet', (e) => merken(bezugAus('rechnungen', e), 'festgeschrieben'));
    on('rechnung.storniert', (e) => {
      const d = (e.daten ?? {}) as { rechnungId?: ID };
      if (d.rechnungId) merken({ typ: 'rechnungen', id: d.rechnungId }, 'storniert');
    });
    on('angebot.versendet', (e) => merken(bezugAus('angebote', e), 'versendet'));
    on('mahnung.versendet', (e) => merken(bezugAus('mahnungen', e), 'versendet'));
    on('abnahme.unterschrieben', (e) => merken(bezugAus('abnahmen', e), 'unterschrieben'));
    on('bericht.unterschrieben', (e) => merken(bezugAus('berichte', e), 'unterschrieben'));
    on('lieferschein.unterschrieben', (e) => merken(bezugAus('geschaeftsdokumente', e), 'unterschrieben'));
    on('auftragsbestaetigung.versendet', (e) => merken(bezugAus('geschaeftsdokumente', e), 'versendet'));
    on('lieferschein.versendet', (e) => merken(bezugAus('geschaeftsdokumente', e), 'versendet'));
  },
  suche: (q) =>
    geschaeftsdokumente
      .where((d) => (d.art !== 'auftragsbestaetigung' || darf('geld')) && passt(q, d.nummer, d.titel, GESCHAEFTS_LABEL[d.art], db.auftraege.get(d.auftragId)?.nummer, db.kunden.get(d.kundeId)?.name))
      .slice(0, 6)
      .map((d) => ({
        typ: GESCHAEFTS_LABEL[d.art],
        titel: `${d.nummer} · ${d.titel}`,
        untertitel: db.kunden.get(d.kundeId)?.name,
        pfad: pfad(d.id),
        relevanz: q.replace(/\s/g, '').toLowerCase().includes(d.nummer.toLowerCase()) ? 85 : 40,
      })),
});
