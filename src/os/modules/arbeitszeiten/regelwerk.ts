/**
 * Arbeitszeit-Regelwerk: Wochenstand für den Monteur, Wochenfreigabe (Event `zeit.freigegeben`),
 * Monatsauswertung und CSV für die Lohnabrechnung, Hinweise zum Stundenkonto.
 *
 * Die Regeln (Pausen nach ArbZG, Soll aus dem Arbeitszeitmodell, Feiertage, Abwesenheiten) stehen in
 * `daten.ts` und `modell.ts`. Ohne React, damit alles testbar ist.
 */
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { emit } from '@core/events';
import type { HinweisVorschlag } from '@core/modul';
import { heute as heuteDatum, plusTage, wochenStart } from '@core/format';
import { betriebsArbeitstage, betriebsBundesland, istFeiertag } from '@core/kalender';
import type { Abwesenheit, AbwesenheitsArt, Datum, ID, Mitarbeiter, Zeiteintrag } from '@core/objects';
import { abwesenheitAm } from '@modules/abwesenheiten/daten';
import { istAktiv } from '@modules/mitarbeiter/team';
import { autoPauseAn, gutschriftTag, jetztUhr, nachTag, saldoText, sollPlanTag, stundenkonto, tagAuswerten, type Zeitart } from './daten';
import { arbeitsmodelle, modellSollAm, stundenbuchungen, type Arbeitsmodell, type Stundenbuchung } from './modell';

// ------------------------------------------------------------------ Einstellungen (Progressive Disclosure)

export interface Regeln {
  /** fehlende Pausen nach §4 ArbZG automatisch abziehen */
  autoPause: boolean;
  /** ab so vielen Plusstunden auf dem Konto meldet Lotte sich (Minuten) */
  grenzePlus: number;
  /** ab so vielen Minusstunden (Minuten, positiv) */
  grenzeMinus: number;
}

export const STANDARD_REGELN: Regeln = { autoPause: true, grenzePlus: 20 * 60, grenzeMinus: 20 * 60 };

export function regeln(): Regeln {
  return {
    autoPause: autoPauseAn(),
    grenzePlus: Number(einstellung('arbeitszeiten.grenzePlus', STANDARD_REGELN.grenzePlus)) || STANDARD_REGELN.grenzePlus,
    grenzeMinus: Number(einstellung('arbeitszeiten.grenzeMinus', STANDARD_REGELN.grenzeMinus)) || STANDARD_REGELN.grenzeMinus,
  };
}

/** „38 Std“, „37,5 Std“ – für den Wochenstand des Monteurs */
export function std(min: number): string {
  const v = Math.round((min / 60) * 10) / 10;
  return `${String(v).replace('.', ',')} Std`;
}

// ------------------------------------------------------------------ Wochenstand (Monteur)

export interface WochenStand {
  /** gearbeitet plus gutgeschriebene Abwesenheit (läuft eine Zeit, zählt sie bis jetzt) */
  erreicht: number;
  gearbeitet: number;
  gutschrift: number;
  /** Soll der ganzen Woche laut Modell (Feiertage abgezogen) */
  soll: number;
  /** „Diese Woche: 38 von 40 Std“ */
  text: string;
}

export function wochenStand(m: Mitarbeiter, montag: Datum = wochenStart(heuteDatum()), ctx: { zeiten?: Zeiteintrag[]; abw?: Abwesenheit[]; modelle?: Arbeitsmodell[]; jetzt?: { datum: Datum; uhr: string } } = {}): WochenStand {
  const zeiten = ctx.zeiten ?? db.zeiten.where((z) => z.mitarbeiterId === m.id && z.datum >= montag && z.datum <= plusTage(montag, 6));
  const abw = ctx.abw ?? db.abwesenheiten.all();
  const modelle = ctx.modelle ?? arbeitsmodelle.all();
  const jetzt = ctx.jetzt ?? { datum: heuteDatum(), uhr: jetztUhr() };
  const tage = nachTag(zeiten, m.id);
  const arbeitstage = betriebsArbeitstage();
  let soll = 0;
  let gutschrift = 0;
  let gearbeitet = 0;
  for (let i = 0; i < 7; i++) {
    const d = plusTage(montag, i);
    const plan = sollPlanTag(m, d, arbeitstage, modelle);
    soll += plan;
    gutschrift += gutschriftTag(m.id, d, abw, plan);
    const liste = tage.get(d);
    if (liste) gearbeitet += tagAuswerten(liste, { jetzt }).netto;
  }
  const erreicht = gearbeitet + gutschrift;
  return { erreicht, gearbeitet, gutschrift, soll, text: `Diese Woche: ${std(erreicht).replace(' Std', '')} von ${std(soll)}` };
}

// ------------------------------------------------------------------ Freigabe

/**
 * Zeiten freigeben (Chef/Büro). Danach gehen sie in die Lohnabrechnung, Monteure können sie nicht mehr ändern.
 * Meldet `zeit.freigegeben` mit den betroffenen Zeiten, Mitarbeitern und dem Zeitraum.
 */
export function freigeben(liste: Zeiteintrag[]): number {
  const offen = liste.filter((z) => !!z.ende && !z.freigegeben && !z.geloeschtAm);
  if (!offen.length) return 0;
  offen.forEach((z) => db.zeiten.update(z.id, { freigegeben: true }, { text: 'Freigegeben' }));
  const daten = offen.map((z) => z.datum).sort();
  emit({
    typ: 'zeit.freigegeben',
    daten: {
      zeitIds: offen.map((z) => z.id),
      mitarbeiterIds: [...new Set(offen.map((z) => z.mitarbeiterId))],
      von: daten[0],
      bis: daten[daten.length - 1],
    },
  });
  return offen.length;
}

/** Freigabe zurücknehmen (Rückgängig) */
export function freigabeZuruecknehmen(ids: ID[]) {
  ids.forEach((id) => db.zeiten.update(id, { freigegeben: false }, { text: 'Freigabe zurückgenommen' }));
}

// ------------------------------------------------------------------ Monatsauswertung

export interface MonatsWerte {
  mitarbeiterId: ID;
  monat: string;
  /** erster gezählter Tag (Monatsanfang, Eintritt oder Beginn des Stundenkontos) */
  von: Datum;
  /** Stand bis (Monatsende oder gestern) */
  bis: Datum;
  /** Vertrags-Soll laut Modell, Feiertage abgezogen */
  soll: number;
  gearbeitet: number;
  jeArt: Record<Zeitart, number>;
  pauseAuto: number;
  /** Urlaub, Krankheit … als erfüllt gutgeschrieben */
  gutschrift: number;
  /** Übertrag, Auszahlung, Korrektur im Monat */
  gebucht: number;
  /** gearbeitet + gutschrift + gebucht − soll */
  saldo: number;
  ueberstunden: number;
  minusstunden: number;
  /** Stundenkonto am Ende des Zeitraums */
  kontoEnde?: number;
  abwesenheit: Record<AbwesenheitsArt, number>;
  feiertage: number;
  /** abgeschlossene, nicht freigegebene Zeiten */
  offen: number;
  /** laufende Zeiten im Monat */
  laufend: number;
  /** Arbeitstage mit Soll ohne Zeit und ohne Abwesenheit */
  tageOhneZeit: Datum[];
}

export function monatsGrenzen(monat: string, stichtag: Datum = plusTage(heuteDatum(), -1)): { von: Datum; bis: Datum } {
  const von = `${monat}-01`;
  const [j, mo] = monat.split('-').map(Number);
  const ende = `${monat}-${String(new Date(j, mo, 0).getDate()).padStart(2, '0')}`;
  return { von, bis: ende < stichtag ? ende : stichtag };
}

export function monatsAuswertung(
  m: Mitarbeiter,
  monat: string,
  ctx: { zeiten?: Zeiteintrag[]; abw?: Abwesenheit[]; modelle?: Arbeitsmodell[]; buchungen?: Stundenbuchung[]; stichtag?: Datum; autoPause?: boolean } = {},
): MonatsWerte {
  const zeiten = ctx.zeiten ?? db.zeiten.all();
  const abw = ctx.abw ?? db.abwesenheiten.all();
  const modelle = ctx.modelle ?? arbeitsmodelle.all();
  const buchungen = (ctx.buchungen ?? stundenbuchungen.all()).filter((b) => b.mitarbeiterId === m.id && !b.geloeschtAm);
  const grenzen = monatsGrenzen(monat, ctx.stichtag);
  const konto = stundenkonto(m, zeiten, abw, grenzen.bis, undefined, { modelle, buchungen, autoPause: ctx.autoPause });
  const bis = grenzen.bis;
  // Ohne Stundenkonto (noch keine Zeit, kein Übertrag) zählt kein Soll – wie im Stundenkonto
  const von = !konto ? plusTage(bis, 1) : konto.von > grenzen.von ? konto.von : grenzen.von;
  const tage = nachTag(zeiten, m.id);
  const arbeitstage = betriebsArbeitstage();
  const bundesland = betriebsBundesland() ?? null;
  const jeArt: Record<Zeitart, number> = { baustelle: 0, fahrt: 0, intern: 0 };
  const abwesenheit: Record<AbwesenheitsArt, number> = { urlaub: 0, krank: 0, schule: 0, schulung: 0, frei: 0, sonstiges: 0 };
  let soll = 0;
  let gearbeitet = 0;
  let pauseAuto = 0;
  let gutschrift = 0;
  let feiertage = 0;
  const tageOhneZeit: Datum[] = [];
  // Abwesenheiten und Feiertage zählen für den ganzen Monat (Lohn), Soll/Ist ab Beginn des Stundenkontos
  for (let d = grenzen.von; d <= bis; d = plusTage(d, 1)) {
    const plan = sollPlanTag(m, d, arbeitstage, modelle);
    const beschaeftigt = (!m.eintritt || d >= m.eintritt) && (!m.austritt || d <= m.austritt);
    if (!plan && beschaeftigt && istFeiertag(d, bundesland) && modellSollAm(m, d, modelle, arbeitstage) > 0) feiertage++;
    const a = plan ? abwesenheitAm(m.id, d, abw) : undefined;
    if (a) abwesenheit[a.art] += a.halbtags ? 0.5 : 1;
    if (d < von) continue;
    soll += plan;
    gutschrift += gutschriftTag(m.id, d, abw, plan);
    const liste = tage.get(d);
    if (liste) {
      const w = tagAuswerten(liste, { autoPause: ctx.autoPause });
      gearbeitet += w.netto;
      pauseAuto += w.pauseAuto;
      (Object.keys(jeArt) as Zeitart[]).forEach((k) => (jeArt[k] += w.jeArt[k]));
    } else if (plan && !a) tageOhneZeit.push(d);
  }
  const gebucht = buchungen.filter((b) => b.datum >= von && b.datum <= bis).reduce((s, b) => s + b.minuten, 0);
  const saldo = gearbeitet + gutschrift + gebucht - soll;
  const imMonat = zeiten.filter((z) => z.mitarbeiterId === m.id && !z.geloeschtAm && z.datum.startsWith(monat));
  return {
    mitarbeiterId: m.id,
    monat,
    von,
    bis,
    soll,
    gearbeitet,
    jeArt,
    pauseAuto,
    gutschrift,
    gebucht,
    saldo,
    ueberstunden: Math.max(0, saldo),
    minusstunden: Math.max(0, -saldo),
    kontoEnde: konto?.saldo,
    abwesenheit,
    feiertage,
    offen: imMonat.filter((z) => z.ende && !z.freigegeben).length,
    laufend: imMonat.filter((z) => !z.ende).length,
    tageOhneZeit,
  };
}

// ------------------------------------------------------------------ CSV für die Lohnabrechnung

const h2 = (min: number | undefined) => (min == null ? '' : (Math.round((min / 60) * 100) / 100).toFixed(2).replace('.', ','));
const tageZahl = (n: number) => String(n).replace('.', ',');

export const LOHN_KOPF = [
  'Monat',
  'Nachname',
  'Vorname',
  'Soll (h)',
  'Gearbeitet (h)',
  'Baustelle (h)',
  'Fahrt (h)',
  'Intern (h)',
  'Pause automatisch abgezogen (h)',
  'Abwesenheit gutgeschrieben (h)',
  'Gebucht (h)',
  'Saldo Monat (h)',
  'Überstunden (h)',
  'Minusstunden (h)',
  'Stundenkonto Monatsende (h)',
  'Urlaub (Tage)',
  'Krank (Tage)',
  'Berufsschule (Tage)',
  'Schulung (Tage)',
  'Überstundenabbau (Tage)',
  'Sonstige Abwesenheit (Tage)',
  'Feiertage (Tage)',
  'Nicht freigegebene Zeiten',
];

/**
 * Monatsübersicht je Mitarbeiter für das Lohnbüro: Semikolon, Dezimalkomma, Stunden mit zwei Stellen.
 * Die Einzelzeiten liefert `csvExport` aus `daten.ts`.
 */
export function lohnCsv(zeilen: { m: Pick<Mitarbeiter, 'vorname' | 'nachname'>; w: MonatsWerte }[]): string {
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const body = zeilen.map(({ m, w }) =>
    [
      `${w.monat.slice(5, 7)}/${w.monat.slice(0, 4)}`,
      m.nachname,
      m.vorname,
      h2(w.soll),
      h2(w.gearbeitet),
      h2(w.jeArt.baustelle),
      h2(w.jeArt.fahrt),
      h2(w.jeArt.intern),
      h2(w.pauseAuto),
      h2(w.gutschrift),
      h2(w.gebucht),
      h2(w.saldo),
      h2(w.ueberstunden),
      h2(w.minusstunden),
      h2(w.kontoEnde),
      tageZahl(w.abwesenheit.urlaub),
      tageZahl(w.abwesenheit.krank),
      tageZahl(w.abwesenheit.schule),
      tageZahl(w.abwesenheit.schulung),
      tageZahl(w.abwesenheit.frei),
      tageZahl(w.abwesenheit.sonstiges),
      String(w.feiertage),
      String(w.offen),
    ]
      .map(esc)
      .join(';'),
  );
  return [LOHN_KOPF.join(';'), ...body].join('\r\n');
}

// ------------------------------------------------------------------ Hinweise zum Stundenkonto

/** Stundenkonto stark im Plus oder Minus → Chef/Büro mit konkreter Aktion */
export function kontoHinweise(t: Datum = heuteDatum()): HinweisVorschlag[] {
  const r = regeln();
  const bis = plusTage(t, -1);
  const zeiten = db.zeiten.all();
  const abw = db.abwesenheiten.all();
  const modelle = arbeitsmodelle.all();
  const buchungen = stundenbuchungen.all();
  const liste: HinweisVorschlag[] = [];
  for (const m of db.mitarbeiter.where((x) => istAktiv(x, t) && x.rolle !== 'chef')) {
    const k = stundenkonto(m, zeiten, abw, bis, undefined, { modelle, buchungen, autoPause: r.autoPause });
    if (!k) continue;
    if (k.saldo >= r.grenzePlus) {
      liste.push({
        schluessel: `stundenkonto-plus:${m.id}`,
        art: 'entscheidung',
        titel: `${m.vorname} hat ${saldoText(k.saldo)} auf dem Stundenkonto`,
        text: `Mehr als ${saldoText(r.grenzePlus).replace('+', '')} Überstunden. Plane freie Tage zum Abbau oder zahl Stunden aus.`,
        bezug: { typ: 'mitarbeiter', id: m.id },
        gewicht: 40,
        fuerRollen: ['chef', 'buero'],
        aktionen: [{ aktion: 'zeiten.abbauen', label: 'Freie Tage eintragen', primaer: true, payload: { mitarbeiterId: m.id } }],
        pfad: '/betrieb/arbeitszeiten/konto',
      });
    } else if (-k.saldo >= r.grenzeMinus) {
      liste.push({
        schluessel: `stundenkonto-minus:${m.id}`,
        art: 'problem',
        titel: `${m.vorname} hat ${saldoText(k.saldo)} auf dem Stundenkonto`,
        text: 'Prüf zuerst, ob Zeiten oder Abwesenheiten fehlen. Sonst sprich mit ihm, wie er die Stunden nacharbeitet.',
        bezug: { typ: 'mitarbeiter', id: m.id },
        gewicht: 45,
        fuerRollen: ['chef', 'buero'],
        aktionen: [{ aktion: 'zeiten.pruefen', label: 'Zeiten prüfen', primaer: true, payload: { mitarbeiterId: m.id } }],
        pfad: `/betrieb/arbeitszeiten/woche?ma=${m.id}`,
      });
    }
  }
  return liste;
}
