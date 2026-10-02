/**
 * GAEB DA XML (3.x) lesen – Leistungsverzeichnisse aus Ausschreibungen.
 *
 * - X83 Angebotsaufforderung: Positionen mit Menge und Einheit, ohne Preise → du kalkulierst im Angebot.
 * - X84 Angebotsabgabe: zusätzlich Einheitspreise.
 * - X81/X86 (Leistungsbeschreibung, Auftragserteilung) werden ebenso gelesen.
 *
 * Aufbau: `GAEB/Award/BoQ/BoQBody` mit Bereichen (`BoQCtgy`, „Titel“) und Positionen (`Itemlist/Item`).
 * Die Ordnungszahl (OZ) setzt sich aus den `RNoPart` der Ebenen zusammen, z. B. „01.02.0010“.
 * Bedarfspositionen (`Provis`) und Wahlpositionen (`ALNSerNo`) werden als optionale Positionen übernommen –
 * sie zählen nicht zur Angebotssumme.
 */
import { neueId } from '@core/db';
import type { Cent, Einheit, Position } from '@core/objects';
import { einheitAus } from '@modules/artikel/daten';
import { absatzText, alle, kind, wert, xmlLesen, type XmlKnoten } from './xml';

export type LvArt = 'titel' | 'position' | 'bedarf' | 'wahl' | 'hinweis';

export interface LvZeile {
  art: LvArt;
  /** Ordnungszahl, z. B. „01.0010“ */
  oz: string;
  kurztext: string;
  langtext?: string;
  menge: number;
  einheit: Einheit;
  /** Einheit wie in der Datei, z. B. „m2“ */
  einheitRoh?: string;
  /** Einheitspreis (nur X84) */
  einzelpreis?: Cent;
  ebene: number;
}

export interface GaebErgebnis {
  /** Datenaustauschphase: 81, 83, 84, 86 … */
  phase?: string;
  projekt?: string;
  lv?: string;
  zeilen: LvZeile[];
  fehler?: string;
}

export const PHASEN: Record<string, string> = {
  '81': 'Leistungsbeschreibung',
  '82': 'Kostenansatz',
  '83': 'Angebotsaufforderung',
  '84': 'Angebotsabgabe',
  '85': 'Nebenangebot',
  '86': 'Auftragserteilung',
};

const EINHEITEN: Record<string, Einheit> = {
  m2: 'm²', 'm²': 'm²', qm: 'm²',
  m3: 'm³', 'm³': 'm³', cbm: 'm³',
  m: 'm', lfm: 'm', lm: 'm',
  st: 'Stk', stk: 'Stk', 'st.': 'Stk', stck: 'Stk', stück: 'Stk',
  psch: 'Psch', pschal: 'Psch', pauschal: 'Psch', 'psch.': 'Psch',
  h: 'h', std: 'h', 'std.': 'h',
  kg: 'kg', t: 'kg', l: 'l', ltr: 'l',
};

export function gaebEinheit(qu: string | undefined): Einheit {
  const k = (qu ?? '').trim().toLowerCase();
  return EINHEITEN[k] ?? einheitAus(k);
}

const zahl = (s: string) => {
  const n = Number(s.trim().replace(',', '.'));
  return s.trim() && Number.isFinite(n) ? n : undefined;
};

function texte(item: XmlKnoten): { kurz: string; lang: string } {
  const komplett = kind(item, 'Description/CompleteText');
  const kurz = absatzText(kind(komplett, 'OutlineText/OutlTxt/TextOutlTxt')) || absatzText(kind(komplett, 'OutlineText/OutlTxt')) || wert(item, 'Description/OutlineText');
  const lang = absatzText(kind(komplett, 'DetailTxt/Text')) || absatzText(kind(komplett, 'DetailTxt'));
  return { kurz: kurz || lang.split('\n')[0]?.slice(0, 120) || '', lang };
}

/** GAEB-XML lesen. `fehler` ist ein Satz für den Menschen. */
export function gaebLesen(xml: string): GaebErgebnis {
  if (!/^\s*(<\?xml|<)/.test(xml.replace(/^﻿/, ''))) {
    return { zeilen: [], fehler: 'Das ist keine GAEB-XML-Datei. Frag nach einer Datei mit der Endung .X83 oder .X84 (GAEB DA XML).' };
  }
  let wurzel: XmlKnoten;
  try {
    wurzel = xmlLesen(xml);
  } catch {
    return { zeilen: [], fehler: 'Die Datei ist kein lesbares XML.' };
  }
  const gaeb = kind(wurzel, 'GAEB');
  if (!gaeb) return { zeilen: [], fehler: 'Die XML-Datei ist kein GAEB-Leistungsverzeichnis.' };
  const award = kind(gaeb, 'Award');
  const phase = wert(award, 'DP') || wert(gaeb, 'GAEBInfo/DP') || undefined;
  const boq = kind(award, 'BoQ') ?? alle(gaeb, 'BoQ')[0];
  const ergebnis: GaebErgebnis = {
    phase,
    projekt: wert(gaeb, 'PrjInfo/NamePrj') || wert(gaeb, 'PrjInfo/LblPrj') || undefined,
    lv: wert(boq, 'BoQInfo/Name') || wert(boq, 'BoQInfo/LblTx') || undefined,
    zeilen: [],
  };
  if (!boq) return { ...ergebnis, fehler: 'In der Datei steht kein Leistungsverzeichnis.' };

  const gehe = (body: XmlKnoten | undefined, oz: string[], ebene: number) => {
    for (const k of body?.kinder ?? []) {
      if (k.name === 'BoQCtgy') {
        const nr = [...oz, k.attr.RNoPart ?? ''].filter(Boolean);
        ergebnis.zeilen.push({ art: 'titel', oz: nr.join('.'), kurztext: absatzText(kind(k, 'LblTx')) || 'Titel', menge: 0, einheit: 'Psch', ebene });
        gehe(kind(k, 'BoQBody'), nr, ebene + 1);
      } else if (k.name === 'Itemlist') {
        for (const item of k.kinder) {
          const nr = [...oz, item.attr.RNoPart ?? ''].filter(Boolean).join('.');
          const { kurz, lang } = texte(item);
          if (item.name === 'Remark') {
            ergebnis.zeilen.push({ art: 'hinweis', oz: nr, kurztext: kurz || lang, langtext: lang && lang !== kurz ? lang : undefined, menge: 0, einheit: 'Psch', ebene });
            continue;
          }
          if (item.name !== 'Item') continue;
          const provis = wert(item, 'Provis');
          const wahl = Number(wert(item, 'ALNSerNo') || 0) > 0;
          const qu = wert(item, 'QU');
          const up = zahl(wert(item, 'UP'));
          ergebnis.zeilen.push({
            art: provis ? 'bedarf' : wahl ? 'wahl' : 'position',
            oz: nr,
            kurztext: kurz,
            langtext: lang && lang !== kurz ? lang : undefined,
            menge: zahl(wert(item, 'Qty')) ?? zahl(wert(item, 'QtySpec')) ?? 1,
            einheit: gaebEinheit(qu),
            einheitRoh: qu || undefined,
            einzelpreis: up != null ? Math.round(up * 100) : undefined,
            ebene,
          });
        }
      }
    }
  };
  gehe(kind(boq, 'BoQBody'), [], 0);
  if (!ergebnis.zeilen.some((z) => z.art !== 'titel' && z.art !== 'hinweis')) return { ...ergebnis, fehler: 'Im Leistungsverzeichnis stehen keine Positionen.' };
  return ergebnis;
}

/** Wie viele Positionen, wie viele mit Preis, Summe (nur echte Positionen) */
export function lvUeberblick(z: LvZeile[]) {
  const pos = z.filter((x) => x.art === 'position' || x.art === 'bedarf' || x.art === 'wahl');
  const mitPreis = pos.filter((x) => x.einzelpreis != null);
  const summe = pos.filter((x) => x.art === 'position').reduce((s, x) => s + Math.round(x.menge * (x.einzelpreis ?? 0)), 0);
  return { positionen: pos.length, mitPreis: mitPreis.length, optional: pos.length - pos.filter((x) => x.art === 'position').length, summe };
}

const MAX_TEXT = 2000;

/** LV-Zeilen als Angebotspositionen (Titel und Hinweise als Textzeilen, OZ vorangestellt) */
export function alsPositionen(zeilen: LvZeile[], opts: { mitTiteln?: boolean; mitLangtext?: boolean } = {}): Position[] {
  const { mitTiteln = true, mitLangtext = true } = opts;
  const out: Position[] = [];
  for (const z of zeilen) {
    if ((z.art === 'titel' || z.art === 'hinweis') && !mitTiteln) continue;
    const text = `${z.oz ? `${z.oz} ` : ''}${z.kurztext}${mitLangtext && z.langtext ? `\n${z.langtext}` : ''}`.slice(0, MAX_TEXT);
    if (z.art === 'titel' || z.art === 'hinweis') {
      out.push({ id: neueId('p'), art: 'text', text, menge: 0, einheit: 'Psch', einzelpreis: 0 });
      continue;
    }
    out.push({
      id: neueId('p'),
      art: 'leistung',
      text,
      menge: z.menge,
      einheit: z.einheit,
      einzelpreis: z.einzelpreis ?? 0,
      ...(z.art === 'bedarf' || z.art === 'wahl' ? { optional: true } : {}),
    });
  }
  return out;
}

