/**
 * Verfügbarkeit – EINZIGE Quelle der Planungslogik „Wer ist wann frei?“ für das ganze
 * Paket „Plan“ und für alle anderen Pakete (Automatische Planung und Planprüfungen,
 * Terminbuchung, Auslastung, Kalender, Urlaub & Arbeitszeiten).
 *
 * Alle Funktionen arbeiten auf einem `PlanKontext` (Betriebsarbeitszeit, Arbeitstage, Bundesland,
 * Mitarbeiter, Abwesenheiten, Termine). Ohne Kontext lesen sie den aktuellen Datenstand aus `db`.
 * Zeiten sind lokale Uhrzeiten; Termine speichern ISO-Zeitpunkte. Datums-/Uhrzeit-Helfer
 * kommen aus `@core/format`, Feiertage und Arbeitstage aus `@core/kalender`.
 *
 * Fachliche Regeln (verbindlich für alle Nutzer):
 * - Genehmigte Abwesenheit blockiert, beantragte warnt (nicht blockierend, aber nie „einfach frei“),
 *   abgelehnte zählt nicht. Halbtags = Vormittag (erste Hälfte der Arbeitszeit) abwesend.
 * - Kein Arbeitstag (Wochentag laut `plan.arbeitstage` oder gesetzlicher Feiertag) blockiert.
 * - Abgesagte und gelöschte Termine zählen nicht; ganztägige Termine belegen die Arbeitszeit.
 * - Inaktive Mitarbeiter sowie Tage vor Eintritt/nach Austritt blockieren.
 */
import { db } from '@core/db';
import { betriebsArbeitstage, betriebsBundesland, feiertagName, istArbeitstag, type Bundesland } from '@core/kalender';
import { isoDatum, lokal, minutenAus, plusTage, tage, wochentag } from '@core/format';
import type { Abwesenheit, AbwesenheitsArt, Auftrag, Datum, ID, Mitarbeiter, Termin } from '@core/objects';

export interface PlanKontext {
  /** Betriebsarbeitszeit, z. B. "07:00" */
  arbeitsbeginn: string;
  arbeitsende: string;
  /** Arbeitstage 1 = Montag … 7 = Sonntag */
  arbeitstage: number[];
  /** für Landesfeiertage; leer = nur bundesweite Feiertage */
  bundesland?: Bundesland | null;
  mitarbeiter: Mitarbeiter[];
  abwesenheiten: Abwesenheit[];
  termine: Termin[];
}

/** Aktueller Datenstand als Planungskontext */
export function kontextAusDb(): PlanKontext {
  const b = db.betrieb.get('betrieb');
  return {
    arbeitsbeginn: b?.arbeitsbeginn || '07:00',
    arbeitsende: b?.arbeitsende || '16:00',
    arbeitstage: betriebsArbeitstage(),
    bundesland: betriebsBundesland() ?? null,
    mitarbeiter: db.mitarbeiter.all(),
    abwesenheiten: db.abwesenheiten.all(),
    termine: db.termine.all(),
  };
}

// ------------------------------------------------------------------ Tage & Intervalle

const MIN = 60_000;

/** Arbeitet der Betrieb an diesem Tag? (Arbeitstage + Feiertage des Kontexts) */
export function arbeitstagIm(k: Pick<PlanKontext, 'arbeitstage' | 'bundesland'>, datum: Datum): boolean {
  return istArbeitstag(datum, k.arbeitstage, k.bundesland ?? null);
}

/** Warum wird an diesem Tag nicht gearbeitet? (Feiertagsname oder „Kein Arbeitstag“) */
function freierTagText(k: Pick<PlanKontext, 'bundesland'>, datum: Datum): string {
  const f = feiertagName(datum, k.bundesland ?? null);
  return f ? `Feiertag: ${f}` : 'Kein Arbeitstag';
}

const zeit = (x: string | Date) => (x instanceof Date ? x : new Date(x)).getTime();

export interface Intervall {
  von: number;
  bis: number;
}

const ueberlappt = (a: Intervall, b: Intervall) => a.von < b.bis && b.von < a.bis;

/** Überschneiden sich zwei Zeiträume (z. B. Termine)? Direkt anschließend ist keine Überschneidung. */
export function zeitraeumeUeberlappen(a: { start: string | Date; ende: string | Date }, b: { start: string | Date; ende: string | Date }): boolean {
  return ueberlappt({ von: zeit(a.start), bis: zeit(a.ende) }, { von: zeit(b.start), bis: zeit(b.ende) });
}

/** Zeitraum eines Termins; ganztägige Termine belegen die Arbeitszeit der betroffenen Tage */
export function terminIntervalle(t: Pick<Termin, 'start' | 'ende' | 'ganztags'>, k: Pick<PlanKontext, 'arbeitsbeginn' | 'arbeitsende'>): Intervall[] {
  if (!t.ganztags) return [{ von: zeit(t.start), bis: zeit(t.ende) }];
  const von = isoDatum(new Date(t.start));
  const bis = isoDatum(new Date(t.ende));
  return tage(von, bis < von ? von : bis).map((d) => ({
    von: lokal(d, minutenAus(k.arbeitsbeginn)).getTime(),
    bis: lokal(d, minutenAus(k.arbeitsende)).getTime(),
  }));
}

/** Termin zählt für die Planung (abgesagte und gelöschte nicht) */
export const terminZaehlt = (t: Termin) => t.status !== 'abgesagt' && !t.geloeschtAm;

/** Termine eines Mitarbeiters, die einen Tag berühren (auch mehrtägige/ganztägige), nach Beginn sortiert */
export function termineAm(mitarbeiterId: ID, datum: Datum, k: Pick<PlanKontext, 'termine' | 'arbeitsbeginn' | 'arbeitsende'>): Termin[] {
  const tag = { von: lokal(datum, 0).getTime(), bis: lokal(plusTage(datum, 1), 0).getTime() };
  return k.termine
    .filter((t) => terminZaehlt(t) && t.mitarbeiterIds.includes(mitarbeiterId) && terminIntervalle(t, k).some((iv) => ueberlappt(iv, tag)))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Gehört der Mitarbeiter an diesem Tag zum Team (aktiv, eingetreten, nicht ausgetreten, nicht gelöscht)? */
export function imTeam(m: Mitarbeiter | undefined, datum: Datum): m is Mitarbeiter {
  return !!m && m.aktiv && !m.geloeschtAm && !(m.austritt && m.austritt < datum) && !(m.eintritt && m.eintritt > datum);
}

/** Wer kann ausführend eingeplant werden? (im Team, kein Büro) */
export function planbareMitarbeiter(k: Pick<PlanKontext, 'mitarbeiter'>, stichtag: Datum): Mitarbeiter[] {
  return k.mitarbeiter.filter((m) => m.rolle !== 'buero' && m.aktiv && !m.geloeschtAm && !(m.austritt && m.austritt < stichtag));
}

// ------------------------------------------------------------------ Abwesenheiten

export const ABWESENHEIT_LABEL: Record<AbwesenheitsArt, string> = {
  urlaub: 'Urlaub',
  krank: 'Krank',
  schule: 'Berufsschule',
  schulung: 'Schulung',
  frei: 'Frei',
  sonstiges: 'Abwesend',
};

/**
 * Abwesenheit eines Mitarbeiters an einem Tag: genehmigte vor beantragten, abgelehnte nie.
 * `nurGenehmigt` für Soll-Stunden/Urlaubskonto, wo nur wirksame Abwesenheiten zählen.
 */
export function abwesenheitAm(mitarbeiterId: ID, datum: Datum, k: Pick<PlanKontext, 'abwesenheiten'>, opts: { nurGenehmigt?: boolean } = {}): Abwesenheit | undefined {
  const treffer = k.abwesenheiten.filter(
    (a) =>
      !a.geloeschtAm &&
      a.mitarbeiterId === mitarbeiterId &&
      (opts.nurGenehmigt ? a.status === 'genehmigt' : a.status !== 'abgelehnt') &&
      a.von <= datum &&
      a.bis >= datum,
  );
  return treffer.find((a) => a.status === 'genehmigt') ?? treffer[0];
}

/** Halbtags abwesend = Vormittag: von Arbeitsbeginn bis zur Mitte der Arbeitszeit (Minuten) */
export function halbtagsVormittag(k: Pick<PlanKontext, 'arbeitsbeginn' | 'arbeitsende'>): Intervall {
  const beginn = minutenAus(k.arbeitsbeginn);
  return { von: beginn, bis: Math.round((beginn + minutenAus(k.arbeitsende)) / 2) };
}

// ------------------------------------------------------------------ Prüfen

/** `kein_arbeitstag` umfasst Wochentage ohne Arbeit und gesetzliche Feiertage */
export type GrundArt = 'unbekannt' | 'inaktiv' | 'abwesend' | 'abwesend_beantragt' | 'kein_arbeitstag' | 'ausserhalb' | 'termin';

export interface Grund {
  art: GrundArt;
  /** kurzer Status-Text, z. B. „Urlaub“, „Doppelt gebucht“ */
  text: string;
  /** blockiert die Planung (sonst nur Warnung) */
  blockiert: boolean;
  terminId?: ID;
  abwesenheitId?: ID;
}

export interface Pruefung {
  verfuegbar: boolean;
  gruende: Grund[];
}

export interface PruefOptionen {
  kontext?: PlanKontext;
  /** diesen Termin ignorieren (beim Verschieben/Bearbeiten) */
  ohneTerminId?: ID;
}

/** Ausführliche Prüfung: Ist der Mitarbeiter im Zeitraum verfügbar – und wenn nicht, warum? */
export function pruefeVerfuegbarkeit(mitarbeiterId: ID, start: string | Date, ende: string | Date, opts: PruefOptionen = {}): Pruefung {
  const k = opts.kontext ?? kontextAusDb();
  const gruende: Grund[] = [];
  const m = k.mitarbeiter.find((x) => x.id === mitarbeiterId);
  const s = zeit(start);
  const e = Math.max(zeit(ende), s + MIN);
  const ersterTag = isoDatum(new Date(s));
  const letzterTag = isoDatum(new Date(e - 1));

  if (!m) gruende.push({ art: 'unbekannt', text: 'Mitarbeiter unbekannt', blockiert: true });
  else if (!m.aktiv || m.geloeschtAm || (m.austritt && m.austritt < ersterTag) || (m.eintritt && m.eintritt > letzterTag))
    gruende.push({ art: 'inaktiv', text: 'Nicht mehr im Team', blockiert: true });

  const beginn = minutenAus(k.arbeitsbeginn);
  const schluss = minutenAus(k.arbeitsende);
  for (const tag of tage(ersterTag, letzterTag)) {
    const ab = abwesenheitAm(mitarbeiterId, tag, k);
    if (ab) {
      const label = ABWESENHEIT_LABEL[ab.art];
      let betroffen = true;
      if (ab.halbtags) {
        const vm = halbtagsVormittag(k);
        betroffen = ueberlappt({ von: s, bis: e }, { von: lokal(tag, vm.von).getTime(), bis: lokal(tag, vm.bis).getTime() });
      }
      if (betroffen)
        gruende.push(
          ab.status === 'genehmigt'
            ? { art: 'abwesend', text: label, blockiert: true, abwesenheitId: ab.id }
            : { art: 'abwesend_beantragt', text: `${label} beantragt`, blockiert: false, abwesenheitId: ab.id },
        );
    }
    if (!arbeitstagIm(k, tag)) {
      gruende.push({ art: 'kein_arbeitstag', text: freierTagText(k, tag), blockiert: true });
      continue;
    }
    const tagVon = Math.max(s, lokal(tag, 0).getTime());
    const tagBis = Math.min(e, lokal(tag, 24 * 60).getTime());
    if (tagVon < lokal(tag, beginn).getTime() || tagBis > lokal(tag, schluss).getTime())
      gruende.push({ art: 'ausserhalb', text: 'Außerhalb der Arbeitszeit', blockiert: true });
  }

  for (const t of k.termine) {
    if (t.id === opts.ohneTerminId || !terminZaehlt(t) || !t.mitarbeiterIds.includes(mitarbeiterId)) continue;
    if (terminIntervalle(t, k).some((iv) => ueberlappt(iv, { von: s, bis: e })))
      gruende.push({ art: 'termin', text: 'Doppelt gebucht', blockiert: true, terminId: t.id });
  }

  // gleiche Gründe nur einmal (z. B. „Außerhalb der Arbeitszeit“ an mehreren Tagen)
  const eindeutig = gruende.filter((g, i) => gruende.findIndex((x) => x.art === g.art && x.text === g.text && x.terminId === g.terminId && x.abwesenheitId === g.abwesenheitId) === i);
  return { verfuegbar: !eindeutig.some((g) => g.blockiert), gruende: eindeutig };
}

/** Ist der Mitarbeiter von `start` bis `ende` frei (anwesend, in der Arbeitszeit, ohne anderen Termin)? */
export function verfuegbar(mitarbeiterId: ID, start: string | Date, ende: string | Date, opts: PruefOptionen = {}): boolean {
  return pruefeVerfuegbarkeit(mitarbeiterId, start, ende, opts).verfuegbar;
}

/** Konflikte eines (geplanten) Termins je eingeplantem Mitarbeiter */
export function terminKonflikte(t: Pick<Termin, 'id' | 'start' | 'ende' | 'mitarbeiterIds' | 'ganztags' | 'status'>, kontext: PlanKontext = kontextAusDb()): { mitarbeiterId: ID; gruende: Grund[] }[] {
  if (t.status === 'abgesagt' || t.status === 'erledigt') return [];
  const intervalle = t.ganztags ? terminIntervalle(t as Termin, kontext) : [{ von: zeit(t.start), bis: zeit(t.ende) }];
  return t.mitarbeiterIds
    .map((mitarbeiterId) => {
      const gruende = intervalle.flatMap((iv) => pruefeVerfuegbarkeit(mitarbeiterId, new Date(iv.von), new Date(iv.bis), { kontext, ohneTerminId: t.id }).gruende);
      return { mitarbeiterId, gruende: gruende.filter((g, i) => gruende.findIndex((x) => x.text === g.text && x.terminId === g.terminId) === i) };
    })
    .filter((x) => x.gruende.length > 0);
}

// ------------------------------------------------------------------ Belegung eines Tages

export interface Tagesbelegung {
  /** grundsätzlich einplanbar (im Team, Arbeitstag, nicht ganztags genehmigt abwesend) */
  frei: boolean;
  /** belegte Zeiten (ms) an diesem Tag: Termine (mit Puffer) und halbtags-Abwesenheit */
  belegt: Intervall[];
  /** beantragte (noch nicht genehmigte) Abwesenheit – Warnung, kein Blocker */
  beantragt?: Abwesenheit;
}

/** Belegung eines Mitarbeiters an einem Tag – Grundlage für freie Slots und freie Fenster */
export function belegungAm(mitarbeiterId: ID, tag: Datum, k: PlanKontext, pufferMinuten = 0): Tagesbelegung {
  const m = k.mitarbeiter.find((x) => x.id === mitarbeiterId);
  const ab = abwesenheitAm(mitarbeiterId, tag, k);
  const genehmigt = ab?.status === 'genehmigt' ? ab : undefined;
  const frei = imTeam(m, tag) && arbeitstagIm(k, tag) && !(genehmigt && !genehmigt.halbtags);
  const belegt: Intervall[] = [];
  if (genehmigt?.halbtags) {
    const vm = halbtagsVormittag(k);
    belegt.push({ von: lokal(tag, vm.von).getTime(), bis: lokal(tag, vm.bis).getTime() });
  }
  const tagIv = { von: lokal(tag, 0).getTime(), bis: lokal(plusTage(tag, 1), 0).getTime() };
  for (const t of k.termine) {
    if (!terminZaehlt(t) || !t.mitarbeiterIds.includes(mitarbeiterId)) continue;
    for (const x of terminIntervalle(t, k)) if (ueberlappt(x, tagIv)) belegt.push({ von: x.von - pufferMinuten * MIN, bis: x.bis + pufferMinuten * MIN });
  }
  return { frei, belegt, beantragt: ab && ab.status !== 'genehmigt' ? ab : undefined };
}

/** Freies Zeitfenster in Minuten seit Mitternacht */
export interface Fenster {
  von: number;
  bis: number;
}

/**
 * Freie Zeitfenster (Minuten) eines Mitarbeiters an einem Tag innerhalb der Betriebsarbeitszeit.
 * Beantragte Abwesenheit lässt die Fenster offen – siehe `belegungAm(...).beantragt` für die Warnung.
 */
export function freieFenster(mitarbeiterId: ID, tag: Datum, k: PlanKontext): Fenster[] {
  const b = belegungAm(mitarbeiterId, tag, k);
  if (!b.frei) return [];
  const basis = lokal(tag, 0).getTime();
  let frei: Fenster[] = [{ von: minutenAus(k.arbeitsbeginn), bis: minutenAus(k.arbeitsende) }];
  for (const iv of b.belegt) {
    const s = Math.floor((iv.von - basis) / MIN);
    const e = Math.ceil((iv.bis - basis) / MIN);
    frei = frei.flatMap((f) => {
      if (e <= f.von || s >= f.bis) return [f];
      const r: Fenster[] = [];
      if (s > f.von) r.push({ von: f.von, bis: s });
      if (e < f.bis) r.push({ von: e, bis: f.bis });
      return r;
    });
  }
  return frei.filter((f) => f.bis > f.von);
}

// ------------------------------------------------------------------ Freie Slots

export interface Slot {
  start: string;
  ende: string;
  /** alle Mitarbeiter, die in diesem Slot frei sind */
  mitarbeiterIds: ID[];
}

export interface SlotOptionen {
  von: Datum;
  bis: Datum;
  dauerMinuten: number;
  /** nur diese Mitarbeiter (sonst alle aktiven) */
  mitarbeiterIds?: ID[];
  /** Slot-Raster, Standard 30 Minuten */
  rasterMinuten?: number;
  /** engeres Zeitfenster als die Betriebsarbeitszeit, z. B. Buchungsfenster */
  zeitVon?: string;
  zeitBis?: string;
  /** nur diese Wochentage (1 = Mo) */
  wochentage?: number[];
  /** Slots vor diesem Zeitpunkt auslassen (Standard: jetzt) */
  ab?: Date;
  /** Puffer zwischen Terminen in Minuten */
  pufferMinuten?: number;
  /** wie viele Mitarbeiter mindestens frei sein müssen (Standard 1) */
  mindestens?: number;
  kontext?: PlanKontext;
  /** höchstens so viele Slots */
  max?: number;
}

/** Freie Zeitfenster, in denen mindestens ein (bzw. `mindestens`) Mitarbeiter frei ist */
export function freieSlots(o: SlotOptionen): Slot[] {
  const k = o.kontext ?? kontextAusDb();
  const raster = o.rasterMinuten ?? 30;
  const puffer = o.pufferMinuten ?? 0;
  const mindestens = o.mindestens ?? 1;
  const ab = (o.ab ?? new Date()).getTime();
  const ids = o.mitarbeiterIds ?? k.mitarbeiter.filter((m) => m.aktiv && !m.geloeschtAm).map((m) => m.id);
  const fensterVon = Math.max(minutenAus(k.arbeitsbeginn), minutenAus(o.zeitVon ?? '00:00'));
  const fensterBis = Math.min(minutenAus(k.arbeitsende), minutenAus(o.zeitBis ?? '24:00'));
  const slots: Slot[] = [];
  if (o.dauerMinuten <= 0 || !ids.length) return slots;

  for (const tag of tage(o.von, o.bis)) {
    if (o.wochentage && !o.wochentage.includes(wochentag(tag))) continue;
    if (!arbeitstagIm(k, tag)) continue;
    const belegung = new Map(ids.map((id) => [id, belegungAm(id, tag, k, puffer)]));
    for (let min = fensterVon; min + o.dauerMinuten <= fensterBis; min += raster) {
      const s = lokal(tag, min).getTime();
      const e = s + o.dauerMinuten * MIN;
      if (s < ab) continue;
      const freieIds = ids.filter((id) => {
        const b = belegung.get(id)!;
        return b.frei && !b.belegt.some((iv) => ueberlappt(iv, { von: s, bis: e }));
      });
      if (freieIds.length >= mindestens) {
        slots.push({ start: new Date(s).toISOString(), ende: new Date(e).toISOString(), mitarbeiterIds: freieIds });
        if (o.max && slots.length >= o.max) return slots;
      }
    }
  }
  return slots;
}

// ------------------------------------------------------------------ Stunden (für Auslastung)

/** Sollstunden an einem Arbeitstag laut Wochenstunden */
export function tagesStunden(m: Pick<Mitarbeiter, 'wochenstunden'>, k: Pick<PlanKontext, 'arbeitstage'>): number {
  return k.arbeitstage.length ? m.wochenstunden / k.arbeitstage.length : 0;
}

/** Verfügbare Stunden im Zeitraum: Wochenstunden abzüglich Feiertagen und genehmigter Abwesenheiten */
export function verfuegbareStunden(mitarbeiterId: ID, von: Datum, bis: Datum, k: PlanKontext = kontextAusDb()): number {
  const m = k.mitarbeiter.find((x) => x.id === mitarbeiterId);
  if (!m || !m.aktiv) return 0;
  const proTag = tagesStunden(m, k);
  let summe = 0;
  for (const tag of tage(von, bis)) {
    if (!arbeitstagIm(k, tag) || !imTeam(m, tag)) continue;
    const ab = abwesenheitAm(mitarbeiterId, tag, k, { nurGenehmigt: true });
    summe += ab ? (ab.halbtags ? proTag / 2 : 0) : proTag;
  }
  return runde(summe);
}

/** Verplante Stunden eines Mitarbeiters im Zeitraum (Termine ohne abgesagte; ganztägig = Tagessoll) */
export function geplanteStunden(mitarbeiterId: ID, von: Datum, bis: Datum, k: PlanKontext = kontextAusDb()): number {
  const m = k.mitarbeiter.find((x) => x.id === mitarbeiterId);
  const fenster = { von: lokal(von, 0).getTime(), bis: lokal(plusTage(bis, 1), 0).getTime() };
  let summe = 0;
  for (const t of k.termine) {
    if (!terminZaehlt(t) || !t.mitarbeiterIds.includes(mitarbeiterId)) continue;
    if (t.ganztags) {
      const tv = isoDatum(new Date(t.start));
      const tb = isoDatum(new Date(t.ende));
      const n = tage(tv > von ? tv : von, tb < bis ? tb : bis).filter((d) => arbeitstagIm(k, d)).length;
      summe += n * (m ? tagesStunden(m, k) : 8);
      continue;
    }
    const s = Math.max(zeit(t.start), fenster.von);
    const e = Math.min(zeit(t.ende), fenster.bis);
    if (e > s) summe += (e - s) / 3_600_000;
  }
  return runde(summe);
}

/** Arbeitstermine, deren Stunden auf einen Auftrag zählen */
export const STUNDEN_TERMINARTEN: Termin['art'][] = ['einsatz', 'wartung', 'abnahme'];

/**
 * Bereits verplante Personenstunden eines Auftrags (Dauer × Anzahl Leute) – vergangene und künftige.
 * Zählen nur Arbeitstermine (Einsatz, Wartung, Abnahme) mit Uhrzeit; abgesagte, gelöschte und
 * ganztägige Termine (ohne verlässliche Dauer) nicht.
 */
export function auftragStunden(auftragId: ID, termine: Termin[]): number {
  const summe = termine
    .filter((t) => t.auftragId === auftragId && terminZaehlt(t) && !t.ganztags && STUNDEN_TERMINARTEN.includes(t.art))
    .reduce((s, t) => s + ((zeit(t.ende) - zeit(t.start)) / 3_600_000) * Math.max(1, t.mitarbeiterIds.length), 0);
  return runde(summe);
}

/** Noch einzuplanende Stunden eines Auftrags (undefined, wenn nichts geschätzt ist) */
export function restStunden(a: Pick<Auftrag, 'id' | 'geplanteStunden'>, termine: Termin[]): number | undefined {
  if (!a.geplanteStunden) return undefined;
  return Math.max(0, runde(a.geplanteStunden - auftragStunden(a.id, termine)));
}

const runde = (n: number) => Math.round(n * 100) / 100;

// ------------------------------------------------------------------ Anwesenheit (Wer ist wann da)

export interface Anwesenheit {
  status: 'da' | 'abwesend' | 'beantragt' | 'frei' | 'inaktiv';
  text: string;
  abwesenheit?: Abwesenheit;
}

export function anwesenheit(mitarbeiterId: ID, datum: Datum, k: PlanKontext = kontextAusDb()): Anwesenheit {
  const m = k.mitarbeiter.find((x) => x.id === mitarbeiterId);
  if (!imTeam(m, datum)) return { status: 'inaktiv', text: 'Nicht im Team' };
  if (!arbeitstagIm(k, datum)) return { status: 'frei', text: freierTagText(k, datum) };
  const ab = abwesenheitAm(mitarbeiterId, datum, k);
  if (ab?.status === 'genehmigt')
    return { status: 'abwesend', text: ab.halbtags ? `${ABWESENHEIT_LABEL[ab.art]} (halber Tag)` : ABWESENHEIT_LABEL[ab.art], abwesenheit: ab };
  if (ab) return { status: 'beantragt', text: `${ABWESENHEIT_LABEL[ab.art]} beantragt`, abwesenheit: ab };
  return { status: 'da', text: `Da ${k.arbeitsbeginn}–${k.arbeitsende}` };
}
