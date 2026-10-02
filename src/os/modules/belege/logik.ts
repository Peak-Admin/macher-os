/**
 * Eingangsrechnungen & Belege: Ablauf (Neu → Prüfen → Zuordnen → Freigeben → Bezahlt), Konditionen (Skonto/Zahlungsziel)
 * lesen, Auftrag vorschlagen, Fristen erkennen, Dateien ablegen, Belege-Postfach (E-Mail-Eingang).
 */
import { cloudAktiv } from '@core/cloud';
import { db } from '@core/db';
import { heute, plusTage, tageZwischen } from '@core/format';
import type { Cent, Datum, ID } from '@core/objects';
import { ichId } from '@core/session';
import { belegAendern, type BelegX } from '../rechnungen/typen';
import { dateiLesen } from '@ui/index';
import { betragCsv, csvText } from '../rechnungen/liste';
import { belegePostfachAdresse } from '@/os/server/belege-postfach';

export const alleBelege = () => db.belege.all() as BelegX[];
export const belegX = (id: ID | undefined) => db.belege.get(id) as BelegX | undefined;

export const ART_LABEL: Record<BelegX['art'], string> = {
  eingangsrechnung: 'Eingangsrechnung',
  quittung: 'Quittung',
  tankbeleg: 'Tankbeleg',
  sonstiges: 'Sonstiges',
};

export const KATEGORIEN = ['Material', 'Fahrzeug', 'Werkzeug', 'Subunternehmer', 'Büro', 'Sonstiges'];

export interface Konditionen {
  skontoProzent?: number;
  skontoTage?: number;
  zielTage?: number;
}

/** "3 % Skonto 10 Tage, 30 Tage netto" → { skontoProzent: 3, skontoTage: 10, zielTage: 30 } */
export function konditionenLesen(text: string | undefined): Konditionen {
  if (!text) return {};
  const t = text.toLowerCase().replace(/(\d),(\d)/g, '$1.$2');
  const k: Konditionen = {};
  const a = t.match(/(\d+(?:\.\d+)?)\s*%\s*skonto[^\d]*(\d+)\s*tag/);
  const b = t.match(/(\d+)\s*tage?\s*(\d+(?:\.\d+)?)\s*%\s*skonto/);
  if (a) {
    k.skontoProzent = Number(a[1]);
    k.skontoTage = Number(a[2]);
  } else if (b) {
    k.skontoTage = Number(b[1]);
    k.skontoProzent = Number(b[2]);
  }
  const ziel = t.match(/(\d+)\s*tage?\s*(?:netto|rein|ohne abzug)/) ?? t.match(/(?:netto|zahlbar)\s*(?:in|innerhalb)?\s*(\d+)\s*tag/);
  if (ziel) k.zielTage = Number(ziel[1]);
  return k;
}

/** Fälligkeit und Skontofrist aus Lieferanten-Konditionen ableiten (nur wenn nicht schon gesetzt) */
export function fristenAusKonditionen(b: Pick<BelegX, 'datum' | 'lieferantId' | 'faelligAm' | 'skontoBis' | 'skontoProzent'>) {
  const l = db.lieferanten.get(b.lieferantId);
  const k = konditionenLesen(l?.konditionen);
  return {
    faelligAm: b.faelligAm ?? (k.zielTage != null ? plusTage(b.datum, k.zielTage) : undefined),
    skontoBis: b.skontoBis ?? (k.skontoTage != null ? plusTage(b.datum, k.skontoTage) : undefined),
    skontoProzent: b.skontoProzent ?? k.skontoProzent,
  };
}

export const brutto = (b: Pick<BelegX, 'netto' | 'ust'>) => b.netto + b.ust;

/** Netto und USt aus Bruttobetrag */
export function ausBrutto(brutto: Cent, satz: number): { netto: Cent; ust: Cent } {
  const netto = Math.round(brutto / (1 + satz / 100));
  return { netto, ust: brutto - netto };
}

export function lieferantName(b: BelegX) {
  return db.lieferanten.get(b.lieferantId)?.name ?? b.lieferantName ?? 'Unbekannter Lieferant';
}

// ------------------------------------------------------------------ Auftrag vorschlagen

export interface Vorschlag {
  auftragId: ID;
  punkte: number;
  gruende: string[];
}

/**
 * Welcher Auftrag passt? Punkte für: Material vom gleichen Lieferanten am Auftrag,
 * Einsatz/Zeiten nahe am Belegdatum, Auftrag gerade in Arbeit.
 */
export function auftragVorschlaege(b: Pick<BelegX, 'datum' | 'lieferantId' | 'lieferantName' | 'kategorie'>): Vorschlag[] {
  const kandidaten = db.auftraege.where((a) => !['anfrage', 'verloren'].includes(a.phase));
  const name = (b.lieferantName ?? db.lieferanten.get(b.lieferantId)?.name ?? '').toLowerCase().trim();
  const liste: Vorschlag[] = [];
  for (const a of kandidaten) {
    const gruende: string[] = [];
    let punkte = 0;
    const material = db.material.where((m) => m.auftragId === a.id);
    const vomLieferanten = material.filter((m) => {
      const art = db.artikel.get(m.artikelId);
      if (b.lieferantId && art?.lieferantId === b.lieferantId) return true;
      const ln = db.lieferanten.get(art?.lieferantId)?.name.toLowerCase() ?? '';
      return !!name && !!ln && (ln.includes(name) || name.includes(ln.split(' ')[0]));
    });
    if (vomLieferanten.length) {
      punkte += 40;
      gruende.push(`Material vom selben Lieferanten am Auftrag`);
    } else if (material.length && (!b.kategorie || b.kategorie === 'Material')) {
      punkte += 10;
      gruende.push('Material am Auftrag');
    }
    const tage = [
      ...db.termine.where((t) => t.auftragId === a.id && t.status !== 'abgesagt').map((t) => t.start.slice(0, 10)),
      ...db.zeiten.where((z) => z.auftragId === a.id).map((z) => z.datum),
      ...material.map((m) => m.datum).filter(Boolean) as Datum[],
    ];
    const abstand = tage.length ? Math.min(...tage.map((d) => Math.abs(tageZwischen(d, b.datum)))) : Infinity;
    if (abstand <= 1) {
      punkte += 35;
      gruende.push(abstand === 0 ? 'Einsatz am selben Tag' : 'Einsatz einen Tag daneben');
    } else if (abstand <= 3) {
      punkte += 25;
      gruende.push(`Einsatz ${abstand} Tage daneben`);
    } else if (abstand <= 7) {
      punkte += 10;
      gruende.push('Einsatz in derselben Woche');
    }
    if (a.phase === 'in_arbeit') {
      punkte += 10;
      gruende.push('Auftrag läuft gerade');
    }
    if (punkte > 0) liste.push({ auftragId: a.id, punkte, gruende });
  }
  return liste.sort((x, y) => y.punkte - x.punkte);
}

/** Sicher genug, um automatisch zuzuordnen? Eindeutiger Spitzenreiter mit starken Gründen. */
export function sichererVorschlag(v: Vorschlag[]): Vorschlag | undefined {
  const [erster, zweiter] = v;
  if (!erster || erster.punkte < 60) return undefined;
  if (zweiter && erster.punkte - zweiter.punkte < 25) return undefined;
  return erster;
}

// ------------------------------------------------------------------ Fristen

export interface Frist {
  art: 'skonto' | 'faellig';
  datum: Datum;
  tage: number;
  betrag?: Cent;
}

/** nächste relevante Frist eines unbezahlten Belegs */
export function naechsteFrist(b: BelegX, stichtag: Datum = heute()): Frist | undefined {
  if (b.status === 'bezahlt') return undefined;
  if (b.skontoBis && b.skontoBis >= stichtag) {
    const ersparnis = b.skontoProzent ? Math.round((brutto(b) * b.skontoProzent) / 100) : undefined;
    return { art: 'skonto', datum: b.skontoBis, tage: tageZwischen(stichtag, b.skontoBis), betrag: ersparnis };
  }
  if (b.faelligAm) return { art: 'faellig', datum: b.faelligAm, tage: tageZwischen(stichtag, b.faelligAm) };
  return undefined;
}

// ------------------------------------------------------------------ Ablauf

/**
 * Schritte einer Eingangsrechnung. Der Kern-Status (`neu` | `geprueft` | `bezahlt`) bleibt, damit alte Daten und andere
 * Module (DATEV, Auswertung) unverändert funktionieren. Abbildung:
 * - `neu` → „Prüfen“
 * - `geprueft` ohne Auftrag und ohne Betriebsbereich (und nicht „ohne Auftrag“ markiert) → „Zuordnen“
 * - `geprueft` mit Auftrag, nicht freigegeben → „Freigeben“
 * - `geprueft` und freigegeben → „Zahlen“
 * - `bezahlt` → „Bezahlt“
 * Altbestand: Belege, die vor dem neuen Ablauf auf „geprüft“ gesetzt wurden (kein `geprueftAm`), galten als zahlbereit –
 * sie landen direkt bei „Zahlen“. Es wird nichts umgeschrieben.
 */
export type Schritt = 'pruefen' | 'zuordnen' | 'freigeben' | 'zahlen' | 'bezahlt';

export function belegSchritt(b: Pick<BelegX, 'status' | 'geprueftAm' | 'freigegebenAm' | 'auftragId' | 'ohneAuftrag' | 'bereich'>): Schritt {
  if (b.status === 'bezahlt') return 'bezahlt';
  if (b.status !== 'geprueft') return 'pruefen';
  if (!b.geprueftAm && !b.freigegebenAm) return 'zahlen';
  // zugeordnet heißt: Auftrag, Betriebsbereich (Lager, Büro, Fahrzeuge …) oder bewusst „ohne Auftrag“
  if (!b.auftragId && !b.bereich && !b.ohneAuftrag) return 'zuordnen';
  if (!b.freigegebenAm) return 'freigeben';
  return 'zahlen';
}

/** Anzeige der Schritte (Schrittanzeige im Detail): „Neu“ ist mit dem Eingang erledigt */
export const SCHRITTE: { id: 'neu' | Exclude<Schritt, 'zahlen'>; label: string }[] = [
  { id: 'neu', label: 'Neu' },
  { id: 'pruefen', label: 'Prüfen' },
  { id: 'zuordnen', label: 'Zuordnen' },
  { id: 'freigeben', label: 'Freigeben' },
  { id: 'bezahlt', label: 'Bezahlt' },
];

/** Index des aktuellen Schritts in `SCHRITTE` („Zahlen“ = der Schritt „Bezahlt“ steht an) */
export function schrittIndex(s: Schritt): number {
  return s === 'zahlen' ? 4 : SCHRITTE.findIndex((x) => x.id === s);
}

export const SCHRITT_STATUS: Record<Schritt, { text: string; ton: 'aktiv' | 'neutral' | 'erfolg' }> = {
  pruefen: { text: 'Zu prüfen', ton: 'aktiv' },
  zuordnen: { text: 'Auftrag fehlt', ton: 'neutral' },
  freigeben: { text: 'Freizugeben', ton: 'neutral' },
  zahlen: { text: 'Offen zu zahlen', ton: 'neutral' },
  bezahlt: { text: 'Bezahlt', ton: 'erfolg' },
};

/** Ansichten der Arbeits-Inbox */
export type Ansicht = 'pruefen' | 'freigeben' | 'zahlen' | 'alle';
export const ANSICHTEN: Ansicht[] = ['pruefen', 'freigeben', 'zahlen', 'alle'];

export function inAnsicht(b: BelegX, a: Ansicht): boolean {
  const s = belegSchritt(b);
  if (a === 'pruefen') return s === 'pruefen';
  if (a === 'freigeben') return s === 'zuordnen' || s === 'freigeben';
  if (a === 'zahlen') return s === 'zahlen';
  return true;
}

/** Was fehlt, bevor ein Beleg als geprüft gelten kann? (leer = alles da) */
export function pruefLuecken(b: BelegX): string[] {
  const fehlt: string[] = [];
  if (!b.lieferantId && !b.lieferantName?.trim()) fehlt.push('Lieferant');
  if (b.netto + b.ust <= 0) fehlt.push('Betrag');
  if (!b.datum) fehlt.push('Belegdatum');
  return fehlt;
}

const jetzt = () => new Date().toISOString();

/** Schritt „Prüfen“ abschließen */
export function alsGeprueft(id: ID) {
  return belegAendern(id, { status: 'geprueft', geprueftAm: jetzt(), geprueftVon: ichId() }, { text: 'Geprüft' });
}

/** Schritt „Zuordnen“: Auftrag setzen (mit Dokument) oder bewusst ohne Auftrag weiter */
export function auftragZuordnen(id: ID, auftragId: ID | undefined) {
  const b = belegX(id);
  if (!b) return;
  belegAendern(id, { auftragId, bereich: auftragId ? undefined : b.bereich, ohneAuftrag: auftragId ? undefined : b.ohneAuftrag, zuordnungGrund: undefined }, { text: auftragId ? `Auftrag ${db.auftraege.get(auftragId)?.nummer ?? ''} zugeordnet`.trim() : 'Zuordnung aufgehoben' });
  if (b.dokumentId) db.dokumente.update(b.dokumentId, { auftragId }, { leise: true });
}

export function ohneAuftragWeiter(id: ID) {
  return belegAendern(id, { ohneAuftrag: true, auftragId: undefined, zuordnungGrund: undefined }, { text: 'Gehört zu keinem Auftrag' });
}

export function freigeben(id: ID) {
  return belegAendern(id, { freigegebenAm: jetzt(), freigegebenVon: ichId() }, { text: 'Zur Zahlung freigegeben' });
}

export function alsBezahlt(id: ID) {
  return belegAendern(id, { status: 'bezahlt', bezahltAm: heute() }, { text: 'Als bezahlt markiert' });
}

/** Zurück auf „Prüfen“ – alle Ablauf-Stempel weg (Auftrag und Werte bleiben) */
export function zuruecksetzen(id: ID) {
  return belegAendern(
    id,
    { status: 'neu', geprueftAm: undefined, geprueftVon: undefined, freigegebenAm: undefined, freigegebenVon: undefined, bezahltAm: undefined },
    { text: 'Wieder auf „Prüfen“ gesetzt' },
  );
}

/** Wer kann prüfen? Aktive Mitarbeiter, Büro und Chef zuerst */
export function pruefende() {
  const rang = (r: string) => (r === 'buero' ? 0 : r === 'chef' ? 1 : 2);
  return db.mitarbeiter
    .where((m) => m.aktiv)
    .sort((a, b) => rang(a.rolle) - rang(b.rolle) || `${a.vorname} ${a.nachname}`.localeCompare(`${b.vorname} ${b.nachname}`));
}

export function personName(id: ID | undefined) {
  const m = db.mitarbeiter.get(id);
  return m ? `${m.vorname} ${m.nachname}`.trim() : undefined;
}

// ------------------------------------------------------------------ E-Mail-Eingang (Belege-Postfach)

/** Öffentlicher Schalter: der Betreiber setzt ihn erst, wenn Mail-Dienst, DNS und Webhook laufen (docs/os/BELEGE-EMAIL.md) */
const EINGANG_FREIGESCHALTET = process.env.NEXT_PUBLIC_BELEGE_EMAIL_AKTIV === '1';

export interface EmailEingang {
  adresse: string;
  aktiv: boolean;
  text: string;
}

/** Adresse des Belege-Postfachs und ob es wirklich Mails annimmt – ehrlich, nie „aktiv“ ohne Server */
export function emailEingang(opts: { cloud?: boolean; freigeschaltet?: boolean } = {}): EmailEingang {
  const adresse = belegePostfachAdresse(db.betrieb.get('betrieb')?.name);
  const cloud = opts.cloud ?? cloudAktiv();
  const frei = opts.freigeschaltet ?? EINGANG_FREIGESCHALTET;
  if (!cloud) return { adresse, aktiv: false, text: 'Noch nicht aktiv: Der E-Mail-Eingang braucht die Cloud-Verbindung („Daten sichern“).' };
  if (!frei) return { adresse, aktiv: false, text: 'Noch nicht aktiv: Der Mail-Empfang wird gerade eingerichtet. Bis dahin leg PDFs hier ab.' };
  return { adresse, aktiv: true, text: 'Aktiv: Leite Rechnungen an diese Adresse weiter. PDFs und Fotos im Anhang landen unter „Zu prüfen“.' };
}

// ------------------------------------------------------------------ Dateien

export const BELEG_DATEITYPEN = 'application/pdf,image/jpeg,image/png,image/*';

/** Passt die Datei als Beleg? Liefert die Fehlermeldung oder undefined */
export function dateiPruefen(f: Pick<File, 'type' | 'size' | 'name'>): string | undefined {
  const pdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
  if (!pdf && !f.type.startsWith('image/')) return `${f.name || 'Die Datei'} ist kein PDF und kein Foto.`;
  if (pdf && f.size > 2_000_000) return `${f.name || 'Das PDF'} ist größer als 2 MB. Fotografiere den Beleg lieber.`;
  return undefined;
}

/** Datei ablegen und daraus einen Beleg „neu“ machen (Drag & Drop, Datei wählen, Foto) */
export async function belegAusDatei(datei: File, opts: { quelle?: 'foto' | 'upload'; pruefendeId?: ID } = {}): Promise<BelegX> {
  const fehler = dateiPruefen(datei);
  if (fehler) throw new Error(fehler);
  const d = await dateiAblegen(datei);
  const b = db.belege.create({
    art: 'eingangsrechnung',
    datum: heute(),
    netto: 0,
    ust: 0,
    status: 'neu',
    dokumentId: d.id,
    quelle: opts.quelle ?? 'upload',
    pruefendeId: opts.pruefendeId,
  } as Parameters<typeof db.belege.create>[0]) as BelegX;
  db.dokumente.update(d.id, { bezug: { typ: 'belege', id: b.id } }, { leise: true });
  return b;
}

/** Foto/PDF als Dokument ablegen und Beleg anlegen */
export async function dateiAblegen(datei: File, opts: { auftragId?: ID } = {}) {
  const d = await dateiLesen(datei);
  return db.dokumente.create({
    art: d.istBild ? 'foto' : 'pdf',
    titel: datei.name || 'Beleg',
    url: d.url,
    mime: d.mime,
    groesse: d.bytes,
    auftragId: opts.auftragId,
    tags: ['beleg'],
  });
}

// ------------------------------------------------------------------ Liste & Export

/** Zuordnungsfilter: `''` = alle, `'auftrag'` = mit Auftrag, `'ohne'` = weder Auftrag noch Bereich, sonst Bereichsname */
export type ZuordnungFilter = string;

export function passtZuordnung(b: Pick<BelegX, 'auftragId' | 'bereich'>, f: ZuordnungFilter): boolean {
  if (!f) return true;
  if (f === 'auftrag') return !!b.auftragId;
  if (f === 'ohne') return !b.auftragId && !b.bereich;
  return !b.auftragId && b.bereich === f;
}

const tmj = (d: string | undefined) => (d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : '');

export const BELEG_CSV_SPALTEN = ['Datum', 'Lieferant', 'Art', 'Nummer', 'Auftrag', 'Betriebsbereich', 'Kategorie', 'Netto', 'USt', 'Brutto', 'Status', 'Zahlen bis'];

export function belegeCsv(liste: BelegX[]): string {
  return csvText([
    BELEG_CSV_SPALTEN,
    ...liste.map((b) => [
      tmj(b.datum),
      lieferantName(b),
      ART_LABEL[b.art],
      b.nummer ?? '',
      db.auftraege.get(b.auftragId)?.nummer ?? '',
      b.auftragId ? '' : (b.bereich ?? ''),
      b.kategorie ?? '',
      betragCsv(b.netto),
      betragCsv(b.ust),
      betragCsv(brutto(b)),
      SCHRITT_STATUS[belegSchritt(b)].text,
      tmj(b.faelligAm),
    ]),
  ]);
}
