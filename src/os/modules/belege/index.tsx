import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { datum, euro, heute, passt, tageZwischen } from '@core/format';
import type { ID } from '@core/objects';
import { darf } from '@core/session';
import { belegAendern, type BelegX } from '../rechnungen/typen';
import { AuftragBelegeTab, BelegDetail, BelegeListe, BelegNeu, BelegSchnell } from './Ansichten';
import { bereichVorschlag } from './bereiche';
import { alleBelege, alsBezahlt, auftragVorschlaege, belegSchritt, belegX, brutto, fristenAusKonditionen, lieferantName, naechsteFrist, sichererVorschlag } from './logik';

const pfad = (id: ID) => `/betrieb/belege/${id}`;

export default defineModul({
  id: 'belege',
  titel: 'Eingangsrechnungen & Belege',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Lieferantenrechnungen ablegen, fotografieren oder per E-Mail weiterleiten – prüfen, dem Auftrag zuordnen, freigeben, bezahlen.',
  icon: 'dokument',
  gewicht: 70,
  routen: [
    { pfad: '', element: BelegeListe },
    { pfad: 'neu', element: BelegNeu },
    { pfad: ':id', element: BelegDetail },
  ],
  detail: [{ objekt: 'belege', pfad }],
  kurzinfo: () => {
    const alle = alleBelege();
    const frist = alle.filter((b) => {
      const f = naechsteFrist(b);
      return f && f.tage <= 3;
    }).length;
    if (frist) return { text: frist === 1 ? '1 Frist läuft ab' : `${frist} Fristen laufen ab`, ton: 'achtung' };
    const pruefen = alle.filter((b) => belegSchritt(b) === 'pruefen').length;
    if (pruefen) return { text: pruefen === 1 ? '1 Beleg zu prüfen' : `${pruefen} Belege zu prüfen`, ton: 'aktiv' };
    const frei = alle.filter((b) => ['zuordnen', 'freigeben'].includes(belegSchritt(b))).length;
    return frei ? { text: frei === 1 ? '1 Beleg freizugeben' : `${frei} Belege freizugeben`, ton: 'aktiv' } : undefined;
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
    // Zugewiesene Prüfung: die Person sieht ihre Belege
    const jePerson = new Map<ID, number>();
    for (const b of alleBelege()) if (b.pruefendeId && belegSchritt(b) === 'pruefen') jePerson.set(b.pruefendeId, (jePerson.get(b.pruefendeId) ?? 0) + 1);
    for (const [mid, n] of jePerson)
      liste.push({
        schluessel: `belege-pruefen-fuer:${mid}`,
        art: 'info' as const,
        titel: n === 1 ? '1 Beleg wartet auf deine Prüfung' : `${n} Belege warten auf deine Prüfung`,
        gewicht: 40,
        fuerMitarbeiterId: mid,
        pfad: '/betrieb/belege',
      });
    // Geprüft und zugeordnet – wartet auf Freigabe (Chef/Büro)
    const freigabe = alleBelege().filter((b) => belegSchritt(b) === 'freigeben');
    if (freigabe.length)
      liste.push({
        schluessel: 'belege-freigeben',
        art: 'freigabe' as const,
        titel: freigabe.length === 1 ? `Eingangsrechnung freigeben: ${lieferantName(freigabe[0])}` : `${freigabe.length} Eingangsrechnungen freigeben`,
        text: freigabe.length === 1 ? `${euro(brutto(freigabe[0]))} · geprüft und zugeordnet.` : 'Geprüft und dem Auftrag zugeordnet.',
        gewicht: 45,
        fuerRollen: ['chef' as const, 'buero' as const],
        pfad: freigabe.length === 1 ? pfad(freigabe[0].id) : '/betrieb/belege?ansicht=freigeben',
      });
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
      if (belegX(id)) alsBezahlt(id);
    },
    'beleg.zuordnung-aufheben': (payload) => {
      const id = (payload as { belegId: ID }).belegId;
      belegAendern(id, { auftragId: undefined, bereich: undefined, zuordnungGrund: undefined }, { text: 'Zuordnung aufgehoben' });
      return pfad(id);
    },
  },
  automationen: [
    {
      id: 'belege.zuordnen',
      titel: 'Belege dem richtigen Auftrag oder Betriebsbereich zuordnen',
      beschreibung:
        'Passt ein Beleg eindeutig zu einem Auftrag (gleicher Lieferant, Einsatz am selben Tag), ordnet Macher ihn zu. Sonst nimmt Macher den Betriebsbereich, wenn er klar ist (Tankbeleg → Fahrzeuge, Lieferant wie beim letzten Mal). Du kannst es rückgängig machen.',
      standardAn: true,
      minuten: 2,
      start: () =>
        on('belege.created', (e) => {
          const b = e.objekt as BelegX | undefined;
          if (!b || b.auftragId || b.bereich) return;
          const v = sichererVorschlag(auftragVorschlaege(b));
          if (!v) {
            const bv = bereichVorschlag(b);
            if (!bv?.sicher) return;
            belegAendern(b.id, { bereich: bv.bereich, zuordnungGrund: bv.grund }, { text: `Macher hat den Bereich ${bv.bereich} zugeordnet` });
            erledigt('belege.zuordnen', `Beleg von ${lieferantName(b)} dem Bereich ${bv.bereich} zugeordnet`, {
              text: bv.grund,
              bezug: { typ: 'belege', id: b.id },
              rueckgaengig: { aktion: 'beleg.zuordnung-aufheben', payload: { belegId: b.id } },
            });
            return;
          }
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
      id: 'belege.pruefer',
      titel: 'Neue Belege dem Büro zum Prüfen zuweisen',
      beschreibung: 'Gibt es genau eine Person im Büro, prüft sie neue Belege. Du kannst die Zuweisung am Beleg ändern.',
      standardAn: true,
      minuten: 1,
      start: () =>
        on('belege.created', (e) => {
          const b = e.objekt as BelegX | undefined;
          if (!b || b.pruefendeId || b.status !== 'neu' || b.beispiel) return;
          const buero = db.mitarbeiter.where((m) => m.aktiv && m.rolle === 'buero');
          if (buero.length === 1) belegAendern(b.id, { pruefendeId: buero[0].id }, { text: `${buero[0].vorname} prüft` });
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
      .filter((b) => passt(q, lieferantName(b), b.nummer, b.kategorie, b.bereich, db.auftraege.get(b.auftragId)?.nummer, b.eingangVon))
      .slice(0, 6)
      .map((b) => ({
        typ: 'Beleg',
        titel: `${lieferantName(b)}${b.nummer ? ` · ${b.nummer}` : ''}`,
        untertitel: `${datum(b.datum)}${darf('geld') ? ` · ${euro(brutto(b))}` : ''}`,
        pfad: pfad(b.id),
        relevanz: 40,
      })),
});

