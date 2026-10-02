import { defineModul, type HinweisVorschlag } from '@core/modul';
import { db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { benachrichtigen, erledigt } from '@core/macher';
import { heute, passt, plusTage, zeitpunkt } from '@core/format';
import type { ID } from '@core/objects';
import { VORLAGEN, brauchtBestaetigung, stand, unterweisungen, zielgruppe } from './daten';
import { MitarbeiterUnterweisungenTab, UnterweisungDetail, UnterweisungenSeite, erinnern } from './Ansichten';

export function unterweisungenHinweise(t = heute()): HinweisVorschlag[] {
  const liste: HinweisVorschlag[] = [];
  const team = db.mitarbeiter.all();
  const aktive = unterweisungen.where((x) => x.aktiv);
  const proPerson = new Map<ID, string[]>();
  for (const u of aktive)
    for (const m of zielgruppe(u, team))
      if (brauchtBestaetigung(stand(u, m.id, t))) proPerson.set(m.id, [...(proPerson.get(m.id) ?? []), u.titel]);
  for (const [maId, titel] of proPerson) {
    liste.push({
      schluessel: `unterweisung:${maId}:${titel.length}`,
      art: 'entscheidung',
      titel: titel.length === 1 ? `Unterweisung „${titel[0]}“ bestätigen` : `${titel.length} Unterweisungen bestätigen`,
      text: titel.length === 1 ? 'Kurz lesen und am Handy bestätigen – dauert zwei Minuten.' : titel.join(' · '),
      gewicht: 50,
      fuerMitarbeiterId: maId,
      pfad: '/betrieb/unterweisungen',
    });
  }
  const andere = [...proPerson.keys()].map((id) => db.mitarbeiter.get(id)).filter((m) => m && m.rolle !== 'chef' && m.rolle !== 'buero');
  if (andere.length)
    liste.push({
      schluessel: `unterweisung-team:${andere.length}`,
      art: 'problem',
      titel: `Unterweisungen: ${andere.length === 1 ? '1 Mitarbeiter ist' : `${andere.length} Mitarbeiter sind`} nicht auf dem aktuellen Stand`,
      text: andere.map((m) => `${m!.vorname} (${proPerson.get(m!.id)!.length})`).join(', '),
      gewicht: 40,
      fuerRollen: ['chef', 'buero'],
      aktionen: [{ aktion: 'unterweisung.erinnern', label: 'Alle erinnern', primaer: true, payload: {} }],
      pfad: '/betrieb/unterweisungen',
    });
  return liste;
}

/** Automatische Erinnerung: einmal je fälliger Runde (Datum der nächsten Fälligkeit) */
export function automatischErinnern(t = heute()): number {
  let n = 0;
  for (const u of unterweisungen.where((x) => x.aktiv)) {
    for (const m of zielgruppe(u, db.mitarbeiter.all())) {
      const s = stand(u, m.id, t);
      if (s.status !== 'bald' && s.status !== 'faellig' && s.status !== 'offen') continue;
      const key = `unterweisungen.erinnert.${u.id}.${m.id}.${s.naechste ?? 'erstmals'}`;
      if (einstellung(key, false)) continue;
      setzeEinstellung(key, true);
      benachrichtigen(`Unterweisung „${u.titel}“ ${s.status === 'bald' ? 'steht bald an' : 'bestätigen'}`, { text: 'Öffne sie in Macher OS, lies sie kurz und bestätige.', fuer: m.id });
      n++;
    }
  }
  if (n) erledigt('unterweisungen.erinnern', `${n === 1 ? '1 Mitarbeiter' : `${n} Mitarbeiter`} an Unterweisungen erinnert`);
  return n;
}

export default defineModul({
  id: 'unterweisungen',
  titel: 'Unterweisungen & Nachweise',
  bereich: 'betrieb',
  gruppe: 'team',
  beschreibung: 'Jährliche Pflichtunterweisungen digital bestätigen lassen – mit Nachweisliste.',
  icon: 'unterschrift',
  gewicht: 55,
  routen: [
    { pfad: '', element: UnterweisungenSeite },
    { pfad: ':id', element: UnterweisungDetail },
  ],
  kurzinfo: () => {
    const t = heute();
    const team = db.mitarbeiter.all();
    const offen = unterweisungen.where((u) => u.aktiv).reduce((s, u) => s + zielgruppe(u, team).filter((m) => brauchtBestaetigung(stand(u, m.id, t))).length, 0);
    return offen ? { text: `${offen} Bestätigungen offen`, ton: 'achtung' } : unterweisungen.all().length ? { text: 'Alle unterwiesen', ton: 'erfolg' } : undefined;
  },
  tabs: [{ objekt: 'mitarbeiter', titel: 'Unterweisungen', component: MitarbeiterUnterweisungenTab, gewicht: 55 }],
  suche: (q) =>
    unterweisungen
      .where((u) => passt(q, u.titel, u.inhalt, 'unterweisung'))
      .slice(0, 5)
      .map((u) => ({ typ: 'Unterweisung', titel: u.titel, pfad: `/betrieb/unterweisungen/${u.id}`, relevanz: 30 })),
  hinweise: () => unterweisungenHinweise(),
  aktionen: {
    'unterweisung.erinnern': (p) => {
      const id = (p as { unterweisungId?: ID } | undefined)?.unterweisungId;
      for (const u of unterweisungen.where((x) => x.aktiv && (!id || x.id === id))) erinnern(u);
    },
  },
  automationen: [
    {
      id: 'unterweisungen.erinnern',
      titel: 'An Unterweisungen erinnern',
      beschreibung: 'Rund 30 Tage vor Ablauf und bei offenen Unterweisungen bekommt jeder Mitarbeiter einmal eine Erinnerung aufs Handy.',
      standardAn: true,
      minuten: 5,
      start: () => () => {},
      pruefen: () => {
        automatischErinnern();
      },
    },
  ],
  seed: () => {
    const betrieb = db.betrieb.get('betrieb');
    const qualis = db.qualifikationen.all();
    for (const v of VORLAGEN) {
      if (v.gewerke && betrieb && !v.gewerke.includes(betrieb.gewerk)) continue;
      if (unterweisungen.all().some((u) => u.titel === v.titel)) continue;
      unterweisungen.create({
        titel: v.titel,
        inhalt: v.inhalt,
        intervallMonate: v.intervallMonate,
        rollen: v.rollen,
        qualifikationId: qualis.find((q) => q.name === v.quali)?.id,
        bestaetigungen: [],
        aktiv: true,
      });
    }
    // Beispiel: zwei Monteure haben die allgemeine Unterweisung vor knapp einem Jahr bestätigt
    const beispiel = db.mitarbeiter.where((m) => !!m.beispiel && m.rolle === 'monteur');
    const allgemein = unterweisungen.all().find((u) => u.titel === 'Arbeitsschutz allgemein');
    if (allgemein && beispiel.length) {
      const t = heute();
      unterweisungen.update(
        allgemein.id,
        { bestaetigungen: beispiel.map((m, i) => ({ mitarbeiterId: m.id, am: zeitpunkt(plusTage(t, -340 - i * 30), '07:15') })) },
        { leise: true },
      );
    }
  },
});
