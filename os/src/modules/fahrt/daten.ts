/**
 * Fahrt & Route: Entfernungen, Fahrzeiten, Puffer zwischen Einsätzen, Tagesroute.
 *
 * Entfernung: Luftlinie (Haversine) aus `ort.lat/lng`. Fehlen Koordinaten, wird über die
 * Postleitzahl GENÄHERT (Mittelpunkt der PLZ-Leitregion) – das ist eine grobe Schätzung
 * und wird überall so gekennzeichnet. Straßenweg ≈ Luftlinie × 1,3.
 */
import { adresseText, isoDatum, minutenVon, uhrAus } from '@core/format';
import type { Adresse, Datum, ID, Termin } from '@core/objects';
import { einstellung } from '@core/einstellungen';
import { finde, planKontext, type Kontext, type Pruefung } from '../autoplanung/basis';
import { termineAm } from '../verfuegbarkeit/daten';

// ------------------------------------------------------------------ Geo

export interface Punkt {
  /** Anzeige, z. B. "Lindenweg 12, 34117 Kassel" */
  label: string;
  adresse?: Adresse;
  lat?: number;
  lng?: number;
}

export interface Strecke {
  km: number;
  minuten: number;
  /** 'genau' = Koordinaten, 'plz' = grobe Schätzung über Postleitzahl, 'unbekannt' = keine Adresse */
  genauigkeit: 'genau' | 'plz' | 'unbekannt';
}

/** Luftlinie in km zwischen zwei Koordinaten */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** ungefähre Mittelpunkte der deutschen PLZ-Leitregionen (erste zwei Ziffern) */
const PLZ_REGION: Record<string, [number, number]> = {
  '01': [51.05, 13.74], '02': [51.18, 14.42], '03': [51.76, 14.33], '04': [51.34, 12.37], '06': [51.48, 11.97],
  '07': [50.88, 12.08], '08': [50.65, 12.45], '09': [50.83, 12.92], '10': [52.52, 13.4], '12': [52.45, 13.45],
  '13': [52.57, 13.35], '14': [52.4, 13.06], '15': [52.35, 14.3], '16': [52.85, 13.6], '17': [53.56, 13.26],
  '18': [54.09, 12.13], '19': [53.63, 11.4], '20': [53.55, 10.0], '21': [53.4, 10.2], '22': [53.62, 10.05],
  '23': [53.87, 10.69], '24': [54.32, 10.13], '25': [54.0, 9.4], '26': [53.14, 8.21], '27': [53.3, 8.8],
  '28': [53.08, 8.8], '29': [52.8, 10.1], '30': [52.37, 9.73], '31': [52.15, 9.95], '32': [52.12, 8.67],
  '33': [51.9, 8.6], '34': [51.31, 9.48], '35': [50.65, 8.7], '36': [50.55, 9.68], '37': [51.54, 9.93],
  '38': [52.27, 10.52], '39': [52.13, 11.62], '40': [51.23, 6.78], '41': [51.19, 6.44], '42': [51.26, 7.15],
  '44': [51.51, 7.47], '45': [51.46, 7.01], '46': [51.55, 6.85], '47': [51.43, 6.76], '48': [51.96, 7.63],
  '49': [52.28, 8.05], '50': [50.94, 6.96], '51': [50.95, 7.1], '52': [50.78, 6.08], '53': [50.73, 7.1],
  '54': [49.75, 6.64], '55': [49.99, 8.25], '56': [50.36, 7.59], '57': [50.87, 8.02], '58': [51.36, 7.47],
  '59': [51.68, 7.82], '60': [50.11, 8.68], '61': [50.23, 8.62], '63': [50.0, 9.0], '64': [49.87, 8.65],
  '65': [50.08, 8.24], '66': [49.24, 6.99], '67': [49.45, 7.9], '68': [49.49, 8.47], '69': [49.4, 8.69],
  '70': [48.78, 9.18], '71': [48.8, 9.1], '72': [48.5, 9.05], '73': [48.7, 9.6], '74': [49.14, 9.22],
  '75': [48.89, 8.7], '76': [49.01, 8.4], '77': [48.47, 7.94], '78': [47.9, 8.6], '79': [47.99, 7.85],
  '80': [48.14, 11.58], '81': [48.11, 11.6], '82': [47.9, 11.3], '83': [47.86, 12.12], '84': [48.54, 12.15],
  '85': [48.6, 11.6], '86': [48.37, 10.9], '87': [47.73, 10.31], '88': [47.78, 9.61], '89': [48.4, 9.99],
  '90': [49.45, 11.08], '91': [49.6, 10.9], '92': [49.45, 12.0], '93': [49.01, 12.1], '94': [48.57, 13.43],
  '95': [50.0, 11.7], '96': [50.0, 10.9], '97': [49.79, 9.95], '98': [50.61, 10.69], '99': [50.98, 11.03],
};

/** Luftlinie über PLZ geschätzt; undefined, wenn PLZ fehlt/unbekannt */
export function plzNaeherungKm(a: string | undefined, b: string | undefined): number | undefined {
  const pa = (a ?? '').trim();
  const pb = (b ?? '').trim();
  if (!/^\d{5}$/.test(pa) || !/^\d{5}$/.test(pb)) return undefined;
  if (pa === pb) return 2;
  if (pa.slice(0, 3) === pb.slice(0, 3)) return 6;
  if (pa.slice(0, 2) === pb.slice(0, 2)) return 15;
  const ra = PLZ_REGION[pa.slice(0, 2)];
  const rb = PLZ_REGION[pb.slice(0, 2)];
  if (!ra || !rb) return undefined;
  return Math.max(15, haversineKm(ra[0], ra[1], rb[0], rb[1]));
}

const UMWEG = 1.3;

/** Fahrzeit in Minuten für eine Straßenstrecke (Stadt langsamer, Land schneller) + 5 min Parken/Ankommen */
export function fahrminuten(strassenKm: number): number {
  if (strassenKm <= 0.3) return 0;
  const kmh = strassenKm < 15 ? 35 : strassenKm < 50 ? 55 : 75;
  return Math.round((strassenKm / kmh) * 60 + 5);
}

function gleicheAdresse(a?: Adresse, b?: Adresse) {
  return !!a && !!b && a.strasse.trim().toLowerCase() === b.strasse.trim().toLowerCase() && a.plz === b.plz;
}

export function strecke(von: Punkt | undefined, nach: Punkt | undefined): Strecke {
  if (!von || !nach) return { km: 0, minuten: 0, genauigkeit: 'unbekannt' };
  if (von.lat != null && von.lng != null && nach.lat != null && nach.lng != null) {
    const km = haversineKm(von.lat, von.lng, nach.lat, nach.lng) * UMWEG;
    return { km: runde(km), minuten: fahrminuten(km), genauigkeit: 'genau' };
  }
  if (gleicheAdresse(von.adresse, nach.adresse)) return { km: 0, minuten: 0, genauigkeit: 'plz' };
  const luft = plzNaeherungKm(von.adresse?.plz, nach.adresse?.plz);
  if (luft == null) return { km: 0, minuten: 0, genauigkeit: 'unbekannt' };
  const km = luft * UMWEG;
  return { km: runde(km), minuten: fahrminuten(km), genauigkeit: 'plz' };
}

const runde = (x: number) => Math.round(x * 10) / 10;

export function streckeText(s: Strecke): string {
  if (s.genauigkeit === 'unbekannt') return 'Fahrweg unbekannt (Adresse fehlt)';
  if (s.km === 0) return 'gleicher Ort';
  const z = `${s.genauigkeit === 'plz' ? 'ca. ' : ''}${Math.round(s.km)} km · ${s.minuten} min`;
  return s.genauigkeit === 'plz' ? `${z} (grob geschätzt über PLZ)` : z;
}

// ------------------------------------------------------------------ Orte von Terminen

/** Wo findet der Termin statt? Ort → sonst Kundenadresse */
export function terminPunkt(ctx: Kontext, t: Pick<Termin, 'ortId' | 'kundeId' | 'auftragId'>): Punkt | undefined {
  const auftrag = finde(ctx.auftraege, t.auftragId);
  const ort = finde(ctx.orte, t.ortId ?? auftrag?.ortId);
  if (ort?.adresse?.plz || ort?.lat != null) return { label: adresseText(ort.adresse) || ort.bezeichnung, adresse: ort.adresse, lat: ort.lat, lng: ort.lng };
  const kunde = finde(ctx.kunden, t.kundeId ?? auftrag?.kundeId);
  if (kunde?.adresse?.plz) return { label: adresseText(kunde.adresse), adresse: kunde.adresse };
  return undefined;
}

/** Startpunkt eines Mitarbeiters: eigene Startadresse, sonst Betrieb */
export function startPunkt(ctx: Kontext, mitarbeiterId: ID): Punkt | undefined {
  const m = finde(ctx.mitarbeiter, mitarbeiterId);
  if (m?.startAdresse?.plz) return { label: adresseText(m.startAdresse), adresse: m.startAdresse };
  const b = ctx.betrieb?.adresse;
  if (b?.plz) return { label: `Betrieb: ${adresseText(b)}`, adresse: b };
  return undefined;
}

// ------------------------------------------------------------------ Puffer zwischen Einsätzen

/** Mindestpuffer zusätzlich zur Fahrzeit (Minuten) */
export const pufferMinuten = () => einstellung('fahrt.pufferMinuten', 10);

export interface Uebergang {
  von: Termin;
  nach: Termin;
  strecke: Strecke;
  /** Lücke zwischen Ende und Beginn in Minuten (negativ = Überschneidung) */
  luecke: number;
  pruefung: Pruefung;
}

/** Prüft einen Übergang zwischen zwei aufeinanderfolgenden Einsätzen */
export function pruefeUebergang(ctx: Kontext, von: Termin, nach: Termin, puffer = 10): Uebergang {
  const s = strecke(terminPunkt(ctx, von), terminPunkt(ctx, nach));
  const luecke = Math.round((new Date(nach.start).getTime() - new Date(von.ende).getTime()) / 60_000);
  const frueheste = minutenVon(von.ende) + s.minuten + puffer;
  let pruefung: Pruefung;
  if (luecke < 0) {
    pruefung = {
      ergebnis: 'problem',
      text: `„${von.titel}“ und „${nach.titel}“ überschneiden sich um ${-luecke} min.`,
      loesung: `„${nach.titel}“ auf ${uhrAus(frueheste)} Uhr schieben oder jemand anderen schicken.`,
    };
  } else if (s.genauigkeit === 'unbekannt') {
    pruefung = { ergebnis: 'ok', text: `Fahrzeit nach „${nach.titel}“ unbekannt – Adresse fehlt.` };
  } else if (luecke < s.minuten) {
    pruefung = {
      ergebnis: 'problem',
      text: `Nur ${luecke} min bis „${nach.titel}“, Fahrt dauert ${streckeText(s)}.`,
      loesung: `„${nach.titel}“ auf ${uhrAus(frueheste)} Uhr schieben.`,
    };
  } else if (luecke < s.minuten + puffer) {
    pruefung = {
      ergebnis: 'warnung',
      text: `Knapp: ${luecke} min bis „${nach.titel}“, Fahrt ${streckeText(s)}.`,
      loesung: `Mit ${puffer} min Puffer wäre ${uhrAus(frueheste)} Uhr sicher.`,
    };
  } else {
    pruefung = { ergebnis: 'ok', text: `Genug Zeit bis „${nach.titel}“ (${streckeText(s)}).` };
  }
  return { von, nach, strecke: s, luecke, pruefung };
}

/** Alle Übergänge eines Mitarbeiters an einem Tag (nur Termine mit Ort/Auftrag; interne Termine werden übersprungen) */
export function uebergaengeAm(ctx: Kontext, mitarbeiterId: ID, d: Datum, puffer = 10): Uebergang[] {
  const liste = termineAm(mitarbeiterId, d, planKontext(ctx)).filter((t) => !t.ganztags && t.art !== 'intern' && t.art !== 'schulung');
  const r: Uebergang[] = [];
  for (let i = 1; i < liste.length; i++) r.push(pruefeUebergang(ctx, liste[i - 1], liste[i], puffer));
  return r;
}

// ------------------------------------------------------------------ Tagesroute

export interface Stopp {
  termin: Termin;
  punkt?: Punkt;
  /** Anfahrt vom vorherigen Stopp bzw. Start */
  anfahrt: Strecke;
}

export interface Tagesroute {
  mitarbeiterId: ID;
  datum: Datum;
  start?: Punkt;
  stopps: Stopp[];
  kmGesamt: number;
  minutenGesamt: number;
  /** mindestens eine Strecke nur über PLZ geschätzt */
  geschaetzt: boolean;
  mapsLink?: string;
  uebergaenge: Uebergang[];
}

export function tagesroute(ctx: Kontext, mitarbeiterId: ID, d: Datum, puffer = 10): Tagesroute {
  const start = startPunkt(ctx, mitarbeiterId);
  const termine = termineAm(mitarbeiterId, d, planKontext(ctx)).filter((t) => !t.ganztags && t.art !== 'intern' && t.art !== 'schulung');
  let vorher = start;
  const stopps: Stopp[] = termine.map((t) => {
    const punkt = terminPunkt(ctx, t);
    const anfahrt = strecke(vorher, punkt);
    if (punkt) vorher = punkt;
    return { termin: t, punkt, anfahrt };
  });
  const bekannte = stopps.map((s) => s.anfahrt).filter((s) => s.genauigkeit !== 'unbekannt');
  return {
    mitarbeiterId,
    datum: d,
    start,
    stopps,
    kmGesamt: runde(bekannte.reduce((s, x) => s + x.km, 0)),
    minutenGesamt: bekannte.reduce((s, x) => s + x.minuten, 0),
    geschaetzt: bekannte.some((s) => s.genauigkeit === 'plz'),
    mapsLink: mapsRoute(start, stopps.map((s) => s.punkt).filter((p): p is Punkt => !!p)),
    uebergaenge: uebergaengeAm(ctx, mitarbeiterId, d, puffer),
  };
}

const punktText = (p: Punkt) => (p.lat != null && p.lng != null ? `${p.lat},${p.lng}` : p.adresse ? adresseText(p.adresse) : p.label);

/** Google-Maps-Link mit Start, Ziel und Wegpunkten (Reihenfolge bleibt erhalten) */
export function mapsRoute(start: Punkt | undefined, stopps: Punkt[]): string | undefined {
  if (!stopps.length) return undefined;
  const ziel = stopps[stopps.length - 1];
  const zwischen = stopps.slice(0, -1);
  const p = new URLSearchParams({ api: '1', destination: punktText(ziel), travelmode: 'driving' });
  if (start) p.set('origin', punktText(start));
  if (zwischen.length) p.set('waypoints', zwischen.map(punktText).join('|'));
  return `https://www.google.com/maps/dir/?${p.toString()}`;
}

// ------------------------------------------------------------------ Reihenfolge-Vorschlag

export interface Reihenfolge<T> {
  reihenfolge: T[];
  km: number;
  kmBisher: number;
}

/** Nächster-Nachbar-Heuristik: immer zum nächstgelegenen offenen Stopp */
export function naechsterNachbar<T extends { punkt?: Punkt }>(start: Punkt | undefined, stopps: T[]): Reihenfolge<T> {
  const laenge = (folge: T[]) => {
    let km = 0;
    let vorher = start;
    for (const s of folge) {
      km += strecke(vorher, s.punkt).km;
      if (s.punkt) vorher = s.punkt;
    }
    return runde(km);
  };
  const offen = [...stopps];
  const folge: T[] = [];
  let pos = start;
  while (offen.length) {
    let best = 0;
    let bestKm = Infinity;
    offen.forEach((s, i) => {
      const km = pos && s.punkt ? strecke(pos, s.punkt).km : i === 0 ? 0 : Infinity;
      if (km < bestKm) {
        bestKm = km;
        best = i;
      }
    });
    const [n] = offen.splice(best, 1);
    folge.push(n);
    if (n.punkt) pos = n.punkt;
  }
  return { reihenfolge: folge, km: laenge(folge), kmBisher: laenge(stopps) };
}

/** Fahrt-Prüfung für einen Termin: Übergänge vom/zum Nachbartermin jedes eingeplanten Mitarbeiters */
export function pruefeFahrtFuerTermin(ctx: Kontext, t: Termin, puffer = 10): (Pruefung & { mitarbeiterId: ID; uebergang: Uebergang })[] {
  const d = isoDatumVon(t.start);
  return t.mitarbeiterIds.flatMap((m) =>
    uebergaengeAm(ctx, m, d, puffer)
      .filter((u) => u.von.id === t.id || u.nach.id === t.id)
      .map((u) => ({ ...u.pruefung, mitarbeiterId: m, uebergang: u })),
  );
}

const isoDatumVon = (iso: string) => isoDatum(new Date(iso));
