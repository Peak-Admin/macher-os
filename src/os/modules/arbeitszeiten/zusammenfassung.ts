/**
 * Zeitraum-Übersicht für Chef und Büro: Arbeitszeit · Fahrzeit · Überstundenabbau · Urlaub · Krank
 * für einen frei gewählten Zeitraum (Woche, Monat) und eine Auswahl von Mitarbeitern.
 *
 * Rechnet mit denselben Regeln wie Stundenkonto und Monatsauswertung (`daten.ts`, `modell.ts`):
 * Netto nach Pausenregel, Soll aus dem Arbeitszeitmodell, Feiertage ohne Soll, nur genehmigte Abwesenheiten.
 * Ohne React und ohne Datenbankzugriff, damit alles testbar ist.
 */
import { plusTage } from '@core/format';
import { betriebsArbeitstage } from '@core/kalender';
import type { Abwesenheit, Datum, Mitarbeiter, Zeiteintrag } from '@core/objects';
import { abwesenheitAm } from '@modules/abwesenheiten/daten';
import { nachTag, sollPlanTag, tagAuswerten } from './daten';
import type { Arbeitsmodell } from './modell';

/** Abwesenheit im Zeitraum: Arbeitstage (halbtags 0,5) und die zugehörigen Soll-Minuten laut Modell */
export interface AbwesenheitsSumme {
  tage: number;
  minuten: number;
}

export interface ZeitraumSumme {
  von: Datum;
  bis: Datum;
  /** gearbeitet nach Pausenregel, ohne Fahrt (Baustelle + Werkstatt/Büro) */
  arbeit: number;
  baustelle: number;
  intern: number;
  /** Fahrtzeit nach Pausenregel */
  fahrt: number;
  /** genehmigter Überstundenabbau (Frei) – diese Stunden gehen vom Konto ab */
  abbau: AbwesenheitsSumme;
  urlaub: AbwesenheitsSumme;
  krank: AbwesenheitsSumme;
  /** Anzahl Zeiteinträge im Zeitraum */
  eintraege: number;
  /** davon noch laufend */
  laufend: number;
  /** nichts gebucht: keine Zeit und keine der drei Abwesenheiten */
  leer: boolean;
}

type Person = Pick<Mitarbeiter, 'id' | 'wochenstunden' | 'eintritt' | 'austritt'>;

const null0 = (): AbwesenheitsSumme => ({ tage: 0, minuten: 0 });

/**
 * Summen für `leute` von `von` bis `bis` (inklusive).
 * Laufende Zeiten zählen bis `jetzt`, wenn angegeben – sonst gar nicht (wie in der Monatsauswertung).
 */
export function zeitraumSumme(
  leute: Person[],
  von: Datum,
  bis: Datum,
  ctx: {
    zeiten: Zeiteintrag[];
    abw: Abwesenheit[];
    modelle?: Arbeitsmodell[];
    arbeitstage?: number[];
    autoPause?: boolean;
    jetzt?: { datum: Datum; uhr: string };
  },
): ZeitraumSumme {
  const arbeitstage = ctx.arbeitstage ?? betriebsArbeitstage();
  const s: ZeitraumSumme = {
    von,
    bis,
    arbeit: 0,
    baustelle: 0,
    intern: 0,
    fahrt: 0,
    abbau: null0(),
    urlaub: null0(),
    krank: null0(),
    eintraege: 0,
    laufend: 0,
    leer: true,
  };
  if (bis < von) return s;
  const imZeitraum = ctx.zeiten.filter((z) => !z.geloeschtAm && z.datum >= von && z.datum <= bis);
  for (const m of leute) {
    const tage = nachTag(imZeitraum, m.id);
    for (let d = von; d <= bis; d = plusTage(d, 1)) {
      const liste = tage.get(d);
      if (liste) {
        s.eintraege += liste.length;
        s.laufend += liste.filter((z) => !z.ende).length;
        const w = tagAuswerten(liste, {
          autoPause: ctx.autoPause,
          jetzt: ctx.jetzt,
        });
        s.baustelle += w.jeArt.baustelle;
        s.intern += w.jeArt.intern;
        s.fahrt += w.jeArt.fahrt;
      }
      // Abwesenheit zählt nur an Tagen mit Soll (wie Monatsauswertung und Lohn-CSV)
      const plan = sollPlanTag(m, d, arbeitstage, ctx.modelle);
      if (!plan) continue;
      const a = abwesenheitAm(m.id, d, ctx.abw);
      const ziel = a?.art === 'frei' ? s.abbau : a?.art === 'urlaub' ? s.urlaub : a?.art === 'krank' ? s.krank : undefined;
      if (!a || !ziel) continue;
      ziel.tage += a.halbtags ? 0.5 : 1;
      ziel.minuten += a.halbtags ? Math.round(plan / 2) : plan;
    }
  }
  s.arbeit = s.baustelle + s.intern;
  s.leer = !s.eintraege && !s.abbau.tage && !s.urlaub.tage && !s.krank.tage;
  return s;
}

/** „1 Tag“, „2,5 Tage“ */
export function tageKurz(n: number): string {
  return n === 1 ? '1 Tag' : `${String(n).replace('.', ',')} Tage`;
}
