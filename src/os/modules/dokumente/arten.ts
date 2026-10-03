/**
 * Dokumenten-Engine: Registry aller Geschäftsdokumente.
 *
 * Jede Art sagt, wo ihre Quelle liegt (die Sammlung bleibt Source of Truth), wie sie heißt, wo Druck und Ansicht sind
 * und wie man sie am Auftrag erzeugt. Die Engine kopiert keine Daten – sie liest die bestehenden Objekte
 * (Angebot, Rechnung, Abnahme, Mahnung, Bericht) und die neuen Geschäftsdokumente (Auftragsbestätigung, Lieferschein).
 */
import { db } from '@core/db';
import { datum } from '@core/format';
import type { Auftrag, Bezug, Datum, ID, Phase, SammlungsName } from '@core/objects';
import type { TypTon } from '@core/zeichen';
import type { IconName } from '@ui/index';
import { abnahmeStarten, abnahmen, ERGEBNIS_TEXT, ergebnis, type Abnahme } from '@modules/abnahme/daten';
import { entwurfFuer, STATUS_TEXT as ANGEBOT_STATUS, STATUS_TON as ANGEBOT_TON } from '@modules/angebote/daten';
import { berichtErstellen, berichte, type Bericht, type BerichtArt } from '@modules/berichte/daten';
import { mahnungen, STUFE_LABEL, type Mahnung } from '@modules/mahnungen/daten';
import { passendeArt, rechnungErstellen, statusText as rechnungStatus } from '@modules/rechnungen/logik';
import { alleRechnungen, type RechnungX } from '@modules/rechnungen/typen';
import { geschaeftsdokumente, GESCHAEFTS_LABEL, STATUS_TEXT, type GeschaeftsArt } from './daten';
import { geschaeftsdokumentMitTexten } from './variablen';

export type DokumentArtId =
  | 'angebot'
  | 'auftragsbestaetigung'
  | 'lieferschein'
  | 'rapport'
  | 'arbeitsbericht'
  | 'baustellenbericht'
  | 'pruefprotokoll'
  | 'abnahme'
  | 'rechnung'
  | 'abschlagsrechnung'
  | 'teilrechnung'
  | 'schlussrechnung'
  | 'gutschrift'
  | 'storno'
  | 'zahlungserinnerung'
  | 'mahnung';

export type DokumentGruppe = 'verkauf' | 'ausfuehrung' | 'abrechnung' | 'forderung';

/** Strich-Icon je Dokumentart (Auswahlkarten, Typ-Kachel in Listen) */
export const DOKUMENTART_ICON: Record<DokumentArtId, IconName> = {
  angebot: 'dokument',
  auftragsbestaetigung: 'check',
  lieferschein: 'paket',
  rapport: 'notiz',
  arbeitsbericht: 'notiz',
  baustellenbericht: 'notiz',
  pruefprotokoll: 'check',
  abnahme: 'unterschrift',
  rechnung: 'euro',
  abschlagsrechnung: 'euro',
  teilrechnung: 'euro',
  schlussrechnung: 'euro',
  gutschrift: 'euro',
  storno: 'x',
  zahlungserinnerung: 'glocke',
  mahnung: 'glocke',
};

/** Farbton der Typ-Kachel je Gruppe – unterscheidet Arten, kein Status */
export const DOKUMENTGRUPPE_TON: Record<DokumentGruppe, TypTon> = {
  verkauf: 'blau',
  ausfuehrung: 'petrol',
  abrechnung: 'gruen',
  forderung: 'gelb',
};

export interface DokumentArt {
  id: DokumentArtId;
  label: string;
  /** ein Satz in Handwerkersprache */
  text: string;
  gruppe: DokumentGruppe;
  /** Source of Truth */
  quelle: SammlungsName;
  /** braucht das Recht „Preise & Geld“ */
  geld?: boolean;
  /** kann der Kunde unterschreiben? */
  unterschrift?: boolean;
  /** E-Rechnung (XRechnung) dabei */
  eRechnung?: boolean;
  /** Pfad der Druck-/PDF-Ansicht */
  druck: (id: ID) => string;
  /** Pfad der Detailansicht */
  pfad: (id: ID) => string;
  /** Am Auftrag erzeugen – gibt den Pfad des (neuen oder vorhandenen) Entwurfs zurück. Ohne: nicht am Auftrag erzeugbar. */
  erzeugen?: (auftragId: ID) => string | undefined;
  /** In diesen Phasen schlägt Macher die Art beim Erstellen vor */
  phasen?: Phase[];
}

const rechnungPfad = (id: ID) => `/betrieb/rechnungen/${id}`;
const rechnungDruck = (id: ID) => `/druck/rechnung/${id}`;
const berichtPfad = (id: ID) => `/auftraege/berichte/${id}`;
const berichtDruck = (id: ID) => `/druck/bericht/${id}`;
const gdPfad = (id: ID) => `/auftraege/dokumente/${id}`;
const gdDruck = (id: ID) => `/druck/dokument/${id}`;
const mahnPfad = (id: ID) => `/betrieb/mahnungen/${id}`;
const mahnDruck = (id: ID) => `/druck/mahnung/${id}`;

const bericht = (art: BerichtArt) => (auftragId: ID) => berichtPfad(berichtErstellen({ auftragId, art }).id);
const rechnung = (art: Parameters<typeof rechnungErstellen>[1]) => (auftragId: ID) => {
  const r = rechnungErstellen(auftragId, art);
  return r ? rechnungPfad(r.id) : undefined;
};

const geschaeft = (art: GeschaeftsArt) => (auftragId: ID) => {
  const d = geschaeftsdokumentMitTexten(auftragId, art);
  return d ? gdPfad(d.id) : undefined;
};

export const DOKUMENT_ARTEN: DokumentArt[] = [
  { id: 'angebot', label: 'Angebot', text: 'Preis vor dem Auftrag.', gruppe: 'verkauf', quelle: 'angebote', geld: true, druck: (id) => `/druck/angebot/${id}`, pfad: (id) => `/auftraege/angebote/${id}`, erzeugen: (a) => `/auftraege/angebote/${entwurfFuer(a).id}`, phasen: ['anfrage', 'besichtigung', 'angebot'] },
  { id: 'auftragsbestaetigung', label: 'Auftragsbestätigung', text: 'Bestätigt Leistung, Preis und Ausführung.', gruppe: 'verkauf', quelle: 'geschaeftsdokumente', geld: true, druck: gdDruck, pfad: gdPfad, erzeugen: geschaeft('auftragsbestaetigung'), phasen: ['beauftragt'] },
  { id: 'lieferschein', label: 'Lieferschein', text: 'Geliefertes Material, der Kunde quittiert.', gruppe: 'ausfuehrung', quelle: 'geschaeftsdokumente', unterschrift: true, druck: gdDruck, pfad: gdPfad, erzeugen: geschaeft('lieferschein'), phasen: ['in_arbeit'] },
  { id: 'rapport', label: 'Rapport', text: 'Kurzer Arbeitsnachweis im Kundendienst.', gruppe: 'ausfuehrung', quelle: 'berichte', unterschrift: true, druck: berichtDruck, pfad: berichtPfad, erzeugen: bericht('rapport'), phasen: ['in_arbeit'] },
  { id: 'arbeitsbericht', label: 'Arbeitsbericht', text: 'Stundenlohnarbeiten, die der Kunde gegenzeichnet.', gruppe: 'ausfuehrung', quelle: 'berichte', unterschrift: true, druck: berichtDruck, pfad: berichtPfad, erzeugen: bericht('regiebericht'), phasen: ['in_arbeit'] },
  { id: 'baustellenbericht', label: 'Baustellenbericht', text: 'Was heute auf der Baustelle passiert ist.', gruppe: 'ausfuehrung', quelle: 'berichte', druck: berichtDruck, pfad: berichtPfad, erzeugen: bericht('tagesbericht'), phasen: ['in_arbeit'] },
  { id: 'pruefprotokoll', label: 'Prüfprotokoll', text: 'Prüfpunkte mit Ergebnis und Messwerten.', gruppe: 'ausfuehrung', quelle: 'berichte', unterschrift: true, druck: berichtDruck, pfad: berichtPfad, erzeugen: bericht('pruefprotokoll'), phasen: ['in_arbeit', 'abnahme'] },
  { id: 'abnahme', label: 'Abnahme', text: 'Fertigstellung, Mängel und Unterschrift.', gruppe: 'ausfuehrung', quelle: 'abnahmen', unterschrift: true, druck: (id) => `/druck/abnahme/${id}`, pfad: (id) => `/auftraege/abnahme/${id}`, erzeugen: (a) => `/auftraege/abnahme/${abnahmeStarten(a).id}`, phasen: ['in_arbeit', 'abnahme'] },
  { id: 'rechnung', label: 'Rechnung', text: 'Macher wählt Rechnung oder Schlussrechnung passend.', gruppe: 'abrechnung', quelle: 'rechnungen', geld: true, eRechnung: true, druck: rechnungDruck, pfad: rechnungPfad, erzeugen: (a) => rechnung(passendeArt(a))(a), phasen: ['abnahme', 'abrechnung'] },
  { id: 'abschlagsrechnung', label: 'Abschlagsrechnung', text: 'Teil des Angebots vorab.', gruppe: 'abrechnung', quelle: 'rechnungen', geld: true, eRechnung: true, druck: rechnungDruck, pfad: rechnungPfad, erzeugen: rechnung('abschlag'), phasen: ['beauftragt', 'in_arbeit'] },
  { id: 'teilrechnung', label: 'Teilrechnung', text: 'Fertiger Teil der Leistung.', gruppe: 'abrechnung', quelle: 'rechnungen', geld: true, eRechnung: true, druck: rechnungDruck, pfad: rechnungPfad, erzeugen: rechnung('teil') },
  { id: 'schlussrechnung', label: 'Schlussrechnung', text: 'Alles, abzüglich gezahlter Abschläge.', gruppe: 'abrechnung', quelle: 'rechnungen', geld: true, eRechnung: true, druck: rechnungDruck, pfad: rechnungPfad, erzeugen: rechnung('schluss') },
  { id: 'gutschrift', label: 'Gutschrift', text: 'Betrag, den der Kunde zurückbekommt.', gruppe: 'abrechnung', quelle: 'rechnungen', geld: true, eRechnung: true, druck: rechnungDruck, pfad: rechnungPfad, erzeugen: rechnung('gutschrift') },
  { id: 'storno', label: 'Stornorechnung', text: 'Hebt eine Rechnung auf – entsteht an der Rechnung.', gruppe: 'abrechnung', quelle: 'rechnungen', geld: true, eRechnung: true, druck: rechnungDruck, pfad: rechnungPfad },
  { id: 'zahlungserinnerung', label: 'Zahlungserinnerung', text: 'Freundlich an die offene Rechnung erinnern.', gruppe: 'forderung', quelle: 'mahnungen', geld: true, druck: mahnDruck, pfad: mahnPfad },
  { id: 'mahnung', label: 'Mahnung', text: '1. und 2. Mahnung mit Gebühr und Zinsen.', gruppe: 'forderung', quelle: 'mahnungen', geld: true, druck: mahnDruck, pfad: mahnPfad },
];

export const dokumentArt = (id: DokumentArtId) => DOKUMENT_ARTEN.find((a) => a.id === id)!;

// ------------------------------------------------------------------ Objekt → Art

const RECHNUNG_ART: Record<RechnungX['art'], DokumentArtId> = { rechnung: 'rechnung', abschlag: 'abschlagsrechnung', teil: 'teilrechnung', schluss: 'schlussrechnung', gutschrift: 'gutschrift' };
/** Labels kommen aus den Quell-Modulen, damit überall dasselbe Wort steht */
const BERICHT_ART: Record<BerichtArt, DokumentArtId> = { rapport: 'rapport', regiebericht: 'arbeitsbericht', tagesbericht: 'baustellenbericht', pruefprotokoll: 'pruefprotokoll' };

export const rechnungDokArt = (r: Pick<RechnungX, 'art' | 'stornoFuerId'>): DokumentArtId => (r.stornoFuerId ? 'storno' : RECHNUNG_ART[r.art]);
export const berichtDokArt = (b: Pick<Bericht, 'art'>): DokumentArtId => BERICHT_ART[b.art];
export const mahnungDokArt = (m: Pick<Mahnung, 'stufe'>): DokumentArtId => (m.stufe === 1 ? 'zahlungserinnerung' : 'mahnung');

/** Welche Dokumentart ist dieses Objekt? */
export function artVon(bezug: Bezug): DokumentArt | undefined {
  switch (bezug.typ) {
    case 'angebote':
      return db.angebote.get(bezug.id) ? dokumentArt('angebot') : undefined;
    case 'rechnungen': {
      const r = db.rechnungen.get(bezug.id);
      return r ? dokumentArt(rechnungDokArt(r)) : undefined;
    }
    case 'berichte': {
      const b = berichte.get(bezug.id);
      return b ? dokumentArt(berichtDokArt(b)) : undefined;
    }
    case 'abnahmen':
      return abnahmen.get(bezug.id) ? dokumentArt('abnahme') : undefined;
    case 'mahnungen': {
      const m = mahnungen.get(bezug.id);
      return m ? dokumentArt(mahnungDokArt(m)) : undefined;
    }
    case 'geschaeftsdokumente': {
      const d = geschaeftsdokumente.get(bezug.id);
      return d ? dokumentArt(d.art) : undefined;
    }
  }
  return undefined;
}

// ------------------------------------------------------------------ Alle Dokumente eines Auftrags (eine Sicht, keine Kopie)

export interface DokumentEintrag {
  bezug: Bezug;
  art: DokumentArt;
  /** z. B. „2. Mahnung“ */
  label: string;
  titel: string;
  nummer?: string;
  datum: Datum;
  status: { text: string; ton: 'neutral' | 'aktiv' | 'erfolg' | 'achtung' };
  pfad: string;
  druck: string;
  beispiel?: boolean;
}

function eintrag(bezug: Bezug, art: DokumentArt, o: { titel: string; nummer?: string; datum: Datum; status: DokumentEintrag['status']; beispiel?: boolean; label?: string }): DokumentEintrag {
  return { bezug, art, label: o.label ?? art.label, titel: o.titel, nummer: o.nummer || undefined, datum: o.datum, status: o.status, pfad: art.pfad(bezug.id), druck: art.druck(bezug.id), beispiel: o.beispiel };
}

const BERICHT_STATUS: Record<Bericht['status'], DokumentEintrag['status']> = {
  entwurf: { text: 'Entwurf', ton: 'neutral' },
  fertig: { text: 'Fertig', ton: 'aktiv' },
  unterschrieben: { text: 'Unterschrieben', ton: 'erfolg' },
};

function abnahmeStatus(a: Abnahme): DokumentEintrag['status'] {
  if (a.status === 'unterschrieben') return { text: ERGEBNIS_TEXT[ergebnis(a.mangelAufgabeIds)], ton: a.mangelAufgabeIds.length ? 'achtung' : 'erfolg' };
  if (a.status === 'verweigert') return { text: 'Verweigert', ton: 'achtung' };
  return { text: 'Offen', ton: 'neutral' };
}

/** Alle Geschäftsdokumente eines Auftrags, neueste zuerst. `geld = false` blendet Preis-Dokumente aus (Monteur). */
export function dokumenteZumAuftrag(auftragId: ID, geld = true): DokumentEintrag[] {
  const liste: DokumentEintrag[] = [];
  if (geld) {
    for (const a of db.angebote.where((x) => x.auftragId === auftragId))
      liste.push(eintrag({ typ: 'angebote', id: a.id }, dokumentArt('angebot'), { titel: a.titel, nummer: a.version > 1 ? `${a.nummer} V${a.version}` : a.nummer, datum: a.datum, status: { text: ANGEBOT_STATUS[a.status], ton: ANGEBOT_TON[a.status] }, beispiel: a.beispiel }));
    const rechnungen = alleRechnungen().filter((r) => r.auftragId === auftragId);
    for (const r of rechnungen) liste.push(eintrag({ typ: 'rechnungen', id: r.id }, dokumentArt(rechnungDokArt(r)), { titel: r.titel, nummer: r.nummer, datum: r.datum, status: rechnungStatus(r), beispiel: r.beispiel }));
    const ids = new Set(rechnungen.map((r) => r.id));
    for (const m of mahnungen.where((x) => ids.has(x.rechnungId) && x.status !== 'verworfen'))
      liste.push(eintrag({ typ: 'mahnungen', id: m.id }, dokumentArt(mahnungDokArt(m)), { label: STUFE_LABEL[m.stufe], titel: `${STUFE_LABEL[m.stufe]} zu ${db.rechnungen.get(m.rechnungId)?.nummer ?? ''}`, datum: m.datum, status: m.status === 'versendet' ? { text: 'Versendet', ton: 'aktiv' } : { text: 'Wartet auf Freigabe', ton: 'achtung' }, beispiel: m.beispiel }));
  }
  for (const d of geschaeftsdokumente.where((x) => x.auftragId === auftragId)) {
    const art = dokumentArt(d.art);
    if (art.geld && !geld) continue;
    liste.push(eintrag({ typ: 'geschaeftsdokumente', id: d.id }, art, { titel: d.titel, nummer: d.nummer, datum: d.datum, status: STATUS_TEXT[d.status], beispiel: d.beispiel }));
  }
  for (const b of berichte.where((x) => x.auftragId === auftragId))
    liste.push(eintrag({ typ: 'berichte', id: b.id }, dokumentArt(berichtDokArt(b)), { titel: `${dokumentArt(berichtDokArt(b)).label} vom ${datum(b.datum)}`, nummer: b.nummer, datum: b.datum, status: BERICHT_STATUS[b.status], beispiel: b.beispiel }));
  for (const a of abnahmen.where((x) => x.auftragId === auftragId))
    liste.push(eintrag({ typ: 'abnahmen', id: a.id }, dokumentArt('abnahme'), { titel: `Abnahme vom ${datum(a.datum)}`, datum: a.datum, status: abnahmeStatus(a), beispiel: a.beispiel }));
  return liste.sort((a, b) => b.datum.localeCompare(a.datum));
}

/** Was Macher am Auftrag zum Erstellen vorschlägt: passend zur Phase zuerst, Preis-Dokumente nur mit Geld-Recht */
export function erstellbareArten(a: Auftrag, geld = true): { art: DokumentArt; vorschlag: boolean }[] {
  return DOKUMENT_ARTEN.filter((x) => x.erzeugen && (geld || !x.geld))
    .filter((x) => x.id !== 'teilrechnung' && x.id !== 'schlussrechnung' && x.id !== 'gutschrift') // stehen hinter „Rechnung“ → Weitere Optionen
    .map((art) => ({ art, vorschlag: !!art.phasen?.includes(a.phase) }))
    .sort((x, y) => Number(y.vorschlag) - Number(x.vorschlag));
}

/** Label je Geschäftsdokument-Art (für Texte) */
export const geschaeftsLabel = (art: GeschaeftsArt) => GESCHAEFTS_LABEL[art];
