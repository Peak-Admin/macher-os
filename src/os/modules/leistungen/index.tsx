import { defineModul } from '@core/modul';
import { batch, db } from '@core/db';
import { on } from '@core/events';
import { einstellung } from '@core/einstellungen';
import { erledigt } from '@core/macher';
import { euro, passt } from '@core/format';
import { darf } from '@core/session';
import type { Betrieb } from '@core/objects';
import { LeistungenListe } from './LeistungenListe';
import { LeistungForm } from './LeistungForm';
import { PreiseAnpassen } from './PreiseAnpassen';
import { LEERE_FELDER, RECHNER_KEY, Stundensatz, rechnerEingabe, type RechnerFelder } from './Stundensatz';
import { stundensatzBerechnen, unterStundensatz } from './daten';

const LOHN_AUTOMATION = 'leistungen.stundenpreise-nachziehen';

export default defineModul({
  id: 'leistungen',
  titel: 'Leistungen & Preise',
  bereich: 'betrieb',
  gruppe: 'unternehmen',
  beschreibung: 'Was du anbietest, was es kostet und wie lange es dauert.',
  icon: 'liste',
  gewicht: 72,
  routen: [
    { pfad: '', element: LeistungenListe },
    { pfad: 'neu', element: LeistungForm },
    { pfad: 'preise', element: PreiseAnpassen },
    { pfad: 'stundensatz', element: Stundensatz },
    { pfad: ':id', element: LeistungForm },
  ],
  detail: [{ objekt: 'leistungen', pfad: (id) => `/betrieb/leistungen/${id}` }],
  erstellen: [{ label: 'Leistung anlegen', pfad: '/betrieb/leistungen/neu', gewicht: 30 }],
  kurzinfo: () => {
    const n = db.leistungen.where((l) => l.aktiv).length;
    return n ? { text: n === 1 ? '1 aktive Leistung' : `${n} aktive Leistungen` } : { text: 'Noch keine Leistungen', ton: 'achtung' };
  },
  suche: (q) =>
    db.leistungen
      .where((l) => passt(q, l.name, l.kategorie, l.beschreibung))
      .slice(0, 6)
      .map((l) => ({
        typ: 'Leistung',
        titel: l.name,
        untertitel: [l.kategorie, darf('geld') ? `${euro(l.preis)} / ${l.einheit}` : l.einheit].filter(Boolean).join(' · '),
        pfad: `/betrieb/leistungen/${l.id}`,
        relevanz: 40,
      })),
  hinweise: () => {
    const b = db.betrieb.get('betrieb');
    if (!b) return [];
    const liste = [];
    const felder = einstellung<RechnerFelder>(RECHNER_KEY, LEERE_FELDER);
    const r = stundensatzBerechnen(rechnerEingabe({ ...LEERE_FELDER, ...felder }));
    if (r && r.verrechnungssatz > b.stundensatz) {
      liste.push({
        schluessel: `leistungen-stundensatz-zu-niedrig:${r.verrechnungssatz}`,
        art: 'entscheidung' as const,
        titel: `Dein Stundensatz deckt die Kosten nicht`,
        text: `Laut deiner Rechnung brauchst du ${euro(r.verrechnungssatz)} je Stunde, du nimmst ${euro(b.stundensatz)}.`,
        gewicht: 72,
        fuerRollen: ['chef' as const],
        pfad: '/betrieb/leistungen/stundensatz',
        aktionen: [{ aktion: 'leistungen.stundensatzUebernehmen', label: `${euro(r.verrechnungssatz)} übernehmen`, primaer: true, payload: { cent: r.verrechnungssatz } }],
      });
    }
    const unter = unterStundensatz(db.leistungen.all(), b.stundensatz, (id) => db.artikel.get(id));
    if (unter.length) {
      liste.push({
        schluessel: `leistungen-unter-stundensatz:${unter.map((l) => l.id).sort().join(',')}`,
        art: 'problem' as const,
        titel: unter.length === 1 ? `„${unter[0].name}“ bringt weniger als deinen Stundensatz` : `${unter.length} Leistungen bringen weniger als deinen Stundensatz`,
        text: 'Preis oder Minuten passen nicht zusammen. Bei jedem Auftrag damit verschenkst du Geld.',
        gewicht: 45,
        fuerRollen: ['chef' as const, 'buero' as const],
        pfad: '/betrieb/leistungen?filter=unter',
      });
    }
    return liste;
  },
  aktionen: {
    'leistungen.stundensatzUebernehmen': (p) => {
      const { cent } = p as { cent: number };
      db.betrieb.update('betrieb', { stundensatz: cent }, { text: `Stundensatz auf ${euro(cent)} gesetzt` });
      return '/betrieb/leistungen/stundensatz';
    },
    'leistungen.preiseZuruecksetzen': (p) => {
      const { aenderungen } = p as { aenderungen: { id: string; preis: number }[] };
      batch(() => aenderungen.forEach((a) => db.leistungen.update(a.id, { preis: a.preis }, { text: 'Automatische Preisänderung zurückgenommen' })));
      return '/betrieb/leistungen';
    },
  },
  automationen: [
    {
      id: LOHN_AUTOMATION,
      titel: 'Stundenpreise mit dem Stundensatz mitziehen',
      beschreibung: 'Änderst du den Stundensatz, passt Macher alle Stundenleistungen an, die bisher genau den alten Satz hatten.',
      standardAn: true,
      minuten: 2,
      start: () =>
        on('betrieb.updated', (e) => {
          const alt = e.vorher as Betrieb | undefined;
          const neu = e.objekt as Betrieb | undefined;
          if (!alt || !neu || alt.stundensatz === neu.stundensatz) return;
          const betroffen = db.leistungen.where((l) => l.einheit === 'h' && l.preis === alt.stundensatz);
          if (!betroffen.length) return;
          batch(() => betroffen.forEach((l) => db.leistungen.update(l.id, { preis: neu.stundensatz }, { text: `Preis mit Stundensatz angepasst: ${euro(alt.stundensatz)} → ${euro(neu.stundensatz)}` })));
          erledigt(LOHN_AUTOMATION, betroffen.length === 1 ? `„${betroffen[0].name}“ auf ${euro(neu.stundensatz)} angepasst` : `${betroffen.length} Stundenpreise auf ${euro(neu.stundensatz)} angepasst`, {
            text: betroffen.map((l) => l.name).join(', '),
            minuten: 2 * betroffen.length,
            rueckgaengig: { aktion: 'leistungen.preiseZuruecksetzen', payload: { aenderungen: betroffen.map((l) => ({ id: l.id, preis: alt.stundensatz })) } },
          });
        }),
    },
  ],
});
