/**
 * Auswertung: wenige echte Kennzahlen mit Zeitraum und Vergleich zum Vorzeitraum.
 * Alle Werte werden aus Rechnungen, Zahlungen, Angeboten, Terminen und Mitarbeitern berechnet.
 * Gibt es keine Grundlage, ist der Wert `undefined` („Noch keine Daten“).
 */
import { isoDatum, plusTage, summen, tageZwischen } from '@core/format';
import { arbeitstageZwischen, betriebsArbeitstage } from '@core/kalender';
import type { Cent, Datum } from '@core/objects';
import type { Basisdaten } from '../kosten/basis';
import { rechnungBrutto, rechnungNetto, rechnungZaehlt, ustSatzVon } from '../ertrag/daten';
import { angenommenesAngebot, LAUFEND } from '../nachkalkulation/daten';

export type ZeitraumArt = 'monat' | 'vormonat' | 'quartal' | 'jahr';

export interface Spanne {
  von: Datum;
  bis: Datum;
  label: string;
}

export interface Zeitraum extends Spanne {
  vor: Spanne;
}

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function teile(d: Datum) {
  const [j, m, t] = d.split('-').map(Number);
  return { j, m, t };
}
const iso = (j: number, m: number, t: number) => isoDatum(new Date(j, m - 1, t, 12));
const monatsende = (j: number, m: number) => iso(j, m + 1, 0);

/** Vorzeitraum gleicher Länge (bis zum gleichen Tag), höchstens bis zu dessen Ende */
function gleichLang(von: Datum, bis: Datum, vorVon: Datum, vorEnde: Datum): Datum {
  const b = plusTage(vorVon, tageZwischen(von, bis));
  return b > vorEnde ? vorEnde : b;
}

export function zeitraum(art: ZeitraumArt, stichtag: Datum): Zeitraum {
  const { j, m } = teile(stichtag);
  switch (art) {
    case 'monat': {
      const von = iso(j, m, 1);
      const vorVon = iso(j, m - 1, 1);
      const vm = teile(vorVon);
      return {
        von,
        bis: stichtag,
        label: `${MONATE[m - 1]} ${j}`,
        vor: { von: vorVon, bis: gleichLang(von, stichtag, vorVon, monatsende(vm.j, vm.m)), label: `${MONATE[vm.m - 1]} ${vm.j}` },
      };
    }
    case 'vormonat': {
      const von = iso(j, m - 1, 1);
      const v = teile(von);
      const vorVon = iso(v.j, v.m - 1, 1);
      const vv = teile(vorVon);
      return {
        von,
        bis: monatsende(v.j, v.m),
        label: `${MONATE[v.m - 1]} ${v.j}`,
        vor: { von: vorVon, bis: monatsende(vv.j, vv.m), label: `${MONATE[vv.m - 1]} ${vv.j}` },
      };
    }
    case 'quartal': {
      const q = Math.floor((m - 1) / 3);
      const von = iso(j, q * 3 + 1, 1);
      const vorVon = iso(j, q * 3 - 2, 1);
      const v = teile(vorVon);
      const vq = Math.floor((v.m - 1) / 3);
      return {
        von,
        bis: stichtag,
        label: `${q + 1}. Quartal ${j}`,
        vor: { von: vorVon, bis: gleichLang(von, stichtag, vorVon, monatsende(v.j, v.m + 2)), label: `${vq + 1}. Quartal ${v.j}` },
      };
    }
    case 'jahr': {
      const von = iso(j, 1, 1);
      const vorVon = iso(j - 1, 1, 1);
      return {
        von,
        bis: stichtag,
        label: `${j}`,
        vor: { von: vorVon, bis: gleichLang(von, stichtag, vorVon, iso(j - 1, 12, 31)), label: `${j - 1}` },
      };
    }
  }
}

const drin = (d: Datum | undefined, s: Spanne) => !!d && d.slice(0, 10) >= s.von && d.slice(0, 10) <= s.bis;

/** Umsatz netto aus Rechnungen (Rechnungsdatum im Zeitraum) */
export function umsatz(b: Basisdaten, s: Spanne): { netto: Cent; anzahl: number } {
  const r = b.rechnungen.filter((x) => rechnungZaehlt(x) && drin(x.datum, s));
  return { netto: r.reduce((sum, x) => sum + rechnungNetto(x, b.rechnungen), 0), anzahl: r.length };
}

/** Offene Posten zum Stichtag: Brutto-Forderung minus Zahlungen */
export function offenePosten(b: Basisdaten, stichtag: Datum) {
  const ust = ustSatzVon(b);
  let summe = 0;
  let ueberfaellig = 0;
  let anzahl = 0;
  let anzahlUeberfaellig = 0;
  for (const r of b.rechnungen) {
    if (r.status !== 'versendet' && r.status !== 'teilbezahlt') continue;
    if (r.art === 'gutschrift') continue;
    const gezahlt = b.zahlungen.filter((z) => z.rechnungId === r.id && z.datum <= stichtag).reduce((s, z) => s + z.betrag, 0);
    const offen = rechnungBrutto(r, b.rechnungen, ust) - gezahlt;
    if (offen <= 0) continue;
    summe += offen;
    anzahl++;
    if (r.faelligAm < stichtag) {
      ueberfaellig += offen;
      anzahlUeberfaellig++;
    }
  }
  return { summe, anzahl, ueberfaellig, anzahlUeberfaellig };
}

/** Auftragsbestand: angenommene Angebote laufender Aufträge minus bereits Berechnetes */
export function auftragsbestand(b: Basisdaten) {
  let summe = 0;
  let anzahl = 0;
  let ohneAngebot = 0;
  for (const a of b.auftraege) {
    if (!LAUFEND.includes(a.phase)) continue;
    const an = angenommenesAngebot(a.id, b.angebote);
    if (!an) {
      ohneAngebot++;
      continue;
    }
    const wert = summen(an.positionen, 0, an.rabattProzent ?? 0).netto;
    const berechnet = b.rechnungen.filter((r) => r.auftragId === a.id).reduce((s, r) => s + rechnungNetto(r, b.rechnungen), 0);
    summe += Math.max(0, wert - berechnet);
    anzahl++;
  }
  return { summe, anzahl, ohneAngebot };
}

const AUSLASTUNG_ARTEN = ['einsatz', 'wartung', 'besichtigung', 'abnahme'];

/**
 * Auslastung grob: verplante Einsatzstunden ÷ Arbeitszeit des Teams (ohne Büro) an Arbeitstagen
 * (Einstellung `plan.arbeitstage`, ohne gesetzliche Feiertage – siehe `@core/kalender`).
 * Urlaub und Krankheit sind nicht abgezogen.
 */
export function auslastung(b: Basisdaten, s: Spanne): { anteil: number; geplantMinuten: number; kapazitaetMinuten: number } | undefined {
  const team = b.mitarbeiter.filter((m) => m.aktiv && m.rolle !== 'buero' && m.wochenstunden > 0);
  const arbeitstage = betriebsArbeitstage();
  const tage = arbeitstageZwischen(s.von, s.bis, arbeitstage);
  const kapazitaet = team.reduce((sum, m) => sum + (m.wochenstunden / arbeitstage.length) * 60 * tage, 0);
  if (!kapazitaet) return undefined;
  const ids = new Map(team.map((m) => [m.id, m]));
  let geplant = 0;
  for (const t of b.termine) {
    if (t.status === 'abgesagt' || !AUSLASTUNG_ARTEN.includes(t.art) || !drin(t.start, s)) continue;
    for (const id of t.mitarbeiterIds) {
      const m = ids.get(id);
      if (!m) continue;
      geplant += t.ganztags ? (m.wochenstunden / 5) * 60 : Math.max(0, (new Date(t.ende).getTime() - new Date(t.start).getTime()) / 60_000);
    }
  }
  return { anteil: geplant / kapazitaet, geplantMinuten: geplant, kapazitaetMinuten: kapazitaet };
}

/** Angebotsquote: angenommen ÷ entschieden (angenommen, abgelehnt, abgelaufen) im Zeitraum */
export function angebotsquote(b: Basisdaten, s: Spanne): { anteil: number; angenommen: number; entschieden: number } | undefined {
  const entschieden = b.angebote.filter(
    (a) => ['angenommen', 'abgelehnt', 'abgelaufen'].includes(a.status) && drin(a.entschiedenAm ?? (a.status === 'abgelaufen' ? a.gueltigBis : a.datum), s),
  );
  if (!entschieden.length) return undefined;
  const angenommen = entschieden.filter((a) => a.status === 'angenommen').length;
  return { anteil: angenommen / entschieden.length, angenommen, entschieden: entschieden.length };
}

/** Durchschnittliche Zahlungsdauer: Rechnungsdatum bis letzte Zahlung, für im Zeitraum bezahlte Rechnungen */
export function zahlungsdauer(b: Basisdaten, s: Spanne): { tage: number; anzahl: number } | undefined {
  const dauern: number[] = [];
  for (const r of b.rechnungen) {
    if (r.status !== 'bezahlt') continue;
    const zahlungen = b.zahlungen.filter((z) => z.rechnungId === r.id);
    if (!zahlungen.length) continue;
    const letzte = zahlungen.map((z) => z.datum).sort().at(-1)!;
    if (!drin(letzte, s)) continue;
    dauern.push(Math.max(0, tageZwischen(r.datum, letzte)));
  }
  if (!dauern.length) return undefined;
  return { tage: Math.round(dauern.reduce((x, y) => x + y, 0) / dauern.length), anzahl: dauern.length };
}

/** Veränderung zum Vorzeitraum (0.12 = +12 %); `undefined`, wenn es vorher nichts gab */
export function veraenderung(jetzt: number | undefined, vorher: number | undefined): number | undefined {
  if (jetzt == null || vorher == null || vorher === 0) return undefined;
  return jetzt / vorher - 1;
}

export interface Kennzahlen {
  zeitraum: Zeitraum;
  umsatz: { netto: Cent; anzahl: number };
  umsatzVor: { netto: Cent; anzahl: number };
  offen: ReturnType<typeof offenePosten>;
  bestand: ReturnType<typeof auftragsbestand>;
  auslastung?: ReturnType<typeof auslastung>;
  auslastungVor?: ReturnType<typeof auslastung>;
  quote?: ReturnType<typeof angebotsquote>;
  quoteVor?: ReturnType<typeof angebotsquote>;
  zahlung?: ReturnType<typeof zahlungsdauer>;
  zahlungVor?: ReturnType<typeof zahlungsdauer>;
}

export function kennzahlen(b: Basisdaten, art: ZeitraumArt, stichtag: Datum): Kennzahlen {
  const z = zeitraum(art, stichtag);
  return {
    zeitraum: z,
    umsatz: umsatz(b, z),
    umsatzVor: umsatz(b, z.vor),
    offen: offenePosten(b, stichtag),
    bestand: auftragsbestand(b),
    auslastung: auslastung(b, z),
    auslastungVor: auslastung(b, z.vor),
    quote: angebotsquote(b, z),
    quoteVor: angebotsquote(b, z.vor),
    zahlung: zahlungsdauer(b, z),
    zahlungVor: zahlungsdauer(b, z.vor),
  };
}
