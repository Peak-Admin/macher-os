/**
 * Automatische Planung: schlägt für einen Auftrag die besten Zeitfenster + Mitarbeiter vor.
 *
 * Score (0–100) aus fünf nachvollziehbaren Teilen – jeder Vorschlag bekommt Gründe in Klartext:
 *  - Verfügbarkeit: je früher frei, desto besser (bei „dringend“ stärker gewichtet)
 *  - Wunschtermin des Kunden (Freitext wird ausgelegt: „morgen“, „nächste Woche“, „nachmittags“, „Dienstag“, „14.10.“ …)
 *  - Fahrweg vom Vortermin bzw. vom Start
 *  - Auslastung der Woche (wer weniger verplant ist, bekommt eher den Auftrag)
 *  - Qualifikation (Pflicht: ohne gültige Nachweise kein Vorschlag)
 * Größere Aufträge werden auf mehrere Tage aufgeteilt, ab 16 h auf zwei Personen.
 */
import { db, batch, type Neu } from '@core/db';
import { datumKurz, isoDatum, personName, plusTage, zeitpunkt } from '@core/format';
import type { Auftrag, Datum, ID, Termin } from '@core/objects';
import {
  abwesenheitAm,
  aktiverTermin,
  arbeitstage,
  arbeitszeit,
  finde,
  freieFenster,
  hhmm,
  istVerfuegbar,
  minutenVon,
  planbareMitarbeiter,
  termineAm,
  verplanteStunden,
  type Fenster,
  type Kontext,
} from './basis';
import { benoetigteQualifikationen, erfuelltAlle } from '../qualifikation-planung/daten';
import { startPunkt, strecke, terminPunkt, type Punkt, type Strecke } from '../fahrt/daten';

// ------------------------------------------------------------------ Was ist einzuplanen?

const STUNDEN_TERMINARTEN: Termin['art'][] = ['einsatz', 'wartung', 'abnahme'];

/** bereits eingeplante Personenstunden eines Auftrags (vergangene + künftige Einsätze) */
export function eingeplanteStunden(ctx: Kontext, auftragId: ID): number {
  return ctx.termine
    .filter((t) => aktiverTermin(t) && t.auftragId === auftragId && STUNDEN_TERMINARTEN.includes(t.art))
    .reduce((s, t) => s + ((new Date(t.ende).getTime() - new Date(t.start).getTime()) / 3_600_000) * Math.max(1, t.mitarbeiterIds.length), 0);
}

/** Standard, wenn keine Stunden geschätzt sind */
export const STANDARD_STUNDEN = 2;

/** noch einzuplanende Personenstunden (auf halbe Stunden gerundet) */
export function offeneStunden(ctx: Kontext, a: Auftrag): number {
  const geplant = eingeplanteStunden(ctx, a.id);
  const soll = a.geplanteStunden ?? (geplant > 0 ? 0 : STANDARD_STUNDEN);
  return Math.max(0, Math.round((soll - geplant) * 2) / 2);
}

/** Muss dieser Auftrag (noch) eingeplant werden? */
export function einzuplanen(ctx: Kontext, a: Auftrag): boolean {
  if (a.geloeschtAm) return false;
  const phaseOk =
    a.phase === 'beauftragt' ||
    a.phase === 'in_arbeit' ||
    (a.phase === 'anfrage' && !!a.dringend && ['kundendienst', 'reklamation', 'wartung'].includes(a.art));
  return phaseOk && offeneStunden(ctx, a) > 0;
}

export function einzuplanendeAuftraege(ctx: Kontext): Auftrag[] {
  return ctx.auftraege.filter((a) => einzuplanen(ctx, a)).sort(prioritaet);
}

/** dringend zuerst, dann laufende Baustellen, dann ältere zuerst */
function prioritaet(a: Auftrag, b: Auftrag) {
  if (!!a.dringend !== !!b.dringend) return a.dringend ? -1 : 1;
  const pa = a.phase === 'in_arbeit' ? 0 : 1;
  const pb = b.phase === 'in_arbeit' ? 0 : 1;
  if (pa !== pb) return pa - pb;
  return a.erstelltAm.localeCompare(b.erstelltAm);
}

// ------------------------------------------------------------------ Wunschtermin auslegen

export interface Wunsch {
  von?: Datum;
  bis?: Datum;
  /** 0 = So … 6 = Sa */
  wochentage?: number[];
  abMinuten?: number;
  bisMinuten?: number;
  /** wurde überhaupt etwas erkannt? */
  erkannt: boolean;
  text?: string;
}

const WOCHENTAGE: [RegExp, number][] = [
  [/\bmo(ntag|ntags)?\b/, 1],
  [/\bdi(enstag|enstags)?\b/, 2],
  [/\bmi(ttwoch|ttwochs)?\b/, 3],
  [/\bdo(nnerstag|nnerstags)?\b/, 4],
  [/\bfr(eitag|eitags)?\b/, 5],
];

/** Freitext des Kunden („diese Woche nachmittags“, „Dienstag“, „ab 14 Uhr“, „14.10.“) auslegen */
export function wunschAuslegen(text: string | undefined, heute: Datum): Wunsch {
  if (!text?.trim()) return { erkannt: false };
  const t = text.toLowerCase();
  const w: Wunsch = { erkannt: false, text };
  const wochentag = new Date(heute + 'T12:00:00').getDay();
  const bisFreitag = (d: Datum) => plusTage(d, Math.max(0, 5 - new Date(d + 'T12:00:00').getDay()));
  if (/übermorgen|uebermorgen/.test(t)) Object.assign(w, { von: plusTage(heute, 2), bis: plusTage(heute, 2), erkannt: true });
  else if (/\bmorgen\b/.test(t)) Object.assign(w, { von: plusTage(heute, 1), bis: plusTage(heute, 1), erkannt: true });
  else if (/\bheute\b|sofort|asap/.test(t)) Object.assign(w, { von: heute, bis: heute, erkannt: true });
  if (/(diese|dieser) woche/.test(t)) Object.assign(w, { von: heute, bis: bisFreitag(heute), erkannt: true });
  if (/(nächste|naechste|kommende) woche/.test(t)) {
    const montag = plusTage(heute, ((8 - wochentag) % 7) || 7);
    Object.assign(w, { von: montag, bis: plusTage(montag, 4), erkannt: true });
  }
  const tage = WOCHENTAGE.filter(([re]) => re.test(t)).map(([, n]) => n);
  if (tage.length) Object.assign(w, { wochentage: tage, erkannt: true });
  const dm = t.match(/(ab\s+)?(\d{1,2})\.(\d{1,2})\./);
  if (dm) {
    const jahr = Number(heute.slice(0, 4));
    let d = isoDatum(new Date(jahr, Number(dm[3]) - 1, Number(dm[2]), 12));
    if (d < heute) d = isoDatum(new Date(jahr + 1, Number(dm[3]) - 1, Number(dm[2]), 12));
    Object.assign(w, dm[1] ? { von: d, bis: undefined } : { von: d, bis: d }, { erkannt: true });
  }
  if (/vormittag|morgens|früh\b/.test(t)) Object.assign(w, { bisMinuten: 12 * 60, erkannt: true });
  if (/nachmittag/.test(t)) Object.assign(w, { abMinuten: 12 * 60, erkannt: true });
  const ab = t.match(/ab\s+(\d{1,2})(?::(\d{2}))?\s*uhr/);
  if (ab) Object.assign(w, { abMinuten: Number(ab[1]) * 60 + Number(ab[2] ?? 0), erkannt: true });
  const bis = t.match(/bis\s+(\d{1,2})(?::(\d{2}))?\s*uhr/);
  if (bis) Object.assign(w, { bisMinuten: Number(bis[1]) * 60 + Number(bis[2] ?? 0), erkannt: true });
  return w;
}

function tagPasst(w: Wunsch, d: Datum): boolean {
  if (w.von && d < w.von) return false;
  if (w.bis && d > w.bis) return false;
  if (w.wochentage && !w.wochentage.includes(new Date(d + 'T12:00:00').getDay())) return false;
  return true;
}

function zeitPasst(w: Wunsch, b: Block): boolean {
  return (w.abMinuten == null || b.von >= w.abMinuten) && (w.bisMinuten == null || b.bis <= w.bisMinuten);
}

// ------------------------------------------------------------------ Vorschläge

export interface Block {
  datum: Datum;
  /** Minuten seit Mitternacht */
  von: number;
  bis: number;
}

export interface Vorschlag {
  auftragId: ID;
  /** erste Person = verantwortlich vor Ort */
  mitarbeiterIds: ID[];
  bloecke: Block[];
  /** abgedeckte Personenstunden */
  stunden: number;
  /** 0–100 */
  score: number;
  /** Warum dieser Vorschlag? (Klartext) */
  gruende: string[];
  /** Was ist nicht ideal? */
  warnungen: string[];
}

export interface VorschlagErgebnis {
  auftrag?: Auftrag;
  vorschlaege: Vorschlag[];
  /** Warum es keine oder wenige Vorschläge gibt / Annahmen */
  hinweise: string[];
  offeneStunden: number;
}

export interface PlanOptionen {
  /** erster möglicher Tag (Standard: heute bei dringend, sonst morgen) */
  ab?: Datum;
  /** Arbeitstage, die durchsucht werden */
  horizont?: number;
  anzahl?: number;
  /** aktuelle Uhrzeit in Minuten – heute wird erst ab jetzt + 30 min geplant */
  jetzt?: number;
  /** Mindestpuffer zur Fahrzeit */
  puffer?: number;
}

const MIN_BLOCK = 120;

/** Freie Fenster abzüglich Anfahrt vom vorherigen und zum nächsten Termin */
function nutzbareFenster(ctx: Kontext, maId: ID, d: Datum, ziel: Punkt | undefined, puffer: number, jetzt?: number): { f: Fenster; anfahrt: Strecke; vonWo: string }[] {
  const termine = termineAm(ctx, maId, d);
  const start = startPunkt(ctx, maId);
  return freieFenster(ctx, maId, d)
    .map((f) => {
      const vorher = [...termine].reverse().find((t) => minutenVon(t.ende) <= f.von);
      const nachher = termine.find((t) => minutenVon(t.start) >= f.bis);
      const vonPunkt = vorher ? terminPunkt(ctx, vorher) : start;
      const anfahrt = strecke(vonPunkt, ziel);
      const weg = nachher ? strecke(ziel, terminPunkt(ctx, nachher)) : undefined;
      let von = f.von + (vorher ? anfahrt.minuten + puffer : 0);
      if (jetzt != null) von = Math.max(von, jetzt + 30);
      // auf Viertelstunden runden – krumme Uhrzeiten versteht keiner
      von = Math.ceil(von / 15) * 15;
      const bis = f.bis - (weg ? weg.minuten + puffer : 0);
      return { f: { von, bis }, anfahrt, vonWo: vorher ? `Vortermin „${vorher.titel}“` : start ? 'Start' : '' };
    })
    .filter((x) => x.f.bis - x.f.von >= 30);
}

interface Kandidat {
  maId: ID;
  bloecke: Block[];
  anfahrt: Strecke;
  vonWo: string;
  startIndex: number;
  luecken: number;
}

/** Plant `minuten` für einen Mitarbeiter ab Tag `tage[i]` */
function planeAb(ctx: Kontext, maId: ID, tage: Datum[], i: number, minuten: number, ziel: Punkt | undefined, w: Wunsch, o: Required<Pick<PlanOptionen, 'puffer'>> & PlanOptionen): Kandidat | undefined {
  const az = arbeitszeit(ctx);
  const kapazitaet = az.ende - az.beginn;
  const eintaegig = minuten <= kapazitaet;
  let rest = minuten;
  const bloecke: Block[] = [];
  let anfahrt: Strecke = { km: 0, minuten: 0, genauigkeit: 'unbekannt' };
  let vonWo = '';
  let luecken = 0;
  for (let k = i; k < tage.length && rest > 0; k++) {
    const d = tage[k];
    const fenster = nutzbareFenster(ctx, maId, d, ziel, o.puffer, d === ctx.heute ? o.jetzt : undefined);
    if (eintaegig) {
      // ein Fenster, das komplett passt – Wunsch-Uhrzeit bevorzugt
      const passend = fenster.filter((x) => x.f.bis - x.f.von >= minuten);
      if (!passend.length) return undefined;
      const mitWunsch = passend
        .map((x) => {
          const von = Math.max(x.f.von, w.abMinuten ?? 0);
          return { ...x, von };
        })
        .find((x) => x.von + minuten <= x.f.bis && zeitPasst(w, { datum: d, von: x.von, bis: x.von + minuten }));
      const wahl = mitWunsch ?? { ...passend[0], von: passend[0].f.von };
      bloecke.push({ datum: d, von: wahl.von, bis: wahl.von + minuten });
      return { maId, bloecke, anfahrt: wahl.anfahrt, vonWo: wahl.vonWo, startIndex: i, luecken: 0 };
    }
    const gross = [...fenster].sort((a, b) => b.f.bis - b.f.von - (a.f.bis - a.f.von))[0];
    const laenge = gross ? gross.f.bis - gross.f.von : 0;
    if (!gross || (laenge < MIN_BLOCK && laenge < rest)) {
      if (!bloecke.length) return undefined; // Start muss am Starttag sein
      luecken++;
      continue;
    }
    const dauer = Math.min(laenge, rest);
    if (!bloecke.length) {
      anfahrt = gross.anfahrt;
      vonWo = gross.vonWo;
    }
    bloecke.push({ datum: d, von: gross.f.von, bis: gross.f.von + dauer });
    rest -= dauer;
  }
  if (rest > 0) return undefined;
  return { maId, bloecke, anfahrt, vonWo, startIndex: i, luecken };
}

const blockMinuten = (b: Block[]) => b.reduce((s, x) => s + x.bis - x.von, 0);

function zeitraumText(b: Block[]): string {
  if (b.length === 1) return `${datumKurz(b[0].datum)}, ${hhmm(b[0].von)}–${hhmm(b[0].bis)} Uhr`;
  return `${b.length} Tage: ${datumKurz(b[0].datum)} bis ${datumKurz(b[b.length - 1].datum)}`;
}

/** Vorschläge für einen Auftrag */
export function vorschlaege(ctx: Kontext, auftragId: ID, opt: PlanOptionen = {}): VorschlagErgebnis {
  const auftrag = finde(ctx.auftraege, auftragId);
  if (!auftrag) return { vorschlaege: [], hinweise: ['Diesen Auftrag gibt es nicht (mehr).'], offeneStunden: 0 };
  const hinweise: string[] = [];
  const stunden = offeneStunden(ctx, auftrag);
  if (stunden <= 0) return { auftrag, vorschlaege: [], hinweise: ['Für diesen Auftrag sind alle geschätzten Stunden schon eingeplant.'], offeneStunden: 0 };
  if (auftrag.geplanteStunden == null) hinweise.push(`Keine Stunden geschätzt – ich plane mit ${STANDARD_STUNDEN} h. Trag die Stunden am Auftrag ein, dann wird es genauer.`);

  const o = { puffer: 10, horizont: 10, anzahl: 3, ...opt };
  const ab = o.ab ?? (auftrag.dringend ? ctx.heute : plusTage(ctx.heute, 1));
  const tage = arbeitstage(ab, o.horizont);
  const ziel = terminPunkt(ctx, { auftragId: auftrag.id, ortId: auftrag.ortId, kundeId: auftrag.kundeId });
  if (!ziel) hinweise.push('Einsatzort ohne Adresse – Fahrwege bleiben unberücksichtigt.');
  const quali = benoetigteQualifikationen(ctx, auftrag);
  const w = wunschAuslegen(auftrag.wunschtermin, ctx.heute);
  if (auftrag.wunschtermin && !w.erkannt) hinweise.push(`Den Wunschtermin „${auftrag.wunschtermin}“ konnte ich nicht auslegen.`);

  const alle = planbareMitarbeiter(ctx);
  const leitung = alle.filter((m) => m.rolle !== 'azubi' && erfuelltAlle(ctx, m.id, quali, tage[0] ?? ab));
  if (!leitung.length) {
    hinweise.push(
      quali.length
        ? `Niemand hat gültige Nachweise für ${quali.map((q) => finde(ctx.qualifikationen, q)?.name).join(', ')}.`
        : 'Es gibt niemanden, der eingeplant werden kann. Leg zuerst Mitarbeiter an.',
    );
    return { auftrag, vorschlaege: [], hinweise, offeneStunden: stunden };
  }

  const jetzt = o.jetzt ?? (tage[0] === ctx.heute ? new Date().getHours() * 60 + new Date().getMinutes() : undefined);
  const planOpt = { ...o, jetzt };

  const versuche = (personen: number) => {
    const minuten = Math.round((stunden * 60) / personen);
    const kandidaten: { k: Kandidat; partner?: ID }[] = [];
    for (const m of leitung) {
      for (let i = 0; i < tage.length; i++) {
        const k = planeAb(ctx, m.id, tage, i, minuten, ziel, w, planOpt);
        if (!k) continue;
        // jeder Tag muss mit Qualifikation abgedeckt sein (Nachweis kann ablaufen)
        if (!k.bloecke.every((b) => erfuelltAlle(ctx, m.id, quali, b.datum))) continue;
        if (personen === 1) kandidaten.push({ k });
        else {
          const partner = waehlePartner(ctx, m.id, k.bloecke, alle.map((x) => x.id));
          if (partner) kandidaten.push({ k, partner });
        }
      }
    }
    return kandidaten;
  };

  let personen = stunden > 16 ? 2 : 1;
  let kandidaten = versuche(personen);
  if (!kandidaten.length && personen === 2) {
    personen = 1;
    kandidaten = versuche(1);
    if (kandidaten.length) hinweise.push('Für zwei Leute gleichzeitig ist nichts frei – ich plane eine Person über mehr Tage.');
  }
  if (!kandidaten.length) {
    hinweise.push(`In den nächsten ${o.horizont} Arbeitstagen ist kein passendes Zeitfenster frei. Schau in die Auslastung oder plane weiter voraus.`);
    return { auftrag, vorschlaege: [], hinweise, offeneStunden: stunden };
  }

  const bewertet = kandidaten.map(({ k, partner }) => bewerte(ctx, auftrag, k, partner, tage, w, quali, personen));
  // Vielfalt: zuerst der beste Vorschlag je Person, dann die nächstbesten
  bewertet.sort((a, b) => b.score - a.score);
  const gewaehlt: Vorschlag[] = [];
  const personenGesehen = new Set<ID>();
  for (const v of bewertet) {
    if (gewaehlt.length >= o.anzahl) break;
    if (personenGesehen.has(v.mitarbeiterIds[0])) continue;
    personenGesehen.add(v.mitarbeiterIds[0]);
    gewaehlt.push(v);
  }
  for (const v of bewertet) {
    if (gewaehlt.length >= o.anzahl) break;
    if (!gewaehlt.includes(v) && !gewaehlt.some((g) => g.mitarbeiterIds[0] === v.mitarbeiterIds[0] && g.bloecke[0].datum === v.bloecke[0].datum)) gewaehlt.push(v);
  }
  gewaehlt.sort((a, b) => b.score - a.score);
  return { auftrag, vorschlaege: gewaehlt, hinweise, offeneStunden: stunden };
}

/** Zweite Person, die an allen Blöcken frei ist – wenig verplant bevorzugt */
function waehlePartner(ctx: Kontext, leitungId: ID, bloecke: Block[], kandidaten: ID[]): ID | undefined {
  const frei = kandidaten.filter(
    (id) =>
      id !== leitungId &&
      bloecke.every((b) => !abwesenheitAm(ctx, id, b.datum) && istVerfuegbar(ctx, id, zeitpunkt(b.datum, hhmm(b.von)), zeitpunkt(b.datum, hhmm(b.bis)))),
  );
  const tage = bloecke.map((b) => b.datum);
  return frei.sort((a, b) => verplanteStunden(ctx, a, tage) - verplanteStunden(ctx, b, tage))[0];
}

function bewerte(ctx: Kontext, auftrag: Auftrag, k: Kandidat, partner: ID | undefined, tage: Datum[], w: Wunsch, quali: ID[], personen: number): Vorschlag {
  const gruende: string[] = [];
  const warnungen: string[] = [];
  const ma = finde(ctx.mitarbeiter, k.maId);
  const az = arbeitszeit(ctx);
  const dringend = !!auftrag.dringend;

  // 1. Verfügbarkeit: früher ist besser
  const gewFrueh = dringend ? 35 : 25;
  const frueh = gewFrueh * (1 - k.startIndex / Math.max(1, tage.length));
  gruende.push(`${personName(ma)}${partner ? ` mit ${personName(finde(ctx.mitarbeiter, partner))}` : ''} frei: ${zeitraumText(k.bloecke)}`);
  if (dringend && k.startIndex === 0) gruende.push('Dringend – frühester freier Termin');
  if (k.luecken) warnungen.push(`Mit ${k.luecken} ${k.luecken === 1 ? 'Tag' : 'Tagen'} Unterbrechung`);

  // 2. Wunschtermin
  const gewWunsch = dringend ? 20 : 30;
  let wunsch = gewWunsch / 2;
  if (w.erkannt) {
    const tagOk = tagPasst(w, k.bloecke[0].datum);
    const zeitOk = zeitPasst(w, k.bloecke[0]);
    wunsch = (tagOk ? gewWunsch * 0.65 : 0) + (zeitOk ? gewWunsch * 0.35 : 0);
    if (tagOk && zeitOk) gruende.push(`Passt zum Kundenwunsch „${w.text}“`);
    else warnungen.push(`Kundenwunsch „${w.text}“ ${tagOk ? 'nur beim Tag' : zeitOk ? 'nur bei der Uhrzeit' : 'nicht'} erfüllt`);
  }

  // 3. Fahrweg vom Vortermin / Start
  let weg = 10;
  if (k.anfahrt.genauigkeit !== 'unbekannt') {
    weg = 20 * (1 - Math.min(k.anfahrt.km, 50) / 50);
    const km = Math.round(k.anfahrt.km);
    const ca = k.anfahrt.genauigkeit === 'plz' ? 'ca. ' : '';
    if (k.anfahrt.km === 0) gruende.push(`Gleicher Ort wie ${k.vonWo || 'vorher'} – keine Anfahrt`);
    else gruende.push(`${ca}${km} km Anfahrt vom ${k.vonWo || 'Start'}${k.anfahrt.genauigkeit === 'plz' ? ' (grob geschätzt)' : ''}`);
    if (k.anfahrt.km > 40) warnungen.push(`Lange Anfahrt (${ca}${km} km)`);
  }

  // 4. Auslastung der Woche ab Start
  const woche = tage.slice(k.startIndex, k.startIndex + 5);
  const kap = (woche.length * (az.ende - az.beginn)) / 60;
  const verplant = verplanteStunden(ctx, k.maId, woche);
  const quote = kap ? Math.min(1, verplant / kap) : 0;
  const auslastung = 15 * (1 - quote);
  gruende.push(`Woche zu ${Math.round(quote * 100)} % verplant`);
  if (quote > 0.85) warnungen.push('Woche ist schon fast voll');

  // 5. Qualifikation (Pflicht – sonst gäbe es keinen Vorschlag)
  // Chef nur, wenn es keinen passenderen Monteur gibt
  const qualiPunkte = ma?.rolle === 'chef' ? 4 : 10;
  if (quali.length) gruende.push(`Hat ${quali.map((q) => finde(ctx.qualifikationen, q)?.name).join(', ')}`);

  const score = Math.max(0, Math.min(100, Math.round(frueh + wunsch + weg + auslastung + qualiPunkte - k.luecken * 3)));
  return {
    auftragId: auftrag.id,
    mitarbeiterIds: partner ? [k.maId, partner] : [k.maId],
    bloecke: k.bloecke,
    stunden: (blockMinuten(k.bloecke) * personen) / 60,
    score,
    gruende,
    warnungen,
  };
}

// ------------------------------------------------------------------ Alles auf einmal vorplanen

export interface VorplanZeile {
  auftrag: Auftrag;
  vorschlag?: Vorschlag;
  hinweise: string[];
}

/** Plant alle offenen Aufträge nacheinander (wichtigste zuerst); jeder Vorschlag blockt die Zeit für die nächsten. */
export function allesVorplanen(ctx: Kontext, opt: PlanOptionen = {}): VorplanZeile[] {
  const arbeit: Kontext = { ...ctx, termine: [...ctx.termine] };
  return einzuplanendeAuftraege(ctx).map((a) => {
    const e = vorschlaege(arbeit, a.id, { ...opt, anzahl: 1 });
    const v = e.vorschlaege[0];
    if (v) arbeit.termine.push(...vorschlagAlsTermine(a, v).map((t, i) => ({ ...t, id: `vorschau_${a.id}_${i}`, erstelltAm: '', geaendertAm: '' }) as Termin));
    return { auftrag: a, vorschlag: v, hinweise: e.hinweise };
  });
}

// ------------------------------------------------------------------ Übernehmen

/** Vorschlag → neue Termine (rein, ohne Speichern) */
export function vorschlagAlsTermine(a: Auftrag, v: Vorschlag): Neu<Termin>[] {
  return v.bloecke.map((b, i) => ({
    art: a.art === 'wartung' ? 'wartung' : 'einsatz',
    titel: v.bloecke.length > 1 ? `${a.titel} (Tag ${i + 1}/${v.bloecke.length})` : a.titel,
    start: zeitpunkt(b.datum, hhmm(b.von)),
    ende: zeitpunkt(b.datum, hhmm(b.bis)),
    auftragId: a.id,
    kundeId: a.kundeId,
    ortId: a.ortId,
    mitarbeiterIds: [...v.mitarbeiterIds],
    status: 'geplant',
    notiz: `Automatisch geplant: ${v.gruende.join(' · ')}`,
  }));
}

/** Legt die Termine eines Vorschlags an. Prüft vorher, ob die Zeit noch frei ist. */
export function vorschlagUebernehmen(v: Vorschlag): { ok: true; termine: Termin[] } | { ok: false; grund: string } {
  const a = db.auftraege.get(v.auftragId);
  if (!a || a.geloeschtAm) return { ok: false, grund: 'Den Auftrag gibt es nicht mehr.' };
  const neu = vorschlagAlsTermine(a, v);
  const belegt = neu.some((t) =>
    t.mitarbeiterIds.some((m) => db.termine.all().some((x) => aktiverTermin(x) && x.mitarbeiterIds.includes(m) && x.start < t.ende && t.start < x.ende)),
  );
  if (belegt) return { ok: false, grund: 'Inzwischen ist dort schon etwas anderes geplant. Lass den Vorschlag neu berechnen.' };
  const termine: Termin[] = [];
  batch(() => {
    for (const t of neu) termine.push(db.termine.create(t));
  });
  return { ok: true, termine };
}

export const vorschlagKurz = (ctx: Kontext, v: Vorschlag) =>
  `${v.mitarbeiterIds.map((m) => personName(finde(ctx.mitarbeiter, m))).join(' + ')}, ${zeitraumText(v.bloecke)}`;
