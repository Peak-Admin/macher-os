/**
 * Magic Setup: eine einzige Frage – „Welcher Betrieb bist du?“. Aus der Website liest Macher Firmendaten,
 * Logo, Gewerk und Leistungen und richtet den Betrieb aus der passenden Gewerk-Vorlage ein. Ohne Website
 * genügt ein Tipp aufs Gewerk. Alles Weitere (Briefkopf prüfen, Kunden & Preise, Team) fragt Macher erst,
 * wenn es gebraucht wird (Just-in-Time Setup, siehe `docs/os/ONBOARDING.md`).
 *
 * Reine Logik: Briefkopf-Entwurf (KI über `/api/ki/briefkopf`), Bundesland aus PLZ, Kunden aus
 * Excel/CSV (Vorlagen gängiger Programme) und Handy-Kontakten mit Dubletten-Zusammenführung,
 * Preisliste (KI über `/api/ki/preisliste`) oder Gewerk-Vorlage mit Regler, Team-Einladung, Messung.
 */
import { appPfad } from '@core/basis';
import { alleSammlungen, batch, db, sammlung, type Neu } from '@core/db';
import { cloud, cloudAktiv } from '@core/cloud';
import { setzeEinstellung, einstellung } from '@core/einstellungen';
import { emit } from '@core/events';
import { GEWERKE, VORLAGE_KEY, gewerkVorlage, vorlageFuer, type FachrichtungId, type LeistungVorlage, type Vorlage } from '@core/gewerke';
import type { Bundesland } from '@core/kalender';
import { automationAn, setzeAutomation } from '@core/macher';
import { messen } from '@core/messung';
import { alleAutomationen, alleModule } from '@core/modul';
import type { Gewerk, ID, Kunde, Rolle } from '@core/objects';
import { beispieleEntfernen, einrichten, preisAnpassen, sicherungVerwerfen } from '@core/seed';
import { checklistenVorlagen } from '@modules/checklisten/daten';
import { feldvorlagenAnwenden } from '@modules/felder/daten';
import { dublettenGruende, normEmail, normTelefon } from '@modules/kunden/daten';
import { istXlsx, xlsxZeilen } from './xlsx';

// ------------------------------------------------------------------ Ablauf

/** Bildschirme des Magic Setup. „konto“ erscheint nur, wenn Konten verbunden sind und noch keins besteht. */
export const SCHRITTE = [
  { id: 'konto', titel: 'Konto' },
  { id: 'website', titel: 'Betrieb finden' },
  { id: 'gefunden', titel: 'Betrieb prüfen' },
  { id: 'gewerk', titel: 'Gewerk' },
] as const;
export type SchrittId = (typeof SCHRITTE)[number]['id'];

/** Name eines Betriebs ohne Website – der Briefkopf-Check vor dem ersten Dokument fragt danach */
export { PLATZHALTER_NAME } from '@modules/start/daten';

// ------------------------------------------------------------------ Briefkopf

export interface BriefkopfEntwurf {
  name: string;
  /** Vor- und Nachname des Chefs */
  inhaber: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  steuernummer: string;
  ustId: string;
  iban: string;
  bic: string;
  /** 0 = Standard (14 Tage) */
  zahlungszielTage: number;
  /** Netto-Stundensatz in Euro, 0 = aus Gewerk-Vorlage */
  stundensatz: number;
  /** Logo als Data-URL */
  logo?: string;
}

export const LEERER_BRIEFKOPF: BriefkopfEntwurf = {
  name: '',
  inhaber: '',
  strasse: '',
  plz: '',
  ort: '',
  telefon: '',
  email: '',
  steuernummer: '',
  ustId: '',
  iban: '',
  bic: '',
  zahlungszielTage: 0,
  stundensatz: 0,
};

/** Was die Server-Funktion liefert (siehe `src/lib/ki/briefkopf.ts`, Route `/api/ki/briefkopf`) */
export interface BriefkopfErkannt {
  name: string;
  inhaber: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  steuernummer: string;
  ustId: string;
  iban: string;
  bic: string;
  zahlungszielTage: number;
  stundensatz: number;
  logo: { gefunden: boolean; x: number; y: number; breite: number; hoehe: number };
  /** Logo von der Website (Data-URL) */
  logoBild?: string;
  /** Gewerk laut Website (leer = nicht eindeutig); ältere Server liefern es nicht */
  gewerk?: string;
  /** Leistungen, die der Betrieb auf seiner Website nennt */
  leistungen?: string[];
}

// ------------------------------------------------------------------ Gewerk erkennen (Regeln vor KI)

/** Stichworte je Gewerk – Reihenfolge = Vorrang (spezielle vor allgemeinen) */
const GEWERK_WORTE: [Gewerk, RegExp][] = [
  ['shk', /sanit[äa]r|heizung|\bshk\b|klima|installateur|bad(sanierung|planung)|w[äa]rmepumpe/],
  ['elektro', /elektr|photovoltaik|\bpv\b|wallbox|smart ?home/],
  ['maler', /maler|lackier|anstrich|tapezier|fassadengestalt/],
  ['dach', /dachdeck|bedachung|zimmer(ei|er)|spengler|klempner/],
  ['fliesen', /fliese|platten|naturstein/],
  ['tischler', /tischler|schreiner|fensterbau|innenausbau|m[öo]belbau/],
  ['garten', /garten|landschaftsbau|galabau|pflaster/],
  ['metall', /metallbau|schlosser|stahlbau|schmied|edelstahl/],
  ['bau', /bauunternehm|hochbau|maurer|trockenbau|beton|estrich|rohbau|\bbau\b/],
];

/** Gewerk aus Name und Leistungen ableiten – nur bei eindeutigem Treffer, sonst undefined */
export function gewerkAusText(...texte: (string | undefined)[]): Gewerk | undefined {
  const t = texte.filter(Boolean).join(' ').toLowerCase();
  return GEWERK_WORTE.find(([, w]) => w.test(t))?.[0];
}

/** Feinere Vorlage aus den Leistungen (Solar bei Elektro, Fensterbau bei Tischler, Reinigung bei „Anderes“) */
export function fachrichtungAusText(gewerk: Gewerk, ...texte: (string | undefined)[]): FachrichtungId | undefined {
  const t = texte.filter(Boolean).join(' ').toLowerCase();
  if (gewerk === 'elektro' && /photovoltaik|\bpv\b|solar/.test(t)) return 'solar';
  if (gewerk === 'tischler' && /fenster/.test(t)) return 'fensterbau';
  if (gewerk === 'sonstiges' && /reinigung/.test(t)) return 'reinigung';
  return undefined;
}

/** Was die Website ergeben hat: KI-Gewerk zuerst, sonst Stichworte aus Name und Leistungen */
export function vorlageErkennen(e: Pick<BriefkopfErkannt, 'name'> & { gewerk?: string; leistungen?: string[] }): { gewerk?: Gewerk; fachrichtung?: FachrichtungId } {
  const ki = GEWERKE.find((g) => g.id === e.gewerk)?.id;
  const gewerk = ki ?? gewerkAusText(e.name, ...(e.leistungen ?? []));
  return { gewerk, fachrichtung: gewerk ? fachrichtungAusText(gewerk, e.name, ...(e.leistungen ?? [])) : undefined };
}

/** Adresse wie „maler-mueller.de“ für die Anzeige */
export function websiteAnzeige(eingabe: string): string {
  return eingabe.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
}

/** „Max Müller“ → Vorname/Nachname; „Dipl.-Ing. Max Müller“ → ohne Titel */
export function nameTeilen(name: string): { vorname: string; nachname: string } {
  const teile = name
    .replace(/\b(herr|frau|dipl\.?-?\w*\.?|dr\.?|prof\.?|ing\.?|meister)\s+/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!teile.length) return { vorname: '', nachname: '' };
  if (teile.length === 1) return { vorname: teile[0], nachname: '' };
  return { vorname: teile.slice(0, -1).join(' '), nachname: teile[teile.length - 1] };
}

/** Erkanntes über den bisherigen Entwurf legen – nur, was wirklich erkannt wurde */
export function entwurfAusErkannt(e: BriefkopfErkannt, bisher: BriefkopfEntwurf): BriefkopfEntwurf {
  const n = { ...bisher };
  const setze = <K extends keyof BriefkopfEntwurf>(k: K, v: BriefkopfEntwurf[K] | undefined) => {
    if (v) n[k] = v;
  };
  setze('name', e.name);
  setze('strasse', e.strasse);
  setze('plz', e.plz);
  setze('ort', e.ort);
  setze('telefon', e.telefon);
  setze('email', e.email);
  setze('steuernummer', e.steuernummer);
  setze('ustId', e.ustId);
  setze('iban', e.iban);
  setze('bic', e.bic);
  setze('zahlungszielTage', e.zahlungszielTage);
  setze('stundensatz', e.stundensatz);
  if (e.inhaber && !bisher.inhaber.trim()) n.inhaber = e.inhaber;
  return n;
}

/** Was fehlt noch für einen vollständigen Briefkopf? (PRD: Name, Anschrift, Logo, Steuernummer, Bank) */
export function briefkopfLuecken(b: BriefkopfEntwurf): string[] {
  const l: string[] = [];
  if (!b.name.trim()) l.push('Name');
  if (!b.strasse.trim() || !b.plz.trim() || !b.ort.trim()) l.push('Anschrift');
  if (!b.steuernummer.trim() && !b.ustId.trim()) l.push('Steuernummer');
  if (!b.iban.trim()) l.push('Bankverbindung');
  if (!b.logo) l.push('Logo');
  return l;
}

export function briefkopfPruefen(b: BriefkopfEntwurf): string | undefined {
  if (!b.name.trim()) return 'Trage den Namen deines Betriebs ein.';
  if (!b.inhaber.trim()) return 'Trage deinen Namen ein.';
  if (b.plz.trim() && !/^\d{5}$/.test(b.plz.trim())) return 'Die Postleitzahl hat fünf Ziffern.';
  if (b.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim())) return 'Die E-Mail-Adresse sieht unvollständig aus.';
  const iban = b.iban.replace(/\s/g, '');
  if (iban && !ibanGueltig(iban)) return 'Die IBAN stimmt nicht. Prüfe sie bitte noch einmal.';
  return undefined;
}

/** IBAN-Prüfsumme (ISO 13616, mod 97) */
export function ibanGueltig(iban: string): boolean {
  const i = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(i)) return false;
  const umgestellt = (i.slice(4) + i.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const z of umgestellt) rest = (rest * 10 + Number(z)) % 97;
  return rest === 1;
}

// ------------------------------------------------------------------ Bundesland aus PLZ

/** Leitregion (2 Ziffern) → Bundesland; Ausnahmen über 3 Ziffern. Grenzfälle am Rand bleiben möglich. */
const PLZ2: Record<string, Bundesland> = {
  '01': 'SN', '02': 'SN', '03': 'BB', '04': 'SN', '06': 'ST', '07': 'TH', '08': 'SN', '09': 'SN',
  '10': 'BE', '12': 'BE', '13': 'BE', '14': 'BB', '15': 'BB', '16': 'BB', '17': 'MV', '18': 'MV', '19': 'MV',
  '20': 'HH', '21': 'NI', '22': 'HH', '23': 'SH', '24': 'SH', '25': 'SH', '26': 'NI', '27': 'NI', '28': 'HB', '29': 'NI',
  '30': 'NI', '31': 'NI', '32': 'NW', '33': 'NW', '34': 'HE', '35': 'HE', '36': 'HE', '37': 'NI', '38': 'NI', '39': 'ST',
  '40': 'NW', '41': 'NW', '42': 'NW', '44': 'NW', '45': 'NW', '46': 'NW', '47': 'NW', '48': 'NW', '49': 'NI',
  '50': 'NW', '51': 'NW', '52': 'NW', '53': 'NW', '54': 'RP', '55': 'RP', '56': 'RP', '57': 'NW', '58': 'NW', '59': 'NW',
  '60': 'HE', '61': 'HE', '63': 'HE', '64': 'HE', '65': 'HE', '66': 'SL', '67': 'RP', '68': 'BW', '69': 'BW',
  '70': 'BW', '71': 'BW', '72': 'BW', '73': 'BW', '74': 'BW', '75': 'BW', '76': 'BW', '77': 'BW', '78': 'BW', '79': 'BW',
  '80': 'BY', '81': 'BY', '82': 'BY', '83': 'BY', '84': 'BY', '85': 'BY', '86': 'BY', '87': 'BY', '88': 'BW', '89': 'BW',
  '90': 'BY', '91': 'BY', '92': 'BY', '93': 'BY', '94': 'BY', '95': 'BY', '96': 'BY', '97': 'BY', '98': 'TH', '99': 'TH',
};
const PLZ3: Record<string, Bundesland> = {
  '019': 'BB', '046': 'TH', '140': 'BE', '141': 'BE', '172': 'BB', '193': 'BB',
  '210': 'HH', '211': 'HH', '228': 'SH', '229': 'SH', '275': 'HB', '276': 'HB', '287': 'NI', '288': 'NI', '289': 'NI',
  '364': 'TH', '372': 'HE', '373': 'TH', '388': 'ST', '389': 'ST',
  '534': 'RP', '535': 'RP', '575': 'RP', '576': 'RP',
  '637': 'BY', '638': 'BY', '639': 'BY', '668': 'RP', '669': 'RP', '685': 'HE', '694': 'HE',
  '881': 'BY', '892': 'BY', '893': 'BY', '894': 'BY', '978': 'BW', '979': 'BW',
};

export function bundeslandAusPlz(plz: string): Bundesland | undefined {
  const p = plz.trim();
  if (!/^\d{5}$/.test(p)) return undefined;
  return PLZ3[p.slice(0, 3)] ?? PLZ2[p.slice(0, 2)];
}

// ------------------------------------------------------------------ KI-Erkennung (Server-Funktionen)

export type KiErgebnis<T> = { ok: true; wert: T } | { ok: false; art: 'nicht-verbunden' | 'fehler'; fehler: string };

/** Ruft eine Server-Funktion auf. 501/404/kein JSON = nicht verbunden → der Browser zeigt den Rückfall. */
export async function kiAufruf<T>(pfad: string, body: unknown, f: typeof fetch = fetch): Promise<KiErgebnis<T>> {
  let r: Response;
  try {
    r = await f(pfad, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    return { ok: false, art: 'fehler', fehler: 'Keine Verbindung. Prüfe dein Internet oder trag die Daten von Hand ein.' };
  }
  const istJson = (r.headers.get('content-type') ?? '').includes('json');
  if (r.status === 501 || r.status === 404 || r.status === 405 || !istJson)
    return { ok: false, art: 'nicht-verbunden', fehler: 'Das automatische Lesen ist hier noch nicht eingerichtet.' };
  const daten = (await r.json().catch(() => ({}))) as { fehler?: string } & Record<string, unknown>;
  if (!r.ok) return { ok: false, art: 'fehler', fehler: daten.fehler ?? 'Das hat nicht geklappt. Versuche es noch einmal.' };
  return { ok: true, wert: daten as T };
}

export async function briefkopfErkennen(eingabe: { bild: { daten: string; mime: string } } | { website: string }, f?: typeof fetch): Promise<KiErgebnis<BriefkopfErkannt>> {
  const r = await kiAufruf<{ briefkopf: BriefkopfErkannt }>('/api/ki/briefkopf', eingabe, f);
  return r.ok ? { ok: true, wert: r.wert.briefkopf } : r;
}

export interface PreisErkannt {
  name: string;
  einheit: LeistungVorlage['einheit'];
  preis: number;
  kategorie: string;
}

export async function preislisteErkennen(datei: { daten: string; mime: string }, f?: typeof fetch): Promise<KiErgebnis<PreisErkannt[]>> {
  const r = await kiAufruf<{ leistungen: PreisErkannt[] }>('/api/ki/preisliste', { datei }, f);
  return r.ok ? { ok: true, wert: r.wert.leistungen ?? [] } : r;
}

export interface KundeErkannt {
  name: string;
  firma: string;
  telefon: string;
  email: string;
  strasse: string;
  plz: string;
  ort: string;
}

/** Foto/PDF einer Kundenliste → Kunden (Server-Funktion `/api/ki/kundenliste`) */
export async function kundenlisteErkennen(datei: { daten: string; mime: string }, f?: typeof fetch): Promise<KiErgebnis<Neu<Kunde>[]>> {
  const r = await kiAufruf<{ kunden: KundeErkannt[] }>('/api/ki/kundenliste', { datei }, f);
  return r.ok ? { ok: true, wert: kundenAusErkannt(r.wert.kunden ?? []) } : r;
}

export function kundenAusErkannt(liste: KundeErkannt[]): Neu<Kunde>[] {
  return liste
    .filter((k) => k.name?.trim())
    .map((k) => ({
      art: k.firma ? 'firma' : 'privat',
      name: k.name.trim(),
      firma: k.firma || undefined,
      telefon: k.telefon || undefined,
      email: k.email || undefined,
      adresse: k.strasse || k.plz || k.ort ? { strasse: k.strasse, plz: k.plz, ort: k.ort } : undefined,
      ansprechpartner: [],
      quelle: 'sonstiges',
    }));
}

/** Data-URL → { daten (base64), mime } */
export function base64Aus(dataUrl: string): { daten: string; mime: string } {
  const m = /^data:([^;,]+)[^,]*,(.*)$/.exec(dataUrl);
  return { mime: m?.[1] ?? 'application/octet-stream', daten: m?.[2] ?? '' };
}

/** Logo aus dem Foto ausschneiden (Anteile 0–1), etwas Rand dazu, höchstens 600 px breit */
export async function logoAusschneiden(bildUrl: string, b: BriefkopfErkannt['logo']): Promise<string | undefined> {
  if (!b.gefunden) return undefined;
  const img = new Image();
  await new Promise<void>((ok, fehler) => {
    img.onload = () => ok();
    img.onerror = () => fehler(new Error('Bild nicht lesbar'));
    img.src = bildUrl;
  });
  const rand = 0.01;
  const x = Math.max(0, b.x - rand) * img.naturalWidth;
  const y = Math.max(0, b.y - rand) * img.naturalHeight;
  const w = Math.min(1 - Math.max(0, b.x - rand), b.breite + 2 * rand) * img.naturalWidth;
  const h = Math.min(1 - Math.max(0, b.y - rand), b.hoehe + 2 * rand) * img.naturalHeight;
  if (w < 8 || h < 8) return undefined;
  const faktor = Math.min(1, 600 / w);
  const c = document.createElement('canvas');
  c.width = Math.round(w * faktor);
  c.height = Math.round(h * faktor);
  const ctx = c.getContext('2d');
  if (!ctx) return undefined;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, x, y, w, h, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

// ------------------------------------------------------------------ Kunden übernehmen

export interface KundenImport {
  kunden: Neu<Kunde>[];
  /** erkannte Vorlage, z. B. „sevDesk“ */
  vorlage?: string;
  /** wie viele doppelte Einträge zusammengeführt wurden */
  zusammengefuehrt: number;
  /** verständliche Hinweise, z. B. „Zeile 4: kein Name – übersprungen.“ */
  hinweise: string[];
  fehler?: string;
}

const norm = (t: string) =>
  t
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');

/**
 * Spaltennamen gängiger Exporte (normalisiert). Exakte Treffer zuerst, dann „beginnt mit“
 * (z. B. „Telefon (geschäftlich)“ → telefon). Mehrere Spalten je Feld: die erste gefüllte zählt.
 */
const SPALTEN: Record<string, { exakt: string[]; beginnt?: string[] }> = {
  name: { exakt: ['name', 'kunde', 'kundenname', 'name1', 'anzeigename', 'vollername'] },
  person: { exakt: ['ansprechpartner', 'kontakt', 'kontaktname', 'kontaktperson'] },
  vorname: { exakt: ['vorname', 'firstname'], beginnt: ['vorname'] },
  nachname: { exakt: ['nachname', 'familienname', 'lastname', 'name2'], beginnt: ['nachname'] },
  firma: { exakt: ['firma', 'firmenname', 'unternehmen', 'company', 'organisation', 'organization', 'firma1', 'unternehmensname'], beginnt: ['firmenname', 'organisation'] },
  telefon: { exakt: ['telefon', 'tel', 'telefonnummer', 'fon', 'phone', 'telefon1', 'mobil', 'handy', 'mobiltelefon', 'mobilnummer', 'handynummer'], beginnt: ['telefon', 'mobil', 'handy'] },
  email: { exakt: ['email', 'mail', 'emailadresse', 'email1', 'emailaddress'], beginnt: ['email'] },
  strasse: { exakt: ['strasse', 'str', 'strassehausnummer', 'strassehausnr', 'strasseundhausnummer', 'adresse', 'anschrift', 'street', 'adresszeile1'], beginnt: ['strasse', 'rechnungsstrasse'] },
  hausnummer: { exakt: ['hausnummer', 'hausnr'] },
  plz: { exakt: ['plz', 'postleitzahl', 'zip'], beginnt: ['plz', 'postleitzahl'] },
  ort: { exakt: ['ort', 'stadt', 'wohnort', 'city'], beginnt: ['ortrechnung', 'stadt'] },
  nummer: { exakt: ['nummer', 'kundennummer', 'kdnr', 'kundennr', 'nr', 'debitorennummer', 'debitor', 'kontaktnummer'], beginnt: ['kundennummer', 'kundennr'] },
  notiz: { exakt: ['notiz', 'bemerkung', 'bemerkungen', 'info', 'hinweis', 'beschreibung', 'notizen'] },
};

/** Vorlagen gängiger Programme – erkannt an typischen Spalten */
export const KUNDEN_VORLAGEN: { id: string; label: string; erkennen: (k: string[]) => boolean }[] = [
  { id: 'sevdesk', label: 'sevDesk', erkennen: (k) => k.includes('organisation') || (k.includes('kundennr') && k.includes('kategorie')) },
  { id: 'lexware', label: 'Lexware', erkennen: (k) => k.some((x) => x.startsWith('firmenname')) || k.some((x) => x.includes('rechnungsadresse')) || (k.includes('kundennr') && k.includes('firma')) },
  { id: 'kontakte', label: 'Kontakte-Export', erkennen: (k) => k.includes('firstname') || k.includes('emailaddress') },
  { id: 'excel', label: 'Excel-Liste', erkennen: () => true },
];

function spaltenFinden(kopf: string[]): Record<string, number[]> {
  const index: Record<string, number[]> = {};
  const vergeben = new Set<number>();
  // erst exakte Treffer für alle Felder, dann „beginnt mit“ – so schnappt „telefon…“ nicht „telefon“ weg
  for (const runde of ['exakt', 'beginnt'] as const) {
    for (const [feld, regel] of Object.entries(SPALTEN)) {
      kopf.forEach((u, i) => {
        if (vergeben.has(i) || !u) return;
        const passt = runde === 'exakt' ? regel.exakt.includes(u) : (regel.beginnt ?? []).some((b) => u.startsWith(b));
        if (passt) {
          (index[feld] ??= []).push(i);
          vergeben.add(i);
        }
      });
    }
  }
  return index;
}

/** Zeilen (erste = Überschriften) → Kunden, mit Vorlagen-Erkennung und Dubletten-Zusammenführung */
export function kundenAusZeilen(zeilen: string[][]): KundenImport {
  const gefuellt = zeilen.filter((z) => z.some((f) => f && f.trim()));
  if (gefuellt.length < 2) return { kunden: [], zusammengefuehrt: 0, hinweise: [], fehler: 'Die Datei enthält keine Kunden. Die erste Zeile braucht Überschriften, darunter je Zeile ein Kunde.' };
  const kopf = gefuellt[0].map((u) => norm(u ?? ''));
  const index = spaltenFinden(kopf);
  if (!index.name && !index.nachname && !index.firma && !index.person)
    return { kunden: [], zusammengefuehrt: 0, hinweise: [], fehler: 'Keine Spalte für den Namen gefunden. Die erste Zeile braucht Überschriften wie Name, Telefon, E-Mail, Straße, PLZ, Ort.' };
  const vorlage = KUNDEN_VORLAGEN.find((v) => v.erkennen(kopf))?.label;

  const roh: Neu<Kunde>[] = [];
  const hinweise: string[] = [];
  gefuellt.slice(1).forEach((f, n) => {
    const wert = (k: string) => (index[k] ?? []).map((i) => f[i]?.trim()).find(Boolean) || undefined;
    const person = [wert('vorname'), wert('nachname')].filter(Boolean).join(' ') || wert('person');
    const firma = wert('firma');
    const name = wert('name') ?? firma ?? person;
    if (!name) {
      hinweise.push(`Zeile ${n + 2}: kein Name – übersprungen.`);
      return;
    }
    const strasse = [wert('strasse'), wert('hausnummer')].filter(Boolean).join(' ') || undefined;
    const plz = wert('plz');
    const ort = wert('ort');
    const telefon = wert('telefon');
    const email = wert('email');
    roh.push({
      art: firma ? 'firma' : 'privat',
      name,
      firma,
      telefon,
      email,
      adresse: strasse || plz || ort ? { strasse: strasse ?? '', plz: plz ?? '', ort: ort ?? '' } : undefined,
      nummer: wert('nummer'),
      notiz: wert('notiz'),
      ansprechpartner: firma && person && person !== name ? [{ id: 'ap1', name: person, telefon, email }] : [],
      quelle: 'sonstiges',
    });
  });
  const { kunden, zusammengefuehrt } = dublettenZusammenfuehren(roh);
  return { kunden, vorlage, zusammengefuehrt, hinweise };
}

/** Eine CSV-Datei in Zeilen zerlegen (Trenner ; , oder Tab; Anführungszeichen, Zeilenumbrüche im Feld) */
export function csvZeilen(text: string): string[][] {
  const t = text.replace(/^﻿/, '');
  const ersteZeile = t.split(/\r?\n/, 1)[0] ?? '';
  const trenner = [';', '\t', ','].sort((a, b) => ersteZeile.split(b).length - ersteZeile.split(a).length)[0];
  const zeilen: string[][] = [];
  let zeile: string[] = [];
  let feld = '';
  let inQuote = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuote) {
      if (c === '"' && t[i + 1] === '"') (feld += '"'), i++;
      else if (c === '"') inQuote = false;
      else feld += c;
    } else if (c === '"') inQuote = true;
    else if (c === trenner) zeile.push(feld.trim()), (feld = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      zeile.push(feld.trim());
      zeilen.push(zeile);
      zeile = [];
      feld = '';
    } else feld += c;
  }
  if (feld || zeile.length) zeile.push(feld.trim()), zeilen.push(zeile);
  return zeilen;
}

export function kundenAusCsv(text: string): KundenImport {
  return kundenAusZeilen(csvZeilen(text));
}

/** Text einer CSV: UTF-8, sonst Windows-1252 (ältere Lexware-/Excel-Exporte) */
export function textDekodieren(daten: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(daten);
  } catch {
    return new TextDecoder('windows-1252').decode(daten);
  }
}

/** Bytes einer Datei (ältere Browser/jsdom kennen `Blob.arrayBuffer` nicht) */
function bytes(b: Blob): Promise<ArrayBuffer> {
  if (typeof b.arrayBuffer === 'function') return b.arrayBuffer();
  return new Promise((ok, fehler) => {
    const r = new FileReader();
    r.onload = () => ok(r.result as ArrayBuffer);
    r.onerror = () => fehler(r.error);
    r.readAsArrayBuffer(b);
  });
}

/** Excel (.xlsx) oder CSV lesen */
export async function kundenAusDatei(datei: Blob & { name?: string }): Promise<KundenImport> {
  try {
    const daten = await bytes(datei);
    if (istXlsx(daten)) return kundenAusZeilen(await xlsxZeilen(daten));
    if (/\.xls$/i.test(datei.name ?? '')) return { kunden: [], zusammengefuehrt: 0, hinweise: [], fehler: 'Alte Excel-Dateien (.xls) kann Macher nicht lesen. Speichere die Liste als .xlsx oder CSV.' };
    return kundenAusCsv(textDekodieren(daten));
  } catch (e) {
    return { kunden: [], zusammengefuehrt: 0, hinweise: [], fehler: e instanceof Error && e.message ? e.message : 'Die Datei konnte nicht gelesen werden. Speichere sie als CSV und versuche es erneut.' };
  }
}

// ---- Handy-Kontakte (Contact Picker API, Android/Chrome)

export interface HandyKontakt {
  name?: string[];
  tel?: string[];
  email?: string[];
  address?: { addressLine?: string[]; postalCode?: string; city?: string }[];
}

interface ContactsManager {
  select(props: string[], opts?: { multiple?: boolean }): Promise<HandyKontakt[]>;
  getProperties?(): Promise<string[]>;
}

const kontaktManager = (): ContactsManager | undefined => (globalThis.navigator as unknown as { contacts?: ContactsManager } | undefined)?.contacts;

export const kontakteVerfuegbar = () => typeof kontaktManager()?.select === 'function';

export function kundenAusKontakten(kontakte: HandyKontakt[]): Neu<Kunde>[] {
  return kontakte
    .map((k): Neu<Kunde> | undefined => {
      const name = k.name?.find((n) => n?.trim())?.trim();
      if (!name) return undefined;
      const a = k.address?.[0];
      const strasse = a?.addressLine?.filter(Boolean).join(', ') ?? '';
      return {
        art: 'privat',
        name,
        telefon: k.tel?.find(Boolean),
        email: k.email?.find(Boolean),
        adresse: strasse || a?.postalCode || a?.city ? { strasse, plz: a?.postalCode ?? '', ort: a?.city ?? '' } : undefined,
        ansprechpartner: [],
        quelle: 'telefon',
      };
    })
    .filter((k): k is Neu<Kunde> => !!k);
}

export async function kontakteWaehlen(): Promise<Neu<Kunde>[]> {
  const m = kontaktManager();
  if (!m) return [];
  const verfuegbar = (await m.getProperties?.().catch(() => undefined)) ?? ['name', 'tel', 'email'];
  const felder = ['name', 'tel', 'email', 'address'].filter((f) => verfuegbar.includes(f));
  return kundenAusKontakten(await m.select(felder, { multiple: true }));
}

// ---- Dubletten: dieselbe Logik wie im Kundenstamm (`@modules/kunden/daten`)

function ergaenzen(ziel: Neu<Kunde>, q: Neu<Kunde>): Neu<Kunde> {
  const n = { ...ziel };
  n.firma ||= q.firma;
  n.telefon ||= q.telefon;
  n.email ||= q.email;
  n.nummer ||= q.nummer;
  if (q.adresse && (!n.adresse || !n.adresse.strasse)) n.adresse = q.adresse;
  if (q.notiz && q.notiz !== n.notiz) n.notiz = [n.notiz, q.notiz].filter(Boolean).join('\n');
  // zweite Nummer bleibt erreichbar, statt verloren zu gehen
  if (q.telefon && n.telefon && normTelefon(q.telefon) !== normTelefon(n.telefon) && !n.ansprechpartner.some((a) => normTelefon(a.telefon) === normTelefon(q.telefon)))
    n.ansprechpartner = [...n.ansprechpartner, { id: `ap${n.ansprechpartner.length + 1}`, name: q.name, telefon: q.telefon, email: normEmail(q.email) !== normEmail(n.email) ? q.email : undefined }];
  for (const ap of q.ansprechpartner) if (!n.ansprechpartner.some((x) => x.name === ap.name)) n.ansprechpartner = [...n.ansprechpartner, { ...ap, id: `ap${n.ansprechpartner.length + 1}` }];
  if (n.art === 'privat' && q.art !== 'privat') n.art = q.art;
  return n;
}

/** Doppelte Einträge (gleiche Telefonnummer, E-Mail, Name …) zu einem Kunden zusammenführen */
export function dublettenZusammenfuehren(liste: Neu<Kunde>[]): { kunden: Neu<Kunde>[]; zusammengefuehrt: number } {
  const kunden: Neu<Kunde>[] = [];
  let zusammengefuehrt = 0;
  for (const k of liste) {
    const i = kunden.findIndex((x) => dublettenGruende(x, k).length > 0);
    if (i >= 0) {
      kunden[i] = ergaenzen(kunden[i], k);
      zusammengefuehrt++;
    } else kunden.push({ ...k, ansprechpartner: [...k.ansprechpartner] });
  }
  return { kunden, zusammengefuehrt };
}

// ------------------------------------------------------------------ Preise

export type Preise = { art: 'vorlage'; prozent: number } | { art: 'eigen'; liste: (PreisErkannt & { an: boolean })[] };

export const PREIS_REGLER = { min: -20, max: 30, schritt: 5 };

// ------------------------------------------------------------------ Team

export interface TeamEintrag {
  /** vorab vergeben – der Einladungslink stimmt so schon vor dem Anlegen */
  id: ID;
  name: string;
  telefon: string;
  rolle: Rolle;
}

/** Rolle aus der Teamgröße: kleine Teams sind Monteure; ab dem 4. Kopf schlägt Macher einmal „Büro“ vor */
export function rolleVorschlag(bisher: Rolle[]): Rolle {
  if (bisher.length >= 3 && !bisher.includes('buero')) return 'buero';
  return 'monteur';
}

export function telefonGueltig(t: string): boolean {
  return normTelefon(t).length >= 7;
}

export function einladungsLink(id: ID, betrieb: string, basis = globalThis.location?.origin ?? ''): string {
  const p = new URLSearchParams({ einladung: id });
  if (betrieb.trim()) p.set('betrieb', betrieb.trim());
  return `${basis}${appPfad('/willkommen')}?${p.toString()}`;
}

export function einladungsText(name: string, betrieb: string, link: string): string {
  const vorname = name.trim().split(/\s+/)[0] ?? '';
  return `Hallo ${vorname}, ich habe dich bei ${betrieb.trim() || 'uns'} in Handwerk OS eingeladen. Darüber bekommst du deine Einsätze aufs Handy: ${link}`;
}

// ------------------------------------------------------------------ Einrichten

export interface SetupAntworten {
  gewerk: Gewerk;
  /** feinere Vorlage (Solar, Fensterbau, Gebäudereinigung); ohne Angabe gilt die Wahl aus dem Preisschritt */
  fachrichtung?: FachrichtungId;
  briefkopf: BriefkopfEntwurf;
  kunden: Neu<Kunde>[];
  preise: Preise;
  team: TeamEintrag[];
}

export interface SetupErgebnis {
  kunden: number;
  leistungen: number;
  team: number;
  bundesland?: Bundesland;
  briefkopfVollstaendig: boolean;
}

export const BRIEFKOPF_KEY = 'vorlagen.briefkopf';

// ------------------------------------------------------------------ Gewerk-Vorlage (Schwerpunkt)

/** Im Preisschritt gewählter Schwerpunkt (z. B. Solar bei Elektro) – gilt bis zum Einrichten */
let schwerpunkt: FachrichtungId | undefined;
export const gewaehlterSchwerpunkt = () => schwerpunkt;
export function setzeSchwerpunkt(id: FachrichtungId | undefined) {
  schwerpunkt = id;
}

/**
 * Vorkonfiguration aus der Gewerk-Vorlage, die nicht schon `einrichten` erledigt: gewählte Fachrichtung merken
 * (Abläufe und Begriffe folgen daraus), fehlendes Material und Qualifikationen der Fachrichtung, zusätzliche
 * Checklisten, abweichende Automationen. Alles ohne Dubletten – mehrfach aufrufen ändert nichts.
 */
export function vorlageAnwenden(v: Vorlage): { artikel: number; qualifikationen: number; checklisten: number; felder: number } {
  const n = { artikel: 0, qualifikationen: 0, checklisten: 0, felder: 0 };
  const name = (x: string) => x.trim().toLowerCase();
  batch(() => {
    if (v.id !== v.gewerk) setzeEinstellung(VORLAGE_KEY, v.id);
    const artikel = new Set(db.artikel.all().map((x) => name(x.name)));
    const lieferantId = db.lieferanten.all()[0]?.id;
    for (const x of v.artikel) {
      if (artikel.has(name(x.name))) continue;
      db.artikel.create({
        name: x.name,
        einheit: x.einheit,
        ek: Math.round(x.ek * 100),
        vk: Math.round(x.vk * 100),
        kategorie: x.kategorie,
        mindestbestand: x.mindestbestand,
        bestand: x.mindestbestand ? Math.round(x.mindestbestand * 1.5) : undefined,
        lagerort: x.mindestbestand ? 'Hauptlager' : undefined,
        lieferantId,
        aktiv: true,
      });
      n.artikel++;
    }
    const quali = new Set(db.qualifikationen.all().map((q) => name(q.name)));
    for (const q of v.qualifikationen) {
      if (quali.has(name(q.name))) continue;
      db.qualifikationen.create({ ...q });
      n.qualifikationen++;
    }
    const listen = new Set(checklistenVorlagen.all().map((c) => name(c.name)));
    for (const c of v.checklisten) {
      if (listen.has(name(c.name))) continue;
      checklistenVorlagen.create({
        name: c.name,
        beschreibung: `Aus der Vorlage ${v.label}`,
        gewerke: [v.gewerk],
        arten: c.arten,
        automatisch: false,
        aktiv: true,
        punkte: c.punkte.map((text, i) => ({ id: `p${i + 1}`, text })),
      });
      n.checklisten++;
    }
  });
  // Aufmaß-/Formularfelder des Gewerks gleich mitbringen – der Betrieb muss nichts einrichten
  n.felder = feldvorlagenAnwenden(v.felder).angelegt.length;
  const bekannt = new Set(alleAutomationen().map((x) => x.id));
  for (const id of v.automationen.an) if (bekannt.has(id)) setzeAutomation(id, true);
  for (const id of v.automationen.aus) if (bekannt.has(id)) setzeAutomation(id, false);
  return n;
}

export function setupEinrichten(a: SetupAntworten): SetupErgebnis {
  const fachrichtung = a.fachrichtung ?? schwerpunkt;
  const v = vorlageFuer(a.gewerk, fachrichtung);
  const b = a.briefkopf;
  const faktor = a.preise.art === 'vorlage' ? 1 + a.preise.prozent / 100 : 1;
  // Fachrichtung: ihre Leistungen statt der des Basis-Gewerks (mit dem Regler angepasst)
  const eigene =
    a.preise.art === 'eigen'
      ? a.preise.liste.filter((l) => l.an)
      : v.id !== a.gewerk
        ? v.leistungen.map((l) => ({ ...l, preis: preisAnpassen(l.preis, faktor), an: true }))
        : [];
  const stundensatz = b.stundensatz > 0 ? b.stundensatz : v.id !== a.gewerk ? preisAnpassen(v.stundensatz, faktor) : undefined;

  einrichten({
    betriebName: b.name.trim(),
    gewerk: a.gewerk,
    arbeitsweisen: v.standardArbeitsweisen,
    teamgroesse: 1 + a.team.length,
    chefVorname: nameTeilen(b.inhaber).vorname,
    chefNachname: nameTeilen(b.inhaber).nachname,
    beispiele: false,
    preisFaktor: faktor,
    eigeneLeistungen: eigene.length ? eigene.map((l) => ({ name: l.name, einheit: l.einheit, preis: l.preis, kategorie: l.kategorie, minuten: (l as { minuten?: number }).minuten })) : undefined,
    betrieb: {
      adresse: { strasse: b.strasse.trim(), plz: b.plz.trim(), ort: b.ort.trim() },
      telefon: b.telefon.trim(),
      email: b.email.trim(),
      steuernummer: b.steuernummer.trim() || undefined,
      ustId: b.ustId.trim() || undefined,
      iban: b.iban.replace(/\s/g, '').toUpperCase() || undefined,
      bic: b.bic.replace(/\s/g, '').toUpperCase() || undefined,
      ...(b.zahlungszielTage > 0 ? { zahlungszielTage: b.zahlungszielTage } : {}),
      ...(stundensatz ? { stundensatz: Math.round(stundensatz * 100) } : {}),
    },
    team: a.team.map((m) => ({ id: m.id, ...nameTeilen(m.name), telefon: m.telefon.trim(), rolle: m.rolle })),
  });

  vorlageAnwenden(v);
  setzeSchwerpunkt(undefined);

  const bundesland = bundeslandAusPlz(b.plz);
  batch(() => {
    a.kunden.forEach((k, i) => db.kunden.create({ ...k, nummer: k.nummer ?? `K-${1001 + i}` }));
    if (bundesland) setzeEinstellung('plan.bundesland', bundesland);
    const kopf = einstellung<Record<string, unknown>>(BRIEFKOPF_KEY, { zeigeBank: true, zeigeSteuer: true });
    if (b.logo) setzeEinstellung(BRIEFKOPF_KEY, { ...kopf, logo: b.logo });
    setzeEinstellung('setup.fertigAm', new Date().toISOString());
  });
  // Echte Daten werden nie mit Beispieldaten gemischt: Legt ein Modul beim Einrichten doch etwas als „Beispiel“ an,
  // kommt es hier wieder weg (Beispiele gibt es nur auf der Spielwiese).
  if (alleSammlungen().some((c) => c.allMitGeloeschten().some((x) => x.beispiel))) beispieleEntfernen();
  void sicherungVerwerfen();

  return {
    kunden: a.kunden.length,
    leistungen: db.leistungen.all().length,
    team: a.team.length,
    bundesland,
    briefkopfVollstaendig: briefkopfLuecken(b).length === 0,
  };
}

/**
 * Team einladen. Mit Konto: über `cloud().einladen` (SMS mit Link). Ohne Konto: nur Mitarbeiter angelegt,
 * der Link wurde im Setup zum Teilen angezeigt – das wird ehrlich als „Link“ gemessen.
 */
export async function teamEinladen(team: TeamEintrag[]): Promise<{ gesendet: number; fehler: string[]; kanal: 'sms' | 'link' }> {
  if (!team.length) return { gesendet: 0, fehler: [], kanal: 'link' };
  const kanal = cloudAktiv() && cloud().konto() ? 'sms' : 'link';
  const fehler: string[] = [];
  let gesendet = 0;
  if (kanal === 'sms') {
    for (const m of team) {
      const r = await cloud().einladen(m.id, { telefon: m.telefon });
      if (r.status === 'fehler') fehler.push(`${m.name}: ${r.fehler ?? 'Einladung nicht verschickt.'}`);
      else gesendet++;
    }
  }
  const anzahl = kanal === 'sms' ? gesendet : team.length;
  if (anzahl) {
    messen('team.eingeladen', { anzahl, kanal });
    emit({ typ: 'team.eingeladen', daten: { mitarbeiterIds: team.map((m) => m.id), kanal } });
  }
  return { gesendet, fehler, kanal };
}

// ------------------------------------------------------------------ Messung

const START_KEY = 'macher-os:setup-start';

function sitzung(): Storage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

/** Setup-Start (bleibt über ein Neuladen im selben Tab erhalten) */
export function setupGestartet(quelle: string): number {
  const s = sitzung();
  const gespeichert = Number(s?.getItem(START_KEY));
  if (gespeichert > 0) return gespeichert;
  const jetzt = Date.now();
  s?.setItem(START_KEY, String(jetzt));
  messen('setup.gestartet', { quelle });
  return jetzt;
}

export function setupSchritt(start: number, id: SchrittId) {
  messen('setup.schritt', { schritt: SCHRITTE.findIndex((x) => x.id === id) + 1, id, sekunden: Math.round((Date.now() - start) / 1000) });
}

export function setupFertig(start: number, e: SetupErgebnis & { konto: 'gesichert' | 'lokal' | 'offen'; briefkopfQuelle: string; preise: string; gewerkQuelle?: 'website' | 'regel' | 'tipp' }) {
  sitzung()?.removeItem(START_KEY);
  messen('setup.fertig', {
    sekunden: Math.round((Date.now() - start) / 1000),
    kunden: e.kunden,
    leistungen: e.leistungen,
    team: e.team,
    briefkopfVollstaendig: e.briefkopfVollstaendig,
    briefkopfQuelle: e.briefkopfQuelle,
    preise: e.preise,
    konto: e.konto,
    ...(e.gewerkQuelle ? { gewerkQuelle: e.gewerkQuelle } : {}),
  });
}

/** Nach dem Setup: „Was möchtest du als Erstes erledigen?“ (`/start`), sonst Heute */
export function zielNachSetup(): string {
  return alleModule().some((m) => m.id === 'start') ? '/start' : '/heute';
}

// ------------------------------------------------------------------ Was ist vorbereitet?

const MODUL_SAMMLUNGEN: Record<string, string> = {
  checklistenVorlagen: 'Checklisten',
  arbeitsanweisungen: 'Arbeitsanweisungen',
  vorlagen: 'Vorlagen & Formulare',
  wissen: 'Anleitungen',
  schulungen: 'Schulungen',
  unterweisungen: 'Unterweisungen',
  einarbeitungen: 'Einarbeitungspläne',
  servicevertraege: 'Serviceverträge',
  serien: 'Wiederkehrende Termine',
  buchungsfenster: 'Buchungszeiten',
};

export interface Vorbereitet {
  label: string;
  anzahl: number;
}

/** Was hat Macher vorbereitet? Nur echte Zahlen aus den Daten. */
export function vorbereitet(): Vorbereitet[] {
  const zaehle = (name: string) => sammlung(name)?.all().length ?? 0;
  const liste: Vorbereitet[] = [
    { label: 'Leistungen mit Preisen', anzahl: db.leistungen.all().length },
    { label: 'Artikel & Material', anzahl: db.artikel.all().length },
    { label: 'Qualifikationen', anzahl: db.qualifikationen.all().length },
    ...Object.entries(MODUL_SAMMLUNGEN).map(([name, label]) => ({ label, anzahl: zaehle(name) })),
    { label: 'Automatische Regeln eingeschaltet', anzahl: alleAutomationen().filter((x) => automationAn(x.id)).length },
  ];
  return liste.filter((x) => x.anzahl > 0);
}

export const gewerkLabel = (g: Gewerk) => gewerkVorlage(g).label;

/**
 * Gewerk für die Demo aus der Adresse (`/demo?gewerk=…`). Die Website nennt den allgemeinen Betrieb „allgemein“,
 * die Software „sonstiges“. Unbekannt oder leer → Elektro (Standard der Spielwiese).
 */
export function demoGewerk(wert: string | null | undefined): Gewerk {
  if (wert === 'allgemein') return 'sonstiges';
  return GEWERKE.find((g) => g.id === wert)?.id ?? 'elektro';
}
