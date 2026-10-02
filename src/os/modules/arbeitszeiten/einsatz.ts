/**
 * Aktionen `einsatz.starten` / `einsatz.beenden` und die Prüfungen für „Braucht dich“.
 * Getrennt von index.tsx, damit sie ohne React testbar sind.
 */
import { db } from '@core/db';
import { emit } from '@core/events';
import { erledigt } from '@core/macher';
import type { HinweisVorschlag } from '@core/modul';
import { datum, datumVon, heute as heuteDatum, kalenderwoche, minutenAus, personName, plusTage, uhrzeit, wochenStart } from '@core/format';
import { istArbeitstag } from '@core/kalender';
import type { Datum, ID, Zeiteintrag } from '@core/objects';
import { ich } from '@core/session';
import { abwesenheitAm } from '@modules/abwesenheiten/daten';
import { istAktiv } from '@modules/mitarbeiter/team';
import { autoPauseAn, jetztUhr, laufende, sollPlanTag, starten, stoppen, tagesProbleme } from './daten';
import { freigeben } from './regelwerk';

interface EinsatzPayload {
  terminId: ID;
  mitarbeiterId?: ID;
}

/** Zeit auf den Termin starten, Terminstatus „vor Ort“, Event `einsatz.gestartet` */
export function einsatzStarten(payload: unknown): Zeiteintrag | undefined {
  const { terminId, mitarbeiterId } = (payload ?? {}) as EinsatzPayload;
  const t = db.termine.get(terminId);
  const maId = mitarbeiterId ?? ich()?.id;
  if (!t || !maId) return undefined;
  let z = laufende(maId).find((x) => x.terminId === terminId && x.art === 'arbeit');
  if (!z) z = starten(maId, { terminId, auftragId: t.auftragId, art: 'arbeit' });
  if (t.status !== 'vor_ort') db.termine.update(t.id, { status: 'vor_ort' }, { text: `Einsatz gestartet (${personName(db.mitarbeiter.get(maId))})` });
  emit({ typ: 'einsatz.gestartet', objekt: db.termine.get(t.id), daten: { terminId, mitarbeiterId: maId, zeitId: z.id } });
  return z;
}

/** Zeit auf dem Termin stoppen; sind alle fertig, wird der Termin erledigt. Event `einsatz.beendet` */
export function einsatzBeenden(payload: unknown): Zeiteintrag[] {
  const { terminId, mitarbeiterId } = (payload ?? {}) as EinsatzPayload;
  const t = db.termine.get(terminId);
  const maId = mitarbeiterId ?? ich()?.id;
  if (!t || !maId) return [];
  const gestoppt = laufende(maId)
    .filter((z) => z.terminId === terminId)
    .map((z) => stoppen(z, z.datum === heuteDatum() ? jetztUhr() : uhrzeit(t.ende)))
    .filter(Boolean) as Zeiteintrag[];
  const nochAktiv = db.zeiten.where((z) => z.terminId === terminId && !z.ende).length > 0;
  if (!nochAktiv && t.status !== 'erledigt') db.termine.update(t.id, { status: 'erledigt' }, { text: 'Einsatz beendet' });
  emit({ typ: 'einsatz.beendet', objekt: db.termine.get(t.id), daten: { terminId, mitarbeiterId: maId, zeitIds: gestoppt.map((z) => z.id) } });
  return gestoppt;
}

/** Läuft seit einem früheren Tag und hat einen Termin → zum Terminende beenden (Automation) */
export function vergesseneBeenden(t = heuteDatum()): number {
  let n = 0;
  for (const z of db.zeiten.where((x) => !x.ende && x.datum < t && !!x.terminId)) {
    const termin = db.termine.get(z.terminId);
    if (!termin || datumVon(termin.ende) !== z.datum) continue;
    const ende = uhrzeit(termin.ende);
    if (minutenAus(ende) <= minutenAus(z.start)) continue;
    stoppen(z, ende, `Automatisch zum Terminende ${ende} beendet`);
    db.zeiten.update(z.id, { notiz: [z.notiz, 'Automatisch zum Terminende beendet – bitte prüfen'].filter(Boolean).join(' · ') }, { leise: true });
    erledigt('arbeitszeiten.vergessen', `Vergessene Zeit von ${personName(db.mitarbeiter.get(z.mitarbeiterId))} zum Terminende beendet`, {
      bezug: { typ: 'zeiten', id: z.id },
      text: `${datum(z.datum)}, ${z.start}–${ende} · ${termin.titel}`,
    });
    n++;
  }
  return n;
}

/** Freigabe aller abgeschlossenen Zeiten bis einschließlich `bis` (optional ab `von`) – meldet `zeit.freigegeben` */
export function zeitenFreigeben(bis: Datum, von?: Datum): number {
  return freigeben(db.zeiten.where((z) => !!z.ende && !z.freigegeben && z.datum <= bis && (!von || z.datum >= von)));
}

// ------------------------------------------------------------------ Hinweise

export function zeitenHinweise(t = heuteDatum()): HinweisVorschlag[] {
  const liste: HinweisVorschlag[] = [];
  const betrieb = db.betrieb.get('betrieb');
  const feierabend = betrieb?.arbeitsende ?? '16:00';

  // 1. Zeit läuft noch seit gestern (oder länger)
  for (const z of db.zeiten.where((x) => !x.ende && x.datum < t)) {
    const m = db.mitarbeiter.get(z.mitarbeiterId);
    const ende = minutenAus(feierabend) > minutenAus(z.start) ? feierabend : undefined;
    liste.push({
      schluessel: `zeit-laeuft:${z.id}`,
      art: 'problem',
      titel: `Deine Zeit läuft noch seit ${z.datum === plusTage(t, -1) ? 'gestern' : datum(z.datum)}, ${z.start} Uhr`,
      text: 'Trag ein, wann du Schluss gemacht hast – sonst stimmt dein Stundenkonto nicht.',
      bezug: { typ: 'mitarbeiter', id: z.mitarbeiterId },
      gewicht: 75,
      fuerMitarbeiterId: m?.id,
      aktionen: ende ? [{ aktion: 'zeiten.beenden', label: `Um ${ende} beenden`, primaer: true, payload: { zeitId: z.id, ende } }] : undefined,
      pfad: `/betrieb/arbeitszeiten`,
    });
  }

  // 2. Keine Zeiten gestern (nur wer die Stempeluhr schon nutzt)
  const gestern = plusTage(t, -1);
  // Soll laut Arbeitszeitmodell (Teilzeit, Feiertage) – nicht nur die Arbeitstage des Betriebs
  if (istArbeitstag(gestern) || db.mitarbeiter.all().some((m) => sollPlanTag(m, gestern) > 0)) {
    const abw = db.abwesenheiten.all();
    const ohne = db.mitarbeiter
      .where((m) => istAktiv(m, gestern) && m.rolle !== 'chef' && (!m.eintritt || m.eintritt <= gestern))
      .filter((m) => db.zeiten.where((z) => z.mitarbeiterId === m.id).length > 0)
      .filter((m) => sollPlanTag(m, gestern) > 0)
      .filter((m) => !abwesenheitAm(m.id, gestern, abw))
      .filter((m) => !db.zeiten.where((z) => z.mitarbeiterId === m.id && z.datum === gestern).length);
    for (const m of ohne) {
      liste.push({
        schluessel: `keine-zeiten:${m.id}:${gestern}`,
        art: 'problem',
        titel: 'Für gestern fehlen deine Zeiten',
        text: 'Trag kurz nach, wann du angefangen und aufgehört hast.',
        gewicht: 55,
        fuerMitarbeiterId: m.id,
        aktionen: [{ aktion: 'zeiten.nachtragen', label: 'Zeit nachtragen', primaer: true, payload: { datum: gestern, mitarbeiterId: m.id } }],
        pfad: `/betrieb/arbeitszeiten/woche?nachtrag=${gestern}`,
      });
    }
    if (ohne.length)
      liste.push({
        schluessel: `keine-zeiten-team:${gestern}`,
        art: 'info',
        titel: `Keine Zeiten gestern: ${ohne.map((m) => m.vorname).join(', ')}`,
        text: 'Die Mitarbeiter sind selbst erinnert. Du kannst die Zeiten auch für sie nachtragen.',
        gewicht: 35,
        fuerRollen: ['chef', 'buero'],
        pfad: `/betrieb/arbeitszeiten/woche?datum=${gestern}`,
      });
  }

  // 3. ArbZG der letzten 14 Tage (nicht freigegebene Tage). Fehlende Pausen zieht Macher automatisch ab –
  //    dann bleibt ein leichterer Hinweis, damit das Büro mit dem Mitarbeiter sprechen kann.
  const autoPause = autoPauseAn();
  const zeiten = db.zeiten.where((z) => z.datum >= plusTage(t, -15) && z.datum < t);
  const tage = new Set(zeiten.filter((z) => !z.freigegeben).map((z) => `${z.mitarbeiterId}|${z.datum}`));
  for (const k of tage) {
    const [maId, d] = k.split('|');
    const { probleme, pauseAuto } = tagesProbleme(maId, d, zeiten, autoPause);
    if (!probleme.length) continue;
    const nurPause = pauseAuto > 0 && probleme.length === 1;
    const m = db.mitarbeiter.get(maId);
    liste.push({
      schluessel: `arbzg:${maId}:${d}`,
      art: 'problem',
      titel: `${nurPause ? 'Pause fehlte' : 'Arbeitszeitgesetz'}: ${m?.vorname ?? 'Mitarbeiter'} am ${datum(d)}`,
      text: probleme.join(' · '),
      bezug: { typ: 'mitarbeiter', id: maId },
      gewicht: nurPause ? 35 : 50,
      fuerRollen: ['chef', 'buero'],
      aktionen: [{ aktion: 'zeiten.pruefen', label: 'Tag prüfen', primaer: true, payload: { mitarbeiterId: maId, datum: d } }],
      pfad: `/betrieb/arbeitszeiten/woche?ma=${maId}&datum=${d}`,
    });
  }

  // 4. Wochenfreigabe durch Chef/Büro: je abgeschlossener Woche ein Hinweis (ältere Wochen wiegen schwerer)
  const offen = db.zeiten.where((z) => !!z.ende && !z.freigegeben && z.datum < wochenStart(t));
  const wochen = new Map<Datum, Zeiteintrag[]>();
  for (const z of offen) {
    const mo = wochenStart(z.datum);
    wochen.set(mo, [...(wochen.get(mo) ?? []), z]);
  }
  for (const [montag, eintraege] of wochen) {
    const sonntag = plusTage(montag, 6);
    const namen = [...new Set(eintraege.map((z) => db.mitarbeiter.get(z.mitarbeiterId)?.vorname).filter(Boolean))];
    liste.push({
      schluessel: `zeiten-freigeben:${montag}`,
      art: 'freigabe',
      titel: `Zeiten KW ${kalenderwoche(montag)} freigeben (${eintraege.length === 1 ? '1 Zeit' : `${eintraege.length} Zeiten`})`,
      text: `Von ${namen.join(', ')}. Danach gehen sie in die Lohnabrechnung.`,
      gewicht: montag < plusTage(wochenStart(t), -7) ? 55 : 45,
      fuerRollen: ['chef', 'buero'],
      faellig: plusTage(sonntag, 1),
      aktionen: [{ aktion: 'zeiten.freigeben', label: 'Woche freigeben', primaer: true, payload: { von: montag, bis: sonntag } }],
      pfad: `/betrieb/arbeitszeiten/woche?datum=${montag}`,
    });
  }
  return liste;
}
