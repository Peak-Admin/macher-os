/**
 * Verfügbarkeit – zentrale, reine Planungslogik für das ganze Paket „Plan“
 * (und für andere Pakete wie Automatische Planung oder Terminbuchung).
 *
 * Alle Funktionen arbeiten auf einem `PlanKontext` (Betriebsarbeitszeit, Mitarbeiter,
 * Abwesenheiten, Termine). Ohne Kontext lesen sie den aktuellen Datenstand aus `db`.
 * Zeiten sind lokale Uhrzeiten; Termine speichern ISO-Zeitpunkte.
 */
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { isoDatum, plusTage } from '@core/format';
import type { Abwesenheit, AbwesenheitsArt, Datum, ID, Mitarbeiter, Termin } from '@core/objects';

export interface PlanKontext {
  /** Betriebsarbeitszeit, z. B. "07:00" */
  arbeitsbeginn: string;
  arbeitsende: string;
  /** Arbeitstage 1 = Montag … 7 = Sonntag */
  arbeitstage: number[];
  mitarbeiter: Mitarbeiter[];
  abwesenheiten: Abwesenheit[];
  termine: Termin[];
}

export const STANDARD_ARBEITSTAGE = [1, 2, 3, 4, 5];

/** Aktueller Datenstand als Planungskontext */
export function kontextAusDb(): PlanKontext {
  const b = db.betrieb.get('betrieb');
  return {
    arbeitsbeginn: b?.arbeitsbeginn ?? '07:00',
    arbeitsende: b?.arbeitsende ?? '16:00',
    arbeitstage: einstellung('plan.arbeitstage', STANDARD_ARBEITSTAGE),
    mitarbeiter: db.mitarbeiter.all(),
    abwesenheiten: db.abwesenheiten.all(),
    termine: db.termine.all(),
  };
}

// ------------------------------------------------------------------ Datum & Zeit

const MIN = 60_000;

/** "07:30" → 450 */
export function minutenAus(uhr: string): number {
  const [h, m] = uhr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** 450 → "07:30" */
export function uhrAus(minuten: number): string {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${z(Math.floor(minuten / 60))}:${z(minuten % 60)}`;
}

/** Lokales Datum + Minuten seit Mitternacht → Date */
export function lokal(datum: Datum, minuten: number): Date {
  const d = new Date(`${datum}T00:00:00`);
  d.setMinutes(minuten);
  return d;
}

/** 1 = Montag … 7 = Sonntag */
export function wochentag(datum: Datum): number {
  const t = new Date(`${datum}T12:00:00`).getDay();
  return t === 0 ? 7 : t;
}

/** Montag der Woche, in der `datum` liegt */
export function wochenStart(datum: Datum): Datum {
  return plusTage(datum, 1 - wochentag(datum));
}

/** Alle Tage von `von` bis `bis` (beide inklusive) */
export function tage(von: Datum, bis: Datum): Datum[] {
  const liste: Datum[] = [];
  for (let d = von; d <= bis && liste.length < 400; d = plusTage(d, 1)) liste.push(d);
  return liste;
}

const zeit = (x: string | Date) => (x instanceof Date ? x : new Date(x)).getTime();

interface Intervall {
  von: number;
  bis: number;
}

const ueberlappt = (a: Intervall, b: Intervall) => a.von < b.bis && b.von < a.bis;

/** Zeitraum eines Termins; ganztägige Termine belegen die Arbeitszeit der betroffenen Tage */
export function terminIntervalle(t: Termin, k: Pick<PlanKontext, 'arbeitsbeginn' | 'arbeitsende'>): Intervall[] {
  if (!t.ganztags) return [{ von: zeit(t.start), bis: zeit(t.ende) }];
  const von = isoDatum(new Date(t.start));
  const bis = isoDatum(new Date(t.ende));
  return tage(von, bis < von ? von : bis).map((d) => ({
    von: lokal(d, minutenAus(k.arbeitsbeginn)).getTime(),
    bis: lokal(d, minutenAus(k.arbeitsende)).getTime(),
  }));
}

/** Termin zählt für die Planung (abgesagte nicht) */
export const terminZaehlt = (t: Termin) => t.status !== 'abgesagt' && !t.geloeschtAm;

// ------------------------------------------------------------------ Abwesenheiten

export const ABWESENHEIT_LABEL: Record<AbwesenheitsArt, string> = {
  urlaub: 'Urlaub',
  krank: 'Krank',
  schule: 'Berufsschule',
  schulung: 'Schulung',
  frei: 'Frei',
  sonstiges: 'Abwesend',
};

/** Abwesenheit eines Mitarbeiters an einem Tag (genehmigte vor beantragten) */
export function abwesenheitAm(mitarbeiterId: ID, datum: Datum, k: Pick<PlanKontext, 'abwesenheiten'>): Abwesenheit | undefined {
  const treffer = k.abwesenheiten.filter(
    (a) => !a.geloeschtAm && a.mitarbeiterId === mitarbeiterId && a.status !== 'abgelehnt' && a.von <= datum && a.bis >= datum,
  );
  return treffer.find((a) => a.status === 'genehmigt') ?? treffer[0];
}

// ------------------------------------------------------------------ Prüfen

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
  else if (!m.aktiv || (m.austritt && m.austritt < ersterTag) || (m.eintritt && m.eintritt > letzterTag))
    gruende.push({ art: 'inaktiv', text: 'Nicht mehr im Team', blockiert: true });

  const beginn = minutenAus(k.arbeitsbeginn);
  const schluss = minutenAus(k.arbeitsende);
  for (const tag of tage(ersterTag, letzterTag)) {
    const ab = abwesenheitAm(mitarbeiterId, tag, k);
    if (ab) {
      const label = ABWESENHEIT_LABEL[ab.art];
      let betroffen = true;
      if (ab.halbtags) {
        // halbtags: erste Hälfte des Arbeitstages
        const mitte = lokal(tag, Math.round((beginn + schluss) / 2)).getTime();
        betroffen = ueberlappt({ von: s, bis: e }, { von: lokal(tag, beginn).getTime(), bis: mitte });
      }
      if (betroffen)
        gruende.push(
          ab.status === 'genehmigt'
            ? { art: 'abwesend', text: label, blockiert: true, abwesenheitId: ab.id }
            : { art: 'abwesend_beantragt', text: `${label} beantragt`, blockiert: false, abwesenheitId: ab.id },
        );
    }
    if (!k.arbeitstage.includes(wochentag(tag))) {
      gruende.push({ art: 'kein_arbeitstag', text: 'Kein Arbeitstag', blockiert: true });
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
  const eindeutig = gruende.filter((g, i) => gruende.findIndex((x) => x.art === g.art && x.terminId === g.terminId && x.abwesenheitId === g.abwesenheitId) === i);
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
  const ids = o.mitarbeiterIds ?? k.mitarbeiter.filter((m) => m.aktiv).map((m) => m.id);
  const fensterVon = Math.max(minutenAus(k.arbeitsbeginn), minutenAus(o.zeitVon ?? '00:00'));
  const fensterBis = Math.min(minutenAus(k.arbeitsende), minutenAus(o.zeitBis ?? '24:00'));
  const slots: Slot[] = [];
  if (o.dauerMinuten <= 0 || !ids.length) return slots;

  for (const tag of tage(o.von, o.bis)) {
    if (o.wochentage && !o.wochentage.includes(wochentag(tag))) continue;
    if (!k.arbeitstage.includes(wochentag(tag))) continue;
    // belegte Intervalle je Mitarbeiter an diesem Tag vorberechnen
    const tagVon = lokal(tag, 0).getTime();
    const tagBis = lokal(tag, 24 * 60).getTime();
    const belegt = new Map<ID, Intervall[]>();
    const frei = new Map<ID, boolean>();
    for (const id of ids) {
      const m = k.mitarbeiter.find((x) => x.id === id);
      const ab2 = abwesenheitAm(id, tag, k);
      const inaktiv = !m || !m.aktiv || (m.austritt && m.austritt < tag) || (m.eintritt && m.eintritt > tag);
      frei.set(id, !inaktiv && !(ab2 && ab2.status === 'genehmigt' && !ab2.halbtags));
      const iv: Intervall[] = [];
      if (ab2 && ab2.status === 'genehmigt' && ab2.halbtags) {
        iv.push({ von: lokal(tag, minutenAus(k.arbeitsbeginn)).getTime(), bis: lokal(tag, Math.round((minutenAus(k.arbeitsbeginn) + minutenAus(k.arbeitsende)) / 2)).getTime() });
      }
      for (const t of k.termine) {
        if (!terminZaehlt(t) || !t.mitarbeiterIds.includes(id)) continue;
        for (const x of terminIntervalle(t, k)) {
          if (ueberlappt(x, { von: tagVon, bis: tagBis })) iv.push({ von: x.von - puffer * MIN, bis: x.bis + puffer * MIN });
        }
      }
      belegt.set(id, iv);
    }
    for (let min = fensterVon; min + o.dauerMinuten <= fensterBis; min += raster) {
      const s = lokal(tag, min).getTime();
      const e = s + o.dauerMinuten * MIN;
      if (s < ab) continue;
      const freieIds = ids.filter((id) => frei.get(id) && !belegt.get(id)!.some((iv) => ueberlappt(iv, { von: s, bis: e })));
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

/** Verfügbare Stunden im Zeitraum: Wochenstunden abzüglich genehmigter Abwesenheiten */
export function verfuegbareStunden(mitarbeiterId: ID, von: Datum, bis: Datum, k: PlanKontext = kontextAusDb()): number {
  const m = k.mitarbeiter.find((x) => x.id === mitarbeiterId);
  if (!m || !m.aktiv) return 0;
  const proTag = tagesStunden(m, k);
  let summe = 0;
  for (const tag of tage(von, bis)) {
    if (!k.arbeitstage.includes(wochentag(tag))) continue;
    if ((m.eintritt && m.eintritt > tag) || (m.austritt && m.austritt < tag)) continue;
    const ab = abwesenheitAm(mitarbeiterId, tag, k);
    if (ab?.status === 'genehmigt') summe += ab.halbtags ? proTag / 2 : 0;
    else summe += proTag;
  }
  return runde(summe);
}

/** Verplante Stunden im Zeitraum (Termine ohne abgesagte; ganztägig = Tagessoll) */
export function geplanteStunden(mitarbeiterId: ID, von: Datum, bis: Datum, k: PlanKontext = kontextAusDb()): number {
  const m = k.mitarbeiter.find((x) => x.id === mitarbeiterId);
  const fenster = { von: lokal(von, 0).getTime(), bis: lokal(plusTage(bis, 1), 0).getTime() };
  let summe = 0;
  for (const t of k.termine) {
    if (!terminZaehlt(t) || !t.mitarbeiterIds.includes(mitarbeiterId)) continue;
    if (t.ganztags) {
      const tv = isoDatum(new Date(t.start));
      const tb = isoDatum(new Date(t.ende));
      const n = tage(tv > von ? tv : von, tb < bis ? tb : bis).filter((d) => k.arbeitstage.includes(wochentag(d))).length;
      summe += n * (m ? tagesStunden(m, k) : 8);
      continue;
    }
    const s = Math.max(zeit(t.start), fenster.von);
    const e = Math.min(zeit(t.ende), fenster.bis);
    if (e > s) summe += (e - s) / 3_600_000;
  }
  return runde(summe);
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
  if (!m || !m.aktiv || (m.austritt && m.austritt < datum) || (m.eintritt && m.eintritt > datum)) return { status: 'inaktiv', text: 'Nicht im Team' };
  if (!k.arbeitstage.includes(wochentag(datum))) return { status: 'frei', text: 'Kein Arbeitstag' };
  const ab = abwesenheitAm(mitarbeiterId, datum, k);
  if (ab?.status === 'genehmigt')
    return { status: 'abwesend', text: ab.halbtags ? `${ABWESENHEIT_LABEL[ab.art]} (halber Tag)` : ABWESENHEIT_LABEL[ab.art], abwesenheit: ab };
  if (ab) return { status: 'beantragt', text: `${ABWESENHEIT_LABEL[ab.art]} beantragt`, abwesenheit: ab };
  return { status: 'da', text: `Da ${k.arbeitsbeginn}–${k.arbeitsende}` };
}
