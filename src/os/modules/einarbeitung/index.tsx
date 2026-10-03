import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { on } from '@core/events';
import { erledigt } from '@core/macher';
import { heute, personName, plusTage } from '@core/format';
import type { Mitarbeiter } from '@core/objects';
import { stand, type Unterweisung } from '@modules/unterweisungen/daten';
import { einarbeitungen, fortschritt, ueberfaellig } from './daten';
import { EinarbeitungDetail, EinarbeitungenSeite, MitarbeiterEinarbeitungTab, planStarten } from './Ansichten';

export function einarbeitungHinweise(t = heute()): HinweisVorschlag[] {
  return einarbeitungen
    .where((e) => !e.abgeschlossenAm)
    .map((e) => ({ e, ueber: ueberfaellig(e, t), m: db.mitarbeiter.get(e.mitarbeiterId) }))
    .filter((x) => x.ueber.length && x.m?.aktiv)
    .map(({ e, ueber, m }) => ({
      schluessel: `einarbeitung:${e.id}:${ueber.length}`,
      art: 'problem' as const,
      titel: `Einarbeitung ${m!.vorname}: ${ueber.length === 1 ? '1 Schritt' : `${ueber.length} Schritte`} überfällig`,
      text: ueber
        .slice(0, 3)
        .map((s) => s.titel)
        .join(' · '),
      bezug: { typ: 'mitarbeiter' as const, id: e.mitarbeiterId },
      gewicht: 40,
      fuerRollen: ['chef' as const, 'buero' as const],
      pfad: `/betrieb/einarbeitung/${e.id}`,
    }));
}

/** Unterweisung bestätigt → passende Einarbeitungs-Schritte abhaken. Gibt die Anzahl zurück. */
export function unterweisungAbhaken(u: Unterweisung): number {
  let n = 0;
  const t = heute();
  for (const e of einarbeitungen.where((x) => !x.abgeschlossenAm)) {
    if (stand(u, e.mitarbeiterId, t).status === 'offen' || stand(u, e.mitarbeiterId, t).status === 'faellig') continue;
    const treffer = e.schritte.filter((s) => s.unterweisungId === u.id && !s.erledigt);
    if (!treffer.length) continue;
    const schritte = e.schritte.map((s) => (treffer.includes(s) ? { ...s, erledigt: true, erledigtAm: new Date().toISOString() } : s));
    einarbeitungen.update(e.id, { schritte, abgeschlossenAm: schritte.every((s) => s.erledigt) ? new Date().toISOString() : undefined }, { text: 'Unterweisung bestätigt' });
    n += treffer.length;
  }
  return n;
}

export default defineModul({
  id: 'einarbeitung',
  titel: 'Mitarbeiter einarbeiten',
  bereich: 'betrieb',
  gruppe: 'team',
  beschreibung: 'Automatischer Einarbeitungsplan je Rolle: Unterlagen, Ausstattung, Zugänge, Unterweisungen.',
  icon: 'liste',
  gewicht: 40,
  routen: [
    { pfad: '', element: EinarbeitungenSeite },
    { pfad: ':id', element: EinarbeitungDetail },
  ],
  kurzinfo: () => {
    const laufend = einarbeitungen.where((e) => !e.abgeschlossenAm);
    if (!laufend.length) return undefined;
    const f = laufend.reduce((s, e) => s + fortschritt(e).fertig, 0);
    const g = laufend.reduce((s, e) => s + fortschritt(e).gesamt, 0);
    return { text: `${laufend.length} laufend · ${Math.round((f / Math.max(1, g)) * 100)} % erledigt`, ton: 'aktiv' };
  },
  tabs: [
    {
      objekt: 'mitarbeiter',
      titel: 'Einarbeitung',
      component: MitarbeiterEinarbeitungTab,
      gewicht: 85,
      sichtbar: (id) => einarbeitungen.all().some((e) => e.mitarbeiterId === id && !e.abgeschlossenAm),
    },
  ],
  hinweise: () => einarbeitungHinweise(),
  automationen: [
    {
      id: 'einarbeitung.plan',
      titel: 'Einarbeitungsplan beim Anlegen',
      beschreibung: 'Legst du einen neuen Mitarbeiter an, erstellt Lotte sofort den Einarbeitungsplan passend zur Rolle – inklusive Pflicht-Unterweisungen.',
      standardAn: true,
      minuten: 20,
      start: () =>
        on('mitarbeiter.created', (ev) => {
          const m = ev.objekt as Mitarbeiter;
          if (m.beispiel || m.rolle === 'chef') return;
          if (einarbeitungen.all().some((e) => e.mitarbeiterId === m.id)) return;
          const e = planStarten(m.id, m.eintritt && m.eintritt > heute() ? m.eintritt : heute());
          if (e) erledigt('einarbeitung.plan', `Einarbeitungsplan für ${personName(m)} angelegt`, { bezug: { typ: 'mitarbeiter', id: m.id }, text: `${e.schritte.length} Schritte` });
        }),
    },
    {
      id: 'einarbeitung.unterweisung',
      titel: 'Unterweisungen in der Einarbeitung abhaken',
      beschreibung: 'Bestätigt ein neuer Mitarbeiter eine Unterweisung am Handy, hakt Lotte den Schritt im Einarbeitungsplan ab.',
      standardAn: true,
      minuten: 1,
      start: () =>
        on('unterweisungen.updated', (ev) => {
          const u = ev.objekt as Unterweisung;
          const n = unterweisungAbhaken(u);
          if (n) erledigt('einarbeitung.unterweisung', `Unterweisung „${u.titel}“ in der Einarbeitung abgehakt`);
        }),
    },
  ],
  seed: () => {
    const azubi = db.mitarbeiter.where((m) => !!m.beispiel && m.rolle === 'azubi')[0];
    if (!azubi) return;
    const e = planStarten(azubi.id, plusTage(heute(), -10));
    if (!e) return;
    const schritte = e.schritte.map((s) => (s.tag <= 1 ? { ...s, erledigt: true, erledigtAm: new Date().toISOString() } : s));
    einarbeitungen.update(e.id, { schritte, beispiel: true }, { leise: true });
  },
});
