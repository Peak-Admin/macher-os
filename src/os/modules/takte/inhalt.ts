/**
 * Inhalt der Takte – je Rolle genau das, was um diese Uhrzeit zählt.
 *
 * Reine Funktionen über einem `Bestand` (alle Objekte des Betriebs als Listen). Der Browser baut den
 * Bestand aus `db`, der Server aus der Tabelle `objekte` – beide erzeugen damit denselben Inhalt.
 * Deshalb hier nur relative Importe und nichts, was `db`, `window` oder React braucht.
 *
 * Geld-Definitionen wie in `modules/auswertung/daten.ts` (Umsatz = zählende Rechnungen netto,
 * offene Posten = Brutto-Forderung minus Zahlungen).
 */
import { euro, plusTage, summen, wochenStart } from '../../core/format';
import type {
  Abwesenheit,
  Aufgabe,
  Auftrag,
  Betrieb,
  Datum,
  Erledigung,
  ID,
  Kunde,
  Materialbuchung,
  Mitarbeiter,
  Ort,
  Rechnung,
  Termin,
  Zahlung,
  Zeiteintrag,
} from '../../core/objects';
import type { TaktId } from './regeln';
import { textVonMinuten, uhrVon, type Uhr } from './zeit';

/** Alle Objekte des Betriebs, die die Takte brauchen (Namen = Sammlungen) */
export interface Bestand {
  betrieb?: Betrieb;
  mitarbeiter: Mitarbeiter[];
  termine: Termin[];
  auftraege: Auftrag[];
  kunden: Kunde[];
  orte: Ort[];
  material: Materialbuchung[];
  aufgaben: Aufgabe[];
  zeiten: Zeiteintrag[];
  rechnungen: Rechnung[];
  zahlungen: Zahlung[];
  erledigungen: Erledigung[];
  abwesenheiten: Abwesenheit[];
}

export function leererBestand(teil: Partial<Bestand> = {}): Bestand {
  return { mitarbeiter: [], termine: [], auftraege: [], kunden: [], orte: [], material: [], aufgaben: [], zeiten: [], rechnungen: [], zahlungen: [], erledigungen: [], abwesenheiten: [], ...teil };
}

/** Eine Entscheidung für den Tagesbrief (aus „Braucht dich“) */
export interface Entscheidung {
  schluessel: string;
  titel: string;
  text?: string;
  art: 'entscheidung' | 'freigabe' | 'problem' | 'info';
  gewicht: number;
  pfad?: string;
  aktionen: { aktion: string; label: string; primaer?: boolean; payload?: unknown }[];
}

/** Aktion an einer Benachrichtigung bzw. in der Takt-Ansicht */
export interface TaktAktion {
  aktion: string;
  label: string;
  payload?: unknown;
}

// ------------------------------------------------------------------ Hilfen

const ABWESENHEIT: Record<Abwesenheit['art'], string> = { urlaub: 'Urlaub', krank: 'krank gemeldet', schule: 'Berufsschule', schulung: 'Schulung', frei: 'frei', sonstiges: 'abwesend' };
const ZEIT_ART: Record<Zeiteintrag['art'], string> = { arbeit: 'Arbeit', fahrt: 'Fahrt', werkstatt: 'Werkstatt', buero: 'Büro' };
const ZAEHLT: Rechnung['status'][] = ['versendet', 'teilbezahlt', 'bezahlt'];

const uhrText = (iso: string) => textVonMinuten(uhrVon(iso).minuten);
const tagVon = (iso: string) => uhrVon(iso).datum;
const adresseText = (o: Ort | undefined, k: Kunde | undefined) => {
  const a = o?.adresse ?? k?.adresse;
  return a && (a.strasse || a.ort) ? [a.strasse, [a.plz, a.ort].filter(Boolean).join(' ')].filter(Boolean).join(', ') : undefined;
};

/** Termine einer Person an einem Tag (ohne abgesagte), nach Start sortiert */
export function termineAm(b: Bestand, tag: Datum, mitarbeiterId: ID): Termin[] {
  return b.termine
    .filter((t) => !t.geloeschtAm && t.status !== 'abgesagt' && !!t.start && t.mitarbeiterIds.includes(mitarbeiterId))
    .filter((t) => tagVon(t.start) <= tag && tagVon(t.ende || t.start) >= tag)
    .sort((x, y) => x.start.localeCompare(y.start));
}

function zeitspanne(t: Termin): string {
  if (t.ganztags) return 'ganztags';
  return t.ende ? `${uhrText(t.start)}–${uhrText(t.ende)}` : uhrText(t.start);
}

function abwesend(b: Bestand, mitarbeiterId: ID, tag: Datum): Abwesenheit | undefined {
  return b.abwesenheiten.find((a) => !a.geloeschtAm && a.mitarbeiterId === mitarbeiterId && a.status === 'genehmigt' && a.von <= tag && a.bis >= tag);
}

function minutenVon(z: Zeiteintrag): number {
  if (!z.ende) return 0;
  const [h1, m1] = z.start.split(':').map(Number);
  const [h2, m2] = z.ende.split(':').map(Number);
  return Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1) - (z.pauseMinuten || 0));
}

export function dauerText(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} Min.`;
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

// ------------------------------------------------------------------ Geld (wie Auswertung)

function rechnungNetto(r: Rechnung, alle: Rechnung[]): number {
  if (!ZAEHLT.includes(r.status)) return 0;
  let netto = summen(r.positionen).netto;
  for (const id of r.abzugRechnungIds ?? []) {
    const ab = alle.find((x) => x.id === id);
    if (ab && ZAEHLT.includes(ab.status)) netto -= summen(ab.positionen).netto;
  }
  return r.art === 'gutschrift' ? -Math.abs(netto) : netto;
}

function rechnungBrutto(r: Rechnung, alle: Rechnung[], ust: number): number {
  let brutto = summen(r.positionen, ust).brutto;
  for (const id of r.abzugRechnungIds ?? []) {
    const ab = alle.find((x) => x.id === id);
    if (ab && ZAEHLT.includes(ab.status)) brutto -= summen(ab.positionen, ust).brutto;
  }
  return r.art === 'gutschrift' ? -Math.abs(brutto) : brutto;
}

const ustVon = (b: Bestand) => (b.betrieb?.kleinunternehmer ? 0 : b.betrieb?.ustSatz ?? 19);

export interface OffenerPosten {
  rechnungId: ID;
  nummer: string;
  kunde: string;
  offen: number;
  /** Tage seit Fälligkeit (> 0 = überfällig) */
  tageUeber: number;
}

/** Offene Posten zum Stichtag – überfällige zuerst, älteste zuerst */
export function offenePosten(b: Bestand, stichtag: Datum): OffenerPosten[] {
  const ust = ustVon(b);
  const rechnungen = b.rechnungen.filter((r) => !r.geloeschtAm);
  const liste: OffenerPosten[] = [];
  for (const r of rechnungen) {
    if ((r.status !== 'versendet' && r.status !== 'teilbezahlt') || r.art === 'gutschrift') continue;
    const gezahlt = b.zahlungen.filter((z) => !z.geloeschtAm && z.rechnungId === r.id && z.datum <= stichtag).reduce((s, z) => s + z.betrag, 0);
    const offen = rechnungBrutto(r, rechnungen, ust) - gezahlt;
    if (offen <= 0) continue;
    const tageUeber = Math.round((Date.parse(stichtag + 'T12:00:00Z') - Date.parse(r.faelligAm + 'T12:00:00Z')) / 86_400_000);
    liste.push({ rechnungId: r.id, nummer: r.nummer, kunde: b.kunden.find((k) => k.id === r.kundeId)?.name ?? 'Kunde', offen, tageUeber });
  }
  return liste.sort((x, y) => y.tageUeber - x.tageUeber);
}

// ------------------------------------------------------------------ Dein Tag (Monteur, 6:30)

export interface DeinTagInhalt {
  takt: 'dein-tag';
  datum: Datum;
  /** Anzahl Termine heute */
  anzahl: number;
  erster?: {
    terminId: ID;
    auftragId?: ID;
    titel: string;
    zeit: string;
    kunde?: string;
    adresse?: string;
    vorOrt?: string;
    telefon?: string;
  };
  /** Material für die Aufträge von heute, das noch nicht verbraucht ist */
  material: { text: string; menge: number; einheit: string; status: Materialbuchung['status']; auftrag?: string }[];
  /** Zugang, Notizen, Aufgaben – kurz */
  hinweise: string[];
  abwesend?: string;
}

export function deinTag(b: Bestand, m: Mitarbeiter, uhr: Uhr): DeinTagInhalt {
  const tag = uhr.datum;
  const ab = abwesend(b, m.id, tag);
  const termine = termineAm(b, tag, m.id);
  const erster = termine.find((t) => t.status !== 'erledigt') ?? termine[0];
  const auftragIds = new Set(termine.map((t) => t.auftragId).filter(Boolean) as ID[]);
  const hinweise: string[] = [];
  let ersterInhalt: DeinTagInhalt['erster'];
  if (erster) {
    const auftrag = b.auftraege.find((a) => a.id === erster.auftragId);
    const kunde = b.kunden.find((k) => k.id === (erster.kundeId ?? auftrag?.kundeId));
    const ort = b.orte.find((o) => o.id === (erster.ortId ?? auftrag?.ortId));
    ersterInhalt = {
      terminId: erster.id,
      auftragId: erster.auftragId,
      titel: erster.titel,
      zeit: zeitspanne(erster),
      kunde: kunde?.name,
      adresse: adresseText(ort, kunde),
      vorOrt: ort?.ansprechpartnerVorOrt,
      telefon: ort?.telefonVorOrt ?? kunde?.telefon,
    };
    if (ort?.hinweise) hinweise.push(`Zugang: ${ort.hinweise}`);
    if (erster.notiz) hinweise.push(erster.notiz);
  }
  const aufgaben = b.aufgaben.filter(
    (a) => !a.geloeschtAm && !a.erledigt && ((a.zustaendigId === m.id && (!a.faellig || a.faellig <= tag)) || (!a.zustaendigId && !!a.auftragId && auftragIds.has(a.auftragId))),
  );
  for (const a of aufgaben.slice(0, 3)) hinweise.push(`Aufgabe: ${a.titel}`);
  if (aufgaben.length > 3) hinweise.push(`… und ${aufgaben.length - 3} weitere Aufgaben`);
  const material = b.material
    .filter((x) => !x.geloeschtAm && auftragIds.has(x.auftragId) && x.status !== 'verbraucht')
    .slice(0, 8)
    .map((x) => ({ text: x.text, menge: x.menge, einheit: x.einheit, status: x.status, auftrag: auftragIds.size > 1 ? b.auftraege.find((a) => a.id === x.auftragId)?.titel : undefined }));
  return {
    takt: 'dein-tag',
    datum: tag,
    anzahl: termine.length,
    erster: ersterInhalt,
    material,
    hinweise,
    abwesend: ab ? ABWESENHEIT[ab.art] : undefined,
  };
}

// ------------------------------------------------------------------ Tagesbrief (Chef/Büro, 7:00)

export const ENTSCHEIDUNGEN_MAX = 3;

export interface TagesbriefInhalt {
  takt: 'tagesbrief';
  datum: Datum;
  entscheidungen: Entscheidung[];
  /** wie viele darüber hinaus warten (stehen unter „Braucht dich“) */
  weitere: number;
  /** nur mit Recht „Preise & Geld“ */
  geld?: {
    /** "gestern" bzw. "seit Freitag" */
    seitText: string;
    eingaenge: { summe: number; anzahl: number };
    ueberfaellig: { summe: number; anzahl: number; liste: OffenerPosten[] };
  };
}

/** Letzter Werktag vor `tag` (Montag → Freitag) */
export function letzterWerktag(tag: Datum, wochentag: number): Datum {
  return plusTage(tag, wochentag === 1 ? -3 : wochentag === 7 ? -2 : -1);
}

export function tagesbrief(b: Bestand, uhr: Uhr, entscheidungen: Entscheidung[], opts: { geld: boolean }): TagesbriefInhalt {
  const tag = uhr.datum;
  const sortiert = [...entscheidungen].sort((x, y) => y.gewicht - x.gewicht);
  let geld: TagesbriefInhalt['geld'];
  if (opts.geld) {
    const seit = letzterWerktag(tag, uhr.wochentag);
    const eingaenge = b.zahlungen.filter((z) => !z.geloeschtAm && z.datum >= seit && z.datum < tag);
    const ueber = offenePosten(b, tag).filter((p) => p.tageUeber > 0);
    geld = {
      seitText: uhr.wochentag === 1 ? 'seit Freitag' : 'gestern',
      eingaenge: { summe: eingaenge.reduce((s, z) => s + z.betrag, 0), anzahl: eingaenge.length },
      ueberfaellig: { summe: ueber.reduce((s, p) => s + p.offen, 0), anzahl: ueber.length, liste: ueber.slice(0, 3) },
    };
  }
  return {
    takt: 'tagesbrief',
    datum: tag,
    entscheidungen: sortiert.slice(0, ENTSCHEIDUNGEN_MAX),
    weitere: Math.max(0, sortiert.length - ENTSCHEIDUNGEN_MAX),
    geld,
  };
}

/**
 * Entscheidungen direkt aus den gespeicherten Daten – für den Server, der die live berechneten
 * Hinweise der Module nicht kennt: gespeicherte Hinweise, Urlaubsanträge, überfällige Rechnungen.
 * Im Browser kommen die Entscheidungen aus `offeneHinweise()` (vollständig).
 */
export function entscheidungenAusBestand(b: Bestand & { hinweise?: { id: ID; status: string; art: Entscheidung['art']; titel: string; text?: string; gewicht: number; schluessel?: string; fuerRollen?: string[]; fuerMitarbeiterId?: ID; aktionen?: { id: string; label: string; primaer?: boolean; payload?: unknown }[]; geloeschtAm?: string }[] }, m: Mitarbeiter, uhr: Uhr, opts: { geld: boolean; personal: boolean }): Entscheidung[] {
  const liste: Entscheidung[] = [];
  const gesehen = new Set<string>();
  for (const h of b.hinweise ?? []) {
    if (h.geloeschtAm || h.status !== 'offen') continue;
    if (h.fuerMitarbeiterId ? h.fuerMitarbeiterId !== m.id : h.fuerRollen ? !h.fuerRollen.includes(m.rolle) : m.rolle !== 'chef' && m.rolle !== 'buero') continue;
    const schluessel = h.schluessel ?? h.id;
    gesehen.add(schluessel);
    liste.push({ schluessel, titel: h.titel, text: h.text, art: h.art, gewicht: h.gewicht, aktionen: (h.aktionen ?? []).map((a) => ({ aktion: a.id, label: a.label, primaer: a.primaer, payload: a.payload })) });
  }
  if (opts.personal || m.rolle === 'chef') {
    for (const a of b.abwesenheiten.filter((x) => !x.geloeschtAm && x.status === 'beantragt' && !x.beispiel)) {
      const wer = b.mitarbeiter.find((x) => x.id === a.mitarbeiterId);
      const schluessel = `abwesenheit-beantragt:${a.id}`;
      if (gesehen.has(schluessel)) continue;
      liste.push({
        schluessel,
        titel: `${a.art === 'urlaub' ? 'Urlaub' : 'Abwesenheit'} beantragt: ${wer ? `${wer.vorname} ${wer.nachname}`.trim() : 'Mitarbeiter'}`,
        text: a.von === a.bis ? `am ${a.von.split('-').reverse().join('.')}` : `${a.von.split('-').reverse().join('.')} bis ${a.bis.split('-').reverse().join('.')}`,
        art: 'freigabe',
        gewicht: 60,
        pfad: `/betrieb/abwesenheiten`,
        aktionen: [
          { aktion: 'abwesenheit.genehmigen', label: 'Genehmigen', primaer: true, payload: { id: a.id } },
          { aktion: 'abwesenheit.ablehnen', label: 'Ablehnen', payload: { id: a.id } },
        ],
      });
    }
  }
  if (opts.geld) {
    for (const p of offenePosten(b, uhr.datum).filter((x) => x.tageUeber > 7).slice(0, 3)) {
      liste.push({
        schluessel: `rechnung-ueberfaellig:${p.rechnungId}`,
        titel: `Überfällig: ${p.nummer} · ${p.kunde}`,
        text: `${euro(p.offen)} offen, seit ${p.tageUeber} Tagen fällig.`,
        art: 'entscheidung',
        gewicht: 50,
        pfad: `/betrieb/rechnungen/${p.rechnungId}`,
        aktionen: [],
      });
    }
  }
  return liste;
}

// ------------------------------------------------------------------ Zeiten bestätigen (Monteur, 16:30)

export interface ZeitenInhalt {
  takt: 'zeiten';
  datum: Datum;
  eintraege: { id: ID; start: string; ende?: string; pause: number; titel: string; minuten: number }[];
  minuten: number;
  /** läuft noch – wird beim Bestätigen beendet */
  laeuft?: { id: ID; start: string; titel: string };
  /** Termine heute, zu denen keine Zeit erfasst ist */
  termineOhneZeit: { terminId: ID; titel: string; zeit: string }[];
  bestaetigt: boolean;
}

export function zeitenHeute(b: Bestand, m: Mitarbeiter, uhr: Uhr, bestaetigt = false): ZeitenInhalt {
  const tag = uhr.datum;
  const zeiten = b.zeiten.filter((z) => !z.geloeschtAm && z.mitarbeiterId === m.id && z.datum === tag).sort((x, y) => x.start.localeCompare(y.start));
  const titel = (z: Zeiteintrag) => b.auftraege.find((a) => a.id === z.auftragId)?.titel ?? ZEIT_ART[z.art];
  const laufend = zeiten.find((z) => !z.ende);
  const erfasst = new Set(zeiten.flatMap((z) => [z.terminId, z.auftragId]).filter(Boolean));
  const termineOhneZeit = termineAm(b, tag, m.id)
    .filter((t) => (t.art === 'einsatz' || t.art === 'wartung' || t.art === 'abnahme' || t.art === 'besichtigung') && !erfasst.has(t.id) && !(t.auftragId && erfasst.has(t.auftragId)))
    .map((t) => ({ terminId: t.id, titel: t.titel, zeit: zeitspanne(t) }));
  const eintraege = zeiten.filter((z) => z.ende).map((z) => ({ id: z.id, start: z.start, ende: z.ende, pause: z.pauseMinuten || 0, titel: titel(z), minuten: minutenVon(z) }));
  return {
    takt: 'zeiten',
    datum: tag,
    eintraege,
    minuten: eintraege.reduce((s, e) => s + e.minuten, 0),
    laeuft: laufend ? { id: laufend.id, start: laufend.start, titel: titel(laufend) } : undefined,
    termineOhneZeit,
    bestaetigt,
  };
}

// ------------------------------------------------------------------ Wochenbilanz (Chef, Fr 15:00)

export interface WochenbilanzInhalt {
  takt: 'wochenbilanz';
  von: Datum;
  bis: Datum;
  umsatz: { netto: number; anzahl: number };
  offen: { summe: number; anzahl: number; ueberfaellig: number; anzahlUeberfaellig: number };
  auftraege: { neu: number; abgeschlossen: number; laufend: number };
  /** „Macher hat erledigt“ – Minuten sind eine Schätzung je Regel */
  erledigt: { anzahl: number; minuten: number };
}

/** wie `LAUFEND` in `modules/nachkalkulation/daten.ts` */
const LAUFEND: Auftrag['phase'][] = ['beauftragt', 'in_arbeit', 'abnahme'];

export function wochenbilanz(b: Bestand, uhr: Uhr, opts: { rueckgaengig?: Set<ID> } = {}): WochenbilanzInhalt {
  const bis = uhr.datum;
  const von = wochenStart(bis);
  const drin = (d: string | undefined) => !!d && d.slice(0, 10) >= von && d.slice(0, 10) <= bis;
  const rechnungen = b.rechnungen.filter((r) => !r.geloeschtAm);
  const umsatzListe = rechnungen.filter((r) => ZAEHLT.includes(r.status) && drin(r.datum));
  const posten = offenePosten(b, bis);
  const ueber = posten.filter((p) => p.tageUeber > 0);
  const auftraege = b.auftraege.filter((a) => !a.geloeschtAm);
  const erledigt = b.erledigungen.filter((e) => !e.geloeschtAm && drin(tagVon(e.erstelltAm)) && !opts.rueckgaengig?.has(e.id));
  return {
    takt: 'wochenbilanz',
    von,
    bis,
    umsatz: { netto: umsatzListe.reduce((s, r) => s + rechnungNetto(r, rechnungen), 0), anzahl: umsatzListe.length },
    offen: { summe: posten.reduce((s, p) => s + p.offen, 0), anzahl: posten.length, ueberfaellig: ueber.reduce((s, p) => s + p.offen, 0), anzahlUeberfaellig: ueber.length },
    auftraege: {
      neu: auftraege.filter((a) => drin(tagVon(a.erstelltAm))).length,
      abgeschlossen: auftraege.filter((a) => a.abgeschlossenAm && drin(tagVon(a.abgeschlossenAm))).length,
      laufend: auftraege.filter((a) => LAUFEND.includes(a.phase)).length,
    },
    erledigt: { anzahl: erledigt.length, minuten: erledigt.reduce((s, e) => s + (e.minutenGespart && e.minutenGespart > 0 ? e.minutenGespart : 0), 0) },
  };
}

export type TaktInhalt = DeinTagInhalt | TagesbriefInhalt | ZeitenInhalt | WochenbilanzInhalt;

export type { TaktId };
