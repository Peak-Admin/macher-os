/**
 * Aktionen `einsatz.starten` / `einsatz.beenden` und die Prüfungen für „Braucht dich“.
 * Getrennt von index.tsx, damit sie ohne React testbar sind.
 */
import { db } from '@core/db';
import { emit } from '@core/events';
import { erledigt } from '@core/macher';
import type { HinweisVorschlag } from '@core/modul';
import { datum, datumVon, heute as heuteDatum, personName, plusTage, uhrzeit } from '@core/format';
import type { Datum, ID, Zeiteintrag } from '@core/objects';
import { ich } from '@core/session';
import { abwesenheitAm, istArbeitstag } from '@modules/abwesenheiten/daten';
import { istAktiv } from '@modules/mitarbeiter/team';
import { jetztUhr, laufende, minuten, pruefeMitarbeiterTag, starten, stoppen, wochenStart } from './daten';

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
    if (minuten(ende) <= minuten(z.start)) continue;
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

/** Freigabe aller abgeschlossenen Zeiten bis einschließlich `bis` */
export function zeitenFreigeben(bis: Datum): number {
  const liste = db.zeiten.where((z) => !!z.ende && !z.freigegeben && z.datum <= bis);
  liste.forEach((z) => db.zeiten.update(z.id, { freigegeben: true }, { text: 'Freigegeben' }));
  return liste.length;
}

// ------------------------------------------------------------------ Hinweise

export function zeitenHinweise(t = heuteDatum()): HinweisVorschlag[] {
  const liste: HinweisVorschlag[] = [];
  const betrieb = db.betrieb.get('betrieb');
  const feierabend = betrieb?.arbeitsende ?? '16:00';

  // 1. Zeit läuft noch seit gestern (oder länger)
  for (const z of db.zeiten.where((x) => !x.ende && x.datum < t)) {
    const m = db.mitarbeiter.get(z.mitarbeiterId);
    const ende = minuten(feierabend) > minuten(z.start) ? feierabend : undefined;
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
  if (istArbeitstag(gestern)) {
    const abw = db.abwesenheiten.all();
    const ohne = db.mitarbeiter
      .where((m) => istAktiv(m, gestern) && m.rolle !== 'chef' && (!m.eintritt || m.eintritt <= gestern))
      .filter((m) => db.zeiten.where((z) => z.mitarbeiterId === m.id).length > 0)
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

  // 3. ArbZG der letzten 14 Tage (nicht freigegebene Tage)
  const zeiten = db.zeiten.where((z) => z.datum >= plusTage(t, -15) && z.datum < t);
  const tage = new Set(zeiten.filter((z) => !z.freigegeben).map((z) => `${z.mitarbeiterId}|${z.datum}`));
  for (const k of tage) {
    const [maId, d] = k.split('|');
    const p = pruefeMitarbeiterTag(maId, d, zeiten);
    if (!p.probleme.length) continue;
    const m = db.mitarbeiter.get(maId);
    liste.push({
      schluessel: `arbzg:${maId}:${d}`,
      art: 'problem',
      titel: `Arbeitszeitgesetz: ${m?.vorname ?? 'Mitarbeiter'} am ${datum(d)}`,
      text: p.probleme.join(' · '),
      bezug: { typ: 'mitarbeiter', id: maId },
      gewicht: 50,
      fuerRollen: ['chef', 'buero'],
      pfad: `/betrieb/arbeitszeiten/woche?ma=${maId}&datum=${d}`,
    });
  }

  // 4. Freigabe durch das Büro (alles bis gestern; ältere Wochen wiegen schwerer)
  const offen = db.zeiten.where((z) => !!z.ende && !z.freigegeben && z.datum < t);
  if (offen.length) {
    const namen = [...new Set(offen.map((z) => db.mitarbeiter.get(z.mitarbeiterId)?.vorname).filter(Boolean))];
    const bis = gestern;
    const alt = offen.some((z) => z.datum < wochenStart(t));
    liste.push({
      schluessel: `zeiten-freigeben:${bis}`,
      art: 'freigabe',
      titel: `${offen.length === 1 ? '1 Zeit' : `${offen.length} Zeiten`} bis ${datum(bis)} freigeben`,
      text: `Von ${namen.join(', ')}. Danach gehen sie in die Lohnabrechnung.`,
      gewicht: alt ? 50 : 30,
      fuerRollen: ['chef', 'buero'],
      aktionen: [{ aktion: 'zeiten.freigeben', label: 'Alle freigeben', primaer: true, payload: { bis } }],
      pfad: `/betrieb/arbeitszeiten/woche?datum=${bis}`,
    });
  }
  return liste;
}
