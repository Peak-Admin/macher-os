/**
 * Kalkulation nach Zuschlagsverfahren – so, wie Handwerker rechnen:
 *   Lohn (Stunden × Lohnkosten) + Gemeinkosten-Zuschlag
 * + Material (EK) + Material-Zuschlag
 * + Fremdleistung
 * = Selbstkosten + Wagnis & Gewinn = Preis.
 * Deckungsbeitrag = Preis − Einzelkosten (Lohn + Material + Fremd).
 */
import { defineCollection, neueId } from '@core/db';
import type { Artikel, Basis, Cent, Einheit, ID, Leistung, Mitarbeiter, Position } from '@core/objects';

export interface KalkZeile {
  id: ID;
  text: string;
  menge: number;
  einheit: Einheit;
  leistungId?: ID;
  /** Arbeitszeit je Einheit in Minuten */
  minuten: number;
  /** Material-EK je Einheit */
  material: Cent;
  /** Fremdleistung (Subunternehmer, Miete) je Einheit */
  fremd: Cent;
}

export interface Kalkulation extends Basis {
  auftragId: ID;
  titel: string;
  zeilen: KalkZeile[];
  /** Lohnkosten je Stunde (Mittellohn inkl. Nebenkosten) */
  lohnkosten: Cent;
  gemeinkostenProzent: number;
  materialZuschlagProzent: number;
  wagnisGewinnProzent: number;
  angebotId?: ID;
  /** Positionen, die beim Übernehmen im Angebot entstanden sind (erneutes Übernehmen ersetzt sie) */
  positionIds?: ID[];
  /** Mengen kamen aus diesen Aufmaßen – deren Positionen ersetzt die Kalkulation im Angebot */
  ausAufmassIds?: ID[];
}

export const kalkulationen = defineCollection<Kalkulation>('kalkulationen');

export interface ZeilenErgebnis {
  id: ID;
  stunden: number;
  lohn: Cent;
  material: Cent;
  fremd: Cent;
  einzelkosten: Cent;
  gemeinkosten: Cent;
  materialZuschlag: Cent;
  selbstkosten: Cent;
  wagnisGewinn: Cent;
  preis: Cent;
  einheitspreis: Cent;
  deckungsbeitrag: Cent;
}

export interface Ergebnis {
  zeilen: ZeilenErgebnis[];
  summe: Omit<ZeilenErgebnis, 'id' | 'einheitspreis'> & { dbProzent: number };
  /** Was eine Stunde Lohn mit allen Zuschlägen kostet */
  verrechnungssatz: Cent;
}

const rund = Math.round;

export function rechneZeile(z: KalkZeile, k: Pick<Kalkulation, 'lohnkosten' | 'gemeinkostenProzent' | 'materialZuschlagProzent' | 'wagnisGewinnProzent'>): ZeilenErgebnis {
  const stunden = (z.menge * z.minuten) / 60;
  const lohn = rund(stunden * k.lohnkosten);
  const material = rund(z.menge * z.material);
  const fremd = rund(z.menge * z.fremd);
  const gemeinkosten = rund((lohn * k.gemeinkostenProzent) / 100);
  const materialZuschlag = rund((material * k.materialZuschlagProzent) / 100);
  const selbstkosten = lohn + gemeinkosten + material + materialZuschlag + fremd;
  const wagnisGewinn = rund((selbstkosten * k.wagnisGewinnProzent) / 100);
  const preis = selbstkosten + wagnisGewinn;
  const einzelkosten = lohn + material + fremd;
  return {
    id: z.id,
    stunden,
    lohn,
    material,
    fremd,
    einzelkosten,
    gemeinkosten,
    materialZuschlag,
    selbstkosten,
    wagnisGewinn,
    preis,
    einheitspreis: z.menge > 0 ? rund(preis / z.menge) : 0,
    deckungsbeitrag: preis - einzelkosten,
  };
}

export function rechne(k: Pick<Kalkulation, 'zeilen' | 'lohnkosten' | 'gemeinkostenProzent' | 'materialZuschlagProzent' | 'wagnisGewinnProzent'>): Ergebnis {
  const zeilen = k.zeilen.map((z) => rechneZeile(z, k));
  const s = (f: keyof Omit<ZeilenErgebnis, 'id'>) => zeilen.reduce((x, z) => x + z[f], 0);
  const preis = s('preis');
  const deckungsbeitrag = s('deckungsbeitrag');
  return {
    zeilen,
    summe: {
      stunden: Math.round(s('stunden') * 100) / 100,
      lohn: s('lohn'),
      material: s('material'),
      fremd: s('fremd'),
      einzelkosten: s('einzelkosten'),
      gemeinkosten: s('gemeinkosten'),
      materialZuschlag: s('materialZuschlag'),
      selbstkosten: s('selbstkosten'),
      wagnisGewinn: s('wagnisGewinn'),
      preis,
      deckungsbeitrag,
      dbProzent: preis > 0 ? Math.round((deckungsbeitrag / preis) * 1000) / 10 : 0,
    },
    verrechnungssatz: rund(k.lohnkosten * (1 + k.gemeinkostenProzent / 100) * (1 + k.wagnisGewinnProzent / 100)),
  };
}

// ------------------------------------------------------------------ Vorbelegung aus echten Betriebsdaten

/** Durchschnittliche Lohnkosten der Ausführenden (ohne Azubis, ohne Büro) */
export function mittellohn(mitarbeiter: Mitarbeiter[]): Cent | undefined {
  const m = mitarbeiter.filter((x) => x.aktiv && (x.rolle === 'monteur' || x.rolle === 'chef') && x.kostensatz > 0);
  if (!m.length) return undefined;
  return rund(m.reduce((s, x) => s + x.kostensatz, 0) / m.length);
}

/**
 * Gemeinkostenzuschlag so, dass Lohnkosten + GK + W&G genau deinen Stundensatz ergeben.
 * stundensatz = lohn × (1 + gk) × (1 + wg)  →  gk = stundensatz / (lohn × (1 + wg)) − 1
 */
export function gkAusStundensatz(stundensatz: Cent, lohn: Cent, wgProzent: number): number {
  if (!lohn || !stundensatz) return 0;
  const gk = stundensatz / (lohn * (1 + wgProzent / 100)) - 1;
  return Math.max(0, Math.round(gk * 1000) / 10);
}

/** Durchschnittlicher Aufschlag VK/EK deiner Artikel */
export function materialAufschlag(artikel: Artikel[]): number | undefined {
  const a = artikel.filter((x) => x.ek > 0 && x.vk > 0);
  if (!a.length) return undefined;
  const avg = a.reduce((s, x) => s + x.vk / x.ek, 0) / a.length - 1;
  return Math.max(0, Math.round(avg * 1000) / 10);
}

export function zeileAusLeistung(l: Leistung, artikel: Artikel[], menge = 1): KalkZeile {
  const mat = (l.material ?? []).reduce((s, m) => s + (artikel.find((a) => a.id === m.artikelId)?.ek ?? 0) * m.menge, 0);
  return { id: neueId('k'), text: l.name, menge, einheit: l.einheit, leistungId: l.id, minuten: l.minuten ?? (l.einheit === 'h' ? 60 : 0), material: rund(mat), fremd: 0 };
}

export function zeileAusArtikel(a: Artikel, menge = 1): KalkZeile {
  return { id: neueId('k'), text: a.name, menge, einheit: a.einheit, minuten: 0, material: a.ek, fremd: 0 };
}

export function leereZeile(): KalkZeile {
  return { id: neueId('k'), text: '', menge: 1, einheit: 'Stk', minuten: 0, material: 0, fremd: 0 };
}

/** Kalkulierte Preise als Angebotspositionen */
export function alsPositionen(k: Kalkulation): Position[] {
  const e = rechne(k);
  return k.zeilen
    .filter((z) => z.menge > 0)
    .map((z) => {
      const r = e.zeilen.find((x) => x.id === z.id)!;
      return { id: neueId('p'), art: z.leistungId ? 'leistung' : 'pauschal', text: z.text || 'Position', menge: z.menge, einheit: z.einheit, einzelpreis: r.einheitspreis, leistungId: z.leistungId } satisfies Position;
    });
}
