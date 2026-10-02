import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { benachrichtigen, erledigt } from '@core/macher';
import { pfadZu } from '@core/modul';
import { datumKurz, datumVon, personName, plusTage } from '@core/format';
import type { ID, Termin } from '@core/objects';
import { finde, kontextAusDb } from '../autoplanung/basis';
import { terminZaehlt } from '../verfuegbarkeit/daten';
import { benoetigteQualifikationen, pruefeQualifikation, qualifizierteErsatzleute } from './daten';

const AUTOMATION = 'qualifikation.beim-einplanen';

export default defineModul({
  id: 'qualifikation-planung',
  titel: 'Qualifikation bei der Planung',
  bereich: 'plan',
  beschreibung: 'Prüft beim Einplanen, ob das Team die nötigen Qualifikationen und gültigen Nachweise hat.',
  icon: 'schild',
  gewicht: 72,
  navigation: 'versteckt',
  hinweise: () => {
    const ctx = kontextAusDb();
    const bis = plusTage(ctx.heute, 14);
    const r: HinweisVorschlag[] = [];
    for (const t of ctx.termine) {
      const d = datumVon(t.start);
      if (!terminZaehlt(t) || t.status === 'erledigt' || d < ctx.heute || d > bis || !t.mitarbeiterIds.length) continue;
      const probleme = pruefeQualifikation(ctx, t).filter((p) => p.ergebnis === 'problem');
      if (!probleme.length) continue;
      const auftrag = finde(ctx.auftraege, t.auftragId);
      const ersatz = qualifizierteErsatzleute(ctx, t, benoetigteQualifikationen(ctx, auftrag))[0];
      r.push({
        schluessel: `quali-fehlt:${t.id}`,
        art: 'problem',
        titel: `Qualifikation fehlt: ${t.titel}, ${datumKurz(d)}`,
        text: probleme.map((p) => `${p.text} ${p.loesung ?? ''}`.trim()).join(' '),
        bezug: { typ: 'termine', id: t.id },
        gewicht: d <= plusTage(ctx.heute, 2) ? 78 : 66,
        faellig: d,
        pfad: pfadZu({ typ: 'termine', id: t.id }),
        aktionen: ersatz
          ? [{ aktion: 'qualifikation.dazuholen', label: `${personName(finde(ctx.mitarbeiter, ersatz))} dazuholen`, primaer: true, payload: { terminId: t.id, mitarbeiterId: ersatz } }]
          : undefined,
      });
    }
    return r;
  },
  aktionen: {
    /** qualifizierte Person zum Termin hinzufügen */
    'qualifikation.dazuholen': (payload) => {
      const { terminId, mitarbeiterId } = (payload ?? {}) as { terminId?: ID; mitarbeiterId?: ID };
      const t = db.termine.get(terminId);
      const m = db.mitarbeiter.get(mitarbeiterId);
      if (!t || !m) return;
      if (!t.mitarbeiterIds.includes(m.id)) {
        db.termine.update(t.id, { mitarbeiterIds: [...t.mitarbeiterIds, m.id] }, { text: `${personName(m)} wegen Qualifikation dazugeholt` });
        erledigt('qualifikation.dazugeholt', `${personName(m)} eingeplant: ${t.titel}`, { text: 'Damit die nötige Qualifikation vor Ort ist.', bezug: { typ: 'termine', id: t.id }, minuten: 5 });
      }
      return pfadZu({ typ: 'termine', id: t.id });
    },
  },
  automationen: [
    {
      id: AUTOMATION,
      titel: 'Qualifikation beim Einplanen prüfen',
      beschreibung: 'Wird ein Einsatz geplant oder geändert, prüft Macher die Nachweise des Teams und meldet sich sofort, wenn etwas fehlt.',
      standardAn: true,
      minuten: 3,
      start: () => {
        const pruefe = (t: Termin, vorher?: Termin) => {
          if (!t.auftragId || !terminZaehlt(t)) return;
          if (vorher && vorher.start === t.start && vorher.auftragId === t.auftragId && vorher.mitarbeiterIds.join() === t.mitarbeiterIds.join()) return;
          const ctx = kontextAusDb();
          if (datumVon(t.start) < ctx.heute) return;
          const probleme = pruefeQualifikation(ctx, t).filter((p) => p.ergebnis === 'problem');
          if (!probleme.length) return;
          benachrichtigen(`Qualifikation fehlt: ${t.titel}`, { text: probleme.map((p) => `${p.text} ${p.loesung ?? ''}`).join(' '), bezug: { typ: 'termine', id: t.id }, wichtig: true });
          erledigt(AUTOMATION, `Einsatz geprüft: Qualifikation fehlt bei „${t.titel}“`, { bezug: { typ: 'termine', id: t.id } });
        };
        const a = on('termine.created', (e) => pruefe(e.objekt as Termin));
        const b = on('termine.updated', (e) => pruefe(e.objekt as Termin, e.vorher as Termin));
        return () => {
          a();
          b();
        };
      },
    },
  ],
});

