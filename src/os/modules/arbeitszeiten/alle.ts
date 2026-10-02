/**
 * „Alle Zeiten“ (Chef/Büro): Filter aus der URL lesen und schreiben, Zeiteinträge filtern, Summe bilden.
 * Reine Logik ohne Oberfläche – getestet in `alle.test.ts`.
 */
import { datum as datumFmt, heute as heuteDatum, plusMonate, plusTage, wochenStart } from '@core/format';
import type { Datum, ID, Zeiteintrag } from '@core/objects';
import { ART_LABEL, dauer } from './daten';

export type ZeitraumArt = 'woche' | 'monat' | 'frei';
export type ZeitArt = Zeiteintrag['art'];

export interface ZeitenFilter {
  zeitraum: ZeitraumArt;
  von: Datum;
  bis: Datum;
  /** Mitarbeiter-ID, leer = alle */
  ma: ID;
  /** Auftrag-ID, leer = alle */
  auftrag: ID;
  /** Zeitart, leer = alle */
  art: ZeitArt | '';
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const gueltig = (d: string | null): d is Datum => !!d && ISO.test(d) && !Number.isNaN(new Date(`${d}T12:00:00`).getTime());

const monatsEnde = (d: Datum): Datum => plusTage(plusMonate(`${d.slice(0, 7)}-01`, 1), -1);

/** Grenzen eines Zeitraums, der `stichtag` enthält */
export function grenzenVon(zeitraum: Exclude<ZeitraumArt, 'frei'>, stichtag: Datum): { von: Datum; bis: Datum } {
  if (zeitraum === 'woche') {
    const von = wochenStart(stichtag);
    return { von, bis: plusTage(von, 6) };
  }
  return { von: `${stichtag.slice(0, 7)}-01`, bis: monatsEnde(stichtag) };
}

/**
 * Liest den Filter aus der URL. Standard: dieser Monat, alle Mitarbeiter, alle Aufträge, alle Arten.
 * `von` legt bei Woche/Monat nur fest, welche Woche bzw. welcher Monat gemeint ist.
 */
export function filterAus(p: URLSearchParams, heute: Datum = heuteDatum()): ZeitenFilter {
  const z = p.get('zeitraum');
  const zeitraum: ZeitraumArt = z === 'woche' || z === 'frei' ? z : 'monat';
  const vonP = p.get('von');
  const bisP = p.get('bis');
  const artP = p.get('art') ?? '';
  const art = (artP in ART_LABEL ? artP : '') as ZeitArt | '';
  const rest = { ma: p.get('ma') ?? '', auftrag: p.get('auftrag') ?? '', art };
  if (zeitraum === 'frei') {
    const standard = grenzenVon('monat', heute);
    let von = gueltig(vonP) ? vonP : standard.von;
    let bis = gueltig(bisP) ? bisP : standard.bis;
    if (bis < von) [von, bis] = [bis, von];
    return { zeitraum, von, bis, ...rest };
  }
  return { zeitraum, ...grenzenVon(zeitraum, gueltig(vonP) ? vonP : heute), ...rest };
}

/** Schreibt den Filter als URL-Parameter – nur, was vom Standard abweicht, damit Links kurz bleiben. */
export function filterZu(f: ZeitenFilter, heute: Datum = heuteDatum()): URLSearchParams {
  const p = new URLSearchParams();
  if (f.zeitraum !== 'monat') p.set('zeitraum', f.zeitraum);
  const standard = f.zeitraum === 'frei' ? undefined : grenzenVon(f.zeitraum, heute);
  if (f.zeitraum === 'frei') {
    p.set('von', f.von);
    p.set('bis', f.bis);
  } else if (standard && standard.von !== f.von) p.set('von', f.von);
  if (f.ma) p.set('ma', f.ma);
  if (f.auftrag) p.set('auftrag', f.auftrag);
  if (f.art) p.set('art', f.art);
  return p;
}

/** Wechselt die Zeitraum-Art. Woche/Monat bleiben in der Nähe des bisherigen Zeitraums, „frei“ übernimmt die Grenzen. */
export function zeitraumWechseln(f: ZeitenFilter, zeitraum: ZeitraumArt, heute: Datum = heuteDatum()): ZeitenFilter {
  if (zeitraum === 'frei') return { ...f, zeitraum };
  const stichtag = heute >= f.von && heute <= f.bis ? heute : f.von;
  return { ...f, zeitraum, ...grenzenVon(zeitraum, stichtag) };
}

/** Eine Woche bzw. einen Monat vor oder zurück (bei „frei“ ohne Wirkung) */
export function verschieben(f: ZeitenFilter, richtung: 1 | -1): ZeitenFilter {
  if (f.zeitraum === 'frei') return f;
  const stichtag = f.zeitraum === 'woche' ? plusTage(f.von, 7 * richtung) : plusMonate(f.von, richtung);
  return { ...f, ...grenzenVon(f.zeitraum, stichtag) };
}

/** Enthält der Zeitraum heute? (Für „Diese Woche“ / „Dieser Monat“) */
export const istAktuell = (f: ZeitenFilter, heute: Datum = heuteDatum()) => f.von <= heute && f.bis >= heute;

const MONAT = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

/** „Oktober 2026“, „28.09.2026 bis 04.10.2026“ */
export function zeitraumText(f: Pick<ZeitenFilter, 'zeitraum' | 'von' | 'bis'>): string {
  if (f.zeitraum === 'monat') return MONAT.format(new Date(`${f.von}T12:00:00`));
  return f.von === f.bis ? datumFmt(f.von) : `${datumFmt(f.von)} bis ${datumFmt(f.bis)}`;
}

/** Anzahl der gesetzten Filter neben dem Zeitraum (für den Knopf „Filter“ auf dem Handy) */
export const filterAnzahl = (f: ZeitenFilter) => [f.ma, f.auftrag, f.art].filter(Boolean).length;

/** Zeiteinträge im Zeitraum, nach Filter, neueste zuerst (gelöschte nie) */
export function zeitenFiltern(zeiten: Zeiteintrag[], f: ZeitenFilter): Zeiteintrag[] {
  return zeiten
    .filter(
      (z) =>
        !z.geloeschtAm &&
        z.datum >= f.von &&
        z.datum <= f.bis &&
        (!f.ma || z.mitarbeiterId === f.ma) &&
        (!f.auftrag || z.auftragId === f.auftrag) &&
        (!f.art || z.art === f.art),
    )
    .sort((a, b) => (b.datum + b.start).localeCompare(a.datum + a.start));
}

/** Summe der Netto-Minuten (eingetragene Pausen abgezogen). Laufende Zeiten zählen bis `jetzt`. */
export function summeMinuten(zeiten: Zeiteintrag[], jetzt?: { datum: Datum; uhr: string }): number {
  return zeiten.reduce((s, z) => s + dauer(z, jetzt), 0);
}

/** Dateiname für den Download, z. B. `zeiten-2026-10-01-bis-2026-10-31.csv` */
export const dateiname = (f: Pick<ZeitenFilter, 'von' | 'bis'>) => `zeiten-${f.von}-bis-${f.bis}.csv`;
