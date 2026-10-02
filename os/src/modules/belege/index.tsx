import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { datum, euro, heute, passt, tageZwischen } from '@core/format';
import type { ID } from '@core/objects';
import { darf } from '@core/session';
import { belegAendern, type BelegX } from '../rechnungen/typen';
import { AuftragBelegeTab, BelegDetail, BelegeListe, BelegNeu, BelegSchnell } from './Ansichten';
import { alleBelege, auftragVorschlaege, belegX, brutto, fristenAusKonditionen, lieferantName, naechsteFrist, sichererVorschlag } from './logik';

const pfad = (id: ID) => `/betrieb/belege/${id}`;

export default defineModul({
  id: 'belege',
  titel: 'Eingangsrechnungen & Belege',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Lieferantenrechnungen und Quittungen fotografieren, prüfen, dem Auftrag zuordnen.',
  icon: 'dokument',
  gewicht: 70,
  routen: [
    { pfad: '', element: BelegeListe },
    { pfad: 'neu', element: BelegNeu },
    { pfad: ':id', element: BelegDetail },
  ],
  detail: [{ objekt: 'belege', pfad }],
  kurzinfo: () => {
    const neu = alleBelege().filter((b) => b.status === 'neu').length;
    const frist = alleBelege().filter((b) => {
      const f = naechsteFrist(b);
      return f && f.tage <= 3;
    }).length;
    if (frist) return { text: frist === 1 ? '1 Frist läuft ab' : `${frist} Fristen laufen ab`, ton: 'achtung' };
    return neu ? { text: neu === 1 ? '1 Beleg zu prüfen' : `${neu} Belege zu prüfen`, ton: 'aktiv' } : undefined;
  },
  schnell: [{ id: 'beleg', label: 'Beleg fotografieren', icon: 'kamera', component: BelegSchnell, gewicht: 45 }],
  erstellen: [{ label: 'Beleg fotografieren', pfad: '/betrieb/belege/neu', gewicht: 35 }],
  tabs: [
    {
      objekt: 'auftraege',
      titel: 'Belege',
      component: AuftragBelegeTab,
      gewicht: 30,
      zaehler: (id) => alleBelege().filter((b) => b.auftragId === id).length || undefined,
      sichtbar: (id) => alleBelege().some((b) => b.auftragId === id),
    },
  ],
  hinweise: () => {
    if (!darf('geld')) return [];
    const liste = [];
    for (const b of alleBelege()) {
      const f = naechsteFrist(b);
      if (!f) continue;
      const name = lieferantName(b);
      if (f.art === 'skonto' && f.tage <= 3) {
        liste.push({
          schluessel: `beleg-skonto:${b.id}`,
          art: 'entscheidung' as const,
          titel: `Skonto sichern: ${name}${f.betrag ? ` – ${euro(f.betrag)} sparen` : ''}`,
          text: `${euro(brutto(b))} · Skonto nur bis ${datum(f.datum)}${f.tage === 0 ? ' (heute)' : ''}.`,
          bezug: { typ: 'belege' as const, id: b.id },
          gewicht: 68,
          fuerRollen: ['chef' as const, 'buero' as const],
          faellig: f.datum,
          pfad: pfad(b.id),
          aktionen: [{ aktion: 'beleg.bezahlt', label: 'Ist bezahlt', primaer: true, payload: { belegId: b.id } }],
        });
      } else if (f.art === 'faellig' && f.tage <= 3) {
        liste.push({
          schluessel: `beleg-faellig:${b.id}`,
          art: 'problem' as const,
          titel: f.tage < 0 ? `Lieferantenrechnung überfällig: ${name}` : `Lieferantenrechnung fällig: ${name}`,
          text: `${euro(brutto(b))} · zahlen bis ${datum(f.datum)}.`,
          bezug: { typ: 'belege' as const, id: b.id },
          gewicht: f.tage < 0 ? 63 : 52,
          fuerRollen: ['chef' as const, 'buero' as const],
          faellig: f.datum,
          pfad: pfad(b.id),
          aktionen: [{ aktion: 'beleg.bezahlt', label: 'Ist bezahlt', primaer: true, payload: { belegId: b.id } }],
        });
      }
    }
    // Belege, die seit einer Woche niemand geprüft hat
    const liegen = alleBelege().filter((b) => b.status === 'neu' && tageZwischen(b.erstelltAm.slice(0, 10), heute()) > 7);
    if (liegen.length)
      liste.push({
        schluessel: 'belege-pruefen',
        art: 'info' as const,
        titel: liegen.length === 1 ? '1 Beleg wartet seit über einer Woche auf Prüfung' : `${liegen.length} Belege warten seit über einer Woche auf Prüfung`,
        gewicht: 30,
        fuerRollen: ['chef' as const, 'buero' as const],
        pfad: '/betrieb/belege',
      });
    return liste;
  },
  aktionen: {
    'beleg.bezahlt': (payload) => {
      const id = (payload as { belegId: ID }).belegId;
      if (belegX(id)) belegAendern(id, { status: 'bezahlt' }, { text: 'Als bezahlt markiert' });
    },
    'beleg.zuordnung-aufheben': (payload) => {
      const id = (payload as { belegId: ID }).belegId;
      belegAendern(id, { auftragId: undefined, zuordnungGrund: undefined }, { text: 'Zuordnung aufgehoben' });
      return pfad(id);
    },
  },
  automationen: [
    {
      id: 'belege.zuordnen',
      titel: 'Belege dem richtigen Auftrag zuordnen',
      beschreibung: 'Passt ein Beleg eindeutig zu einem Auftrag (gleicher Lieferant, Einsatz am selben Tag), ordnet Macher ihn zu. Du kannst es rückgängig machen.',
      standardAn: true,
      minuten: 2,
      start: () =>
        on('belege.created', (e) => {
          const b = e.objekt as BelegX | undefined;
          if (!b || b.auftragId) return;
          const v = sichererVorschlag(auftragVorschlaege(b));
          if (!v) return;
          const a = db.auftraege.get(v.auftragId);
          const grund = v.gruende.join(' · ');
          belegAendern(b.id, { auftragId: v.auftragId, zuordnungGrund: grund }, { text: `Macher hat ${a?.nummer} zugeordnet` });
          erledigt('belege.zuordnen', `Beleg von ${lieferantName(b)} zu ${a?.nummer} zugeordnet`, {
            text: grund,
            bezug: { typ: 'belege', id: b.id },
            rueckgaengig: { aktion: 'beleg.zuordnung-aufheben', payload: { belegId: b.id } },
          });
        }),
    },
    {
      id: 'belege.fristen',
      titel: 'Zahlungsziel und Skonto aus den Lieferanten-Konditionen',
      beschreibung: 'Steht beim Lieferanten z. B. „3 % Skonto 10 Tage, 30 Tage netto“, trägt Macher die Fristen am Beleg ein.',
      standardAn: true,
      minuten: 1,
      start: () =>
        on('belege.*', (e) => {
          if (e.typ !== 'belege.created' && e.typ !== 'belege.updated') return;
          const b = e.objekt as BelegX | undefined;
          if (!b || b.status === 'bezahlt' || !b.lieferantId) return;
          const vorher = e.vorher as BelegX | undefined;
          if (vorher && vorher.lieferantId === b.lieferantId && vorher.datum === b.datum) return;
          // bei Lieferanten- oder Datumswechsel neu ableiten
          const f = fristenAusKonditionen(vorher ? { ...b, faelligAm: undefined, skontoBis: undefined, skontoProzent: undefined } : b);
          if (f.faelligAm !== b.faelligAm || f.skontoBis !== b.skontoBis || f.skontoProzent !== b.skontoProzent)
            belegAendern(b.id, f, { leise: true });
        }),
    },
  ],
  suche: (q) =>
    alleBelege()
      .filter((b) => passt(q, lieferantName(b), b.nummer, b.kategorie, db.auftraege.get(b.auftragId)?.nummer))
      .slice(0, 6)
      .map((b) => ({
        typ: 'Beleg',
        titel: `${lieferantName(b)}${b.nummer ? ` · ${b.nummer}` : ''}`,
        untertitel: `${datum(b.datum)}${darf('geld') ? ` · ${euro(brutto(b))}` : ''}`,
        pfad: pfad(b.id),
        relevanz: 40,
      })),
});

