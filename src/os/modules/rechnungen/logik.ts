/**
 * Rechnungslogik: Summen, offene Beträge, Erstellen aus dem Auftrag, Pflichtangaben,
 * Festschreiben (GoBD), Storno. Reine Logik über `db` – ohne Oberfläche, mit Tests.
 */
import { db, neueId, vermerken } from '@core/db';
import { emit } from '@core/events';
import { einstellung } from '@core/einstellungen';
import { datum, euro, heute, plusTage, summen, tageZwischen, type Summen, minutenAus } from '@core/format';
import { naechsteDokumentNummer, type NummerArt } from '@modules/dokumente/nummern';
import type { Betrieb, Cent, Datum, ID, Kunde, Position, RechnungsArt } from '@core/objects';
import { alleRechnungen, rechnungAendern, rechnungX, type RechnungX } from './typen';
import { alsPositionen } from '@modules/material-am-auftrag/logik';
import { materialAufschlagProzent } from '@modules/material-am-auftrag/daten';
import { abrechenbareZu, alsAbgerechnetMarkieren, alsPosition, vonRechnungLoesen, type Zusatzleistung } from '@modules/zusatzleistungen/daten';

export const ART_LABEL: Record<RechnungsArt, string> = {
  rechnung: 'Rechnung',
  abschlag: 'Abschlagsrechnung',
  teil: 'Teilrechnung',
  schluss: 'Schlussrechnung',
  gutschrift: 'Gutschrift',
};

export const betrieb = (): Betrieb | undefined => db.betrieb.get('betrieb');

/** Rechnung ist festgeschrieben (Nummer vergeben, unveränderbar) */
export const istFestgeschrieben = (r: RechnungX) => r.status !== 'entwurf';

export const istStorno = (r: RechnungX) => !!r.stornoFuerId;

export function ustSatzFuer(r: Pick<RechnungX, 'reverseCharge'>, b: Betrieb | undefined = betrieb()): number {
  if (b?.kleinunternehmer || r.reverseCharge) return 0;
  return b?.ustSatz ?? 19;
}

export interface RechnungsAbzug {
  id: ID;
  nummer: string;
  datum: Datum;
  /** in Rechnung gestellt (netto, USt, brutto) */
  netto: Cent;
  ust: Cent;
  brutto: Cent;
  /** davon bezahlt (inkl. Skonto) – beim Festschreiben eingefroren */
  gezahlt: Cent;
}

export interface RechnungsSummen extends Summen {
  ustSatz: number;
  /** in Rechnung gestellte Abschlags-/Teilrechnungen (für Netto und USt) */
  abzugNetto: Cent;
  abzugUst: Cent;
  abzugBrutto: Cent;
  /** davon bezahlt – nur das wird vom Gesamtbetrag abgezogen */
  abzugGezahlt: Cent;
  /** noch nicht bezahlter Teil der Abschläge: steckt im Zahlbetrag, die Abschläge gelten damit als verrechnet */
  offenAusAbzuegen: Cent;
  /** Sicherheitseinbehalt in Prozent vom Gesamtbetrag und als Betrag */
  einbehaltProzent: number;
  einbehalt: Cent;
  /** was der Kunde mit dieser Rechnung zahlen soll */
  zahlbetrag: Cent;
  abzuege: RechnungsAbzug[];
}

/**
 * Summen einer Rechnung in Cent.
 * Schlussrechnung: Gesamtbetrag aller Leistungen, abzüglich der **gezahlten** Abschläge (§ 14 Abs. 5 UStG: vereinnahmte
 * Teilentgelte absetzen). Nicht bezahlte Abschläge stecken im Zahlbetrag und gelten mit dem Festschreiben als verrechnet.
 * Sicherheitseinbehalt: Prozent vom Gesamtbetrag, mindert den Zahlbetrag (fällig nach der Gewährleistung).
 * Storno: alle Beträge mit umgekehrtem Vorzeichen.
 */
export function rechnungsSummen(r: RechnungX, b: Betrieb | undefined = betrieb()): RechnungsSummen {
  const satz = ustSatzFuer(r, b);
  const s = summen(r.positionen, satz);
  const vorzeichen = r.stornoFuerId ? -1 : 1;
  const abzuege: RechnungsAbzug[] = [];
  for (const id of r.abzugRechnungIds ?? []) {
    const a = rechnungX(id);
    if (!a || a.status === 'entwurf') continue;
    if (a.status === 'storniert' && !r.stornoFuerId) continue;
    const sa = summen(a.positionen, ustSatzFuer(a, b));
    const stand = r.abzugStand?.[a.id];
    const gezahlt = stand ?? Math.min(sa.brutto, Math.max(0, beglichen(a.id)));
    abzuege.push({ id: a.id, nummer: a.nummer, datum: a.datum, netto: sa.netto * vorzeichen, ust: sa.ust * vorzeichen, brutto: sa.brutto * vorzeichen, gezahlt: gezahlt * vorzeichen });
  }
  const summe = (f: (a: RechnungsAbzug) => Cent) => abzuege.reduce((x, a) => x + f(a), 0);
  const abzugBrutto = summe((a) => a.brutto);
  const abzugGezahlt = summe((a) => a.gezahlt);
  const einbehaltProzent = Math.max(0, r.einbehaltProzent ?? 0);
  const einbehalt = Math.round((s.brutto * einbehaltProzent) / 100);
  return {
    ...s,
    ustSatz: satz,
    abzugNetto: summe((a) => a.netto),
    abzugUst: summe((a) => a.ust),
    abzugBrutto,
    abzugGezahlt,
    offenAusAbzuegen: abzugBrutto - abzugGezahlt,
    einbehaltProzent,
    einbehalt,
    zahlbetrag: s.brutto - abzugGezahlt - einbehalt,
    abzuege,
  };
}

export interface SummenZeileDaten {
  label: string;
  wert: Cent;
  /** Gesamt- bzw. Zahlbetrag hervorheben */
  gesamt?: boolean;
  klein?: string;
}

/** Die Summenzeilen einer Rechnung – gleich für Bildschirm, Druck/PDF und E-Mail */
export function summenZeilen(s: RechnungsSummen, kleinunternehmer?: boolean): SummenZeileDaten[] {
  const extra = s.abzuege.length > 0 || s.einbehalt !== 0;
  const z: SummenZeileDaten[] = [{ label: 'Summe netto', wert: s.netto }];
  if (!kleinunternehmer) z.push({ label: `zzgl. USt ${s.ustSatz} %`, wert: s.ust });
  z.push({ label: 'Gesamtbetrag', wert: s.brutto, gesamt: !extra });
  for (const a of s.abzuege) {
    const ustAnteil = a.brutto ? Math.round((a.gezahlt * a.ust) / a.brutto) : 0;
    const rest = a.brutto - a.gezahlt;
    z.push({
      label: `abzüglich gezahlt auf ${a.nummer} vom ${datum(a.datum)}`,
      wert: -a.gezahlt,
      klein: [
        `berechnet ${euro(a.brutto)} (netto ${euro(a.netto)}, USt ${euro(a.ust)})`,
        a.gezahlt ? `gezahlt darin USt ${euro(ustAnteil)}` : '',
        rest ? `noch offen ${euro(rest)} – hier verrechnet` : '',
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }
  if (s.einbehalt) z.push({ label: `abzüglich Sicherheitseinbehalt ${String(s.einbehaltProzent).replace('.', ',')} %`, wert: -s.einbehalt });
  if (extra) z.push({ label: 'Zahlbetrag', wert: s.zahlbetrag, gesamt: true });
  return z;
}

/** Abschlags-/Teilrechnung, die eine festgeschriebene Schlussrechnung schon verrechnet hat */
export function verrechnetIn(r: RechnungX, alle: RechnungX[] = alleRechnungen()): RechnungX | undefined {
  if (r.art !== 'abschlag' && r.art !== 'teil') return undefined;
  return alle.find((x) => x.id !== r.id && x.status !== 'entwurf' && x.status !== 'storniert' && !x.stornoFuerId && !!x.abzugRechnungIds?.includes(r.id));
}

// ------------------------------------------------------------------ Zahlungen & offene Beträge

export const zahlungenZu = (rechnungId: ID) => db.zahlungen.where((z) => z.rechnungId === rechnungId);

/** beglichen = gezahlt + abgezogenes Skonto */
export function beglichen(rechnungId: ID): Cent {
  return zahlungenZu(rechnungId).reduce((s, z) => s + z.betrag + (z.skonto ?? 0), 0);
}

export function offenerBetrag(r: RechnungX): Cent {
  if (r.status === 'entwurf' || r.status === 'storniert' || r.art === 'gutschrift') return 0;
  if (verrechnetIn(r)) return 0;
  return Math.max(0, rechnungsSummen(r).zahlbetrag - beglichen(r.id));
}

/** Status, der sich aus den Zahlungen ergibt (nur für festgeschriebene Rechnungen) */
export function statusAusZahlungen(r: RechnungX): RechnungX['status'] {
  if (r.status === 'entwurf' || r.status === 'storniert' || r.art === 'gutschrift') return r.status;
  const soll = rechnungsSummen(r).zahlbetrag;
  const ist = beglichen(r.id);
  if (ist <= 0) return 'versendet';
  return ist >= soll ? 'bezahlt' : 'teilbezahlt';
}

export function istUeberfaellig(r: RechnungX, stichtag: Datum = heute()) {
  return (r.status === 'versendet' || r.status === 'teilbezahlt') && r.art !== 'gutschrift' && r.faelligAm < stichtag && offenerBetrag(r) > 0;
}

export function tageUeberfaellig(r: RechnungX, stichtag: Datum = heute()) {
  return Math.max(0, tageZwischen(r.faelligAm, stichtag));
}

/** Offene Posten: festgeschrieben, nicht bezahlt, keine Gutschrift */
export function offenePosten(): RechnungX[] {
  return alleRechnungen()
    .filter((r) => (r.status === 'versendet' || r.status === 'teilbezahlt') && r.art !== 'gutschrift')
    .filter((r) => offenerBetrag(r) > 0)
    .sort((a, b) => a.faelligAm.localeCompare(b.faelligAm));
}

export function offenFuerKunde(kundeId: ID) {
  const liste = offenePosten().filter((r) => r.kundeId === kundeId);
  const summe = liste.reduce((s, r) => s + offenerBetrag(r), 0);
  const ueber = liste.filter((r) => istUeberfaellig(r));
  return { liste, summe, ueberfaellig: ueber, ueberfaelligSumme: ueber.reduce((s, r) => s + offenerBetrag(r), 0) };
}

// ------------------------------------------------------------------ Status für die Anzeige

export function statusText(r: RechnungX): { text: string; ton: 'neutral' | 'aktiv' | 'erfolg' | 'achtung' } {
  if (r.status === 'entwurf') return { text: 'Entwurf', ton: 'neutral' };
  if (r.status === 'storniert') return { text: 'Storniert', ton: 'neutral' };
  if (r.stornoFuerId) return { text: 'Storno', ton: 'neutral' };
  if (r.art === 'gutschrift') return { text: 'Gutschrift', ton: 'neutral' };
  if (r.status === 'bezahlt') return { text: 'Bezahlt', ton: 'erfolg' };
  const verrechnet = verrechnetIn(r);
  if (verrechnet) return { text: `Verrechnet mit ${verrechnet.nummer}`, ton: 'neutral' };
  if (istUeberfaellig(r)) {
    const t = tageUeberfaellig(r);
    return { text: t === 1 ? 'Seit 1 Tag überfällig' : `Seit ${t} Tagen überfällig`, ton: 'achtung' };
  }
  if (r.status === 'teilbezahlt') return { text: 'Teilbezahlt', ton: 'aktiv' };
  return { text: 'Offen', ton: 'aktiv' };
}

export const nummerText = (r: RechnungX) => r.nummer || 'Entwurf';

/** Dokumentart für den Nummernkreis (Storno hat einen eigenen Eintrag) */
export const nummerArt = (r: Pick<RechnungX, 'art' | 'stornoFuerId'>): NummerArt => (r.stornoFuerId ? 'storno' : r.art);

/** Nächste Nummer für diese Rechnung (Nummernkreis je Art aus der Dokumenten-Engine, Standard „R“) */
export function rechnungsNummer(r: Pick<RechnungX, 'art' | 'stornoFuerId' | 'nummernkreis'>): string {
  return naechsteDokumentNummer(nummerArt(r), db.rechnungen.allMitGeloeschten().map((x) => x.nummer), r.nummernkreis);
}

// ------------------------------------------------------------------ Rechnung aus Auftrag

export interface Vorschau {
  art: RechnungsArt;
  titel: string;
  positionen: Position[];
  /** Woher kommen die Positionen – als Text für die Oberfläche */
  quellen: string[];
  /** Was fehlt oder geprüft werden sollte */
  hinweise: string[];
  angebotId?: ID;
  materialIds: ID[];
  zeitIds: ID[];
  zusatzleistungIds: ID[];
  abzugRechnungIds: ID[];
  leistungVon?: Datum;
  leistungBis?: Datum;
  leistungszeitraum?: string;
  abschlagProzent?: number;
}

export interface VorschauOptionen {
  /** Zeiten und Material nach Aufwand abrechnen (Standard: wenn kein Angebot angenommen ist) */
  nachAufwand?: boolean;
  /** Abschlag in Prozent der Angebotssumme */
  prozent?: number;
}

const pos = (p: Omit<Position, 'id'>): Position => ({ id: neueId('p'), ...p });

/** Rechnungen eines Auftrags, die noch zählen (nicht storniert, keine Stornos) */
export function gueltigeRechnungen(auftragId: ID): RechnungX[] {
  return alleRechnungen().filter((r) => r.auftragId === auftragId && r.status !== 'storniert' && !r.stornoFuerId);
}

export function angenommenesAngebot(auftragId: ID) {
  return db.angebote
    .where((a) => a.auftragId === auftragId && a.status === 'angenommen')
    .sort((a, b) => b.version - a.version || b.datum.localeCompare(a.datum))[0];
}

function stunden(start: string, ende: string, pause: number) {
  const min = minutenAus(ende) - minutenAus(start) - (pause || 0);
  return Math.max(0, min) / 60;
}

const viertel = (h: number) => Math.round(h * 4) / 4;

/** Freigegebene, noch nicht abgerechnete Zusatzleistungen (Sammlung `zusatzleistungen`, Paket doku) */
export function abrechenbareZusatzleistungen(auftragId: ID): Zusatzleistung[] {
  return abrechenbareZu(auftragId);
}

function leistungszeitraumText(von?: Datum, bis?: Datum) {
  if (!von) return undefined;
  if (!bis || bis === von) return datum(von);
  return `${datum(von)} – ${datum(bis)}`;
}

export function rechnungsVorschau(auftragId: ID, art: RechnungsArt = 'rechnung', opts: VorschauOptionen = {}): Vorschau {
  const auftrag = db.auftraege.get(auftragId);
  const b = betrieb();
  const v: Vorschau = {
    art,
    titel: auftrag?.titel ?? 'Rechnung',
    positionen: [],
    quellen: [],
    hinweise: [],
    materialIds: [],
    zeitIds: [],
    zusatzleistungIds: [],
    abzugRechnungIds: [],
  };
  if (!auftrag) {
    v.hinweise.push('Den Auftrag gibt es nicht mehr.');
    return v;
  }
  const angebot = angenommenesAngebot(auftragId);
  const bisher = gueltigeRechnungen(auftragId);

  // Leistungszeitraum aus Zeiten und Terminen
  const tage = [
    ...db.zeiten.where((z) => z.auftragId === auftragId).map((z) => z.datum),
    ...db.termine
      .where((t) => t.auftragId === auftragId && t.status !== 'abgesagt' && t.start.slice(0, 10) <= heute())
      .map((t) => t.start.slice(0, 10)),
  ].sort();
  if (tage.length) {
    v.leistungVon = tage[0];
    v.leistungBis = tage[tage.length - 1];
    v.leistungszeitraum = leistungszeitraumText(v.leistungVon, v.leistungBis);
  }

  if (art === 'abschlag') {
    const prozent = opts.prozent ?? einstellung('rechnungen.abschlagProzent', 30);
    const nr = bisher.filter((r) => r.art === 'abschlag').length + 1;
    v.titel = `${nr}. Abschlag – ${auftrag.titel}`;
    v.abschlagProzent = prozent;
    if (angebot) {
      const basis = summen(angebot.positionen, 0, angebot.rabattProzent ?? 0).netto;
      v.angebotId = angebot.id;
      v.positionen.push(
        pos({ art: 'pauschal', text: `${nr}. Abschlag (${prozent} %) gemäß Angebot ${angebot.nummer} vom ${datum(angebot.datum)}`, menge: 1, einheit: 'Psch', einzelpreis: Math.round((basis * prozent) / 100) }),
      );
      v.quellen.push(`${prozent} % von ${euro(basis)} netto aus Angebot ${angebot.nummer}`);
    } else {
      v.positionen.push(pos({ art: 'pauschal', text: `${nr}. Abschlag`, menge: 1, einheit: 'Psch', einzelpreis: 0 }));
      v.hinweise.push('Kein angenommenes Angebot gefunden. Trag den Abschlagsbetrag selbst ein.');
    }
    return v;
  }

  if (art === 'gutschrift') {
    v.titel = `Gutschrift – ${auftrag.titel}`;
    v.positionen.push(pos({ art: 'pauschal', text: 'Gutschrift', menge: -1, einheit: 'Psch', einzelpreis: 0 }));
    return v;
  }

  if (art === 'schluss') v.titel = `Schlussrechnung – ${auftrag.titel}`;
  if (art === 'teil') v.titel = `Teilrechnung – ${auftrag.titel}`;

  const nachAufwand = opts.nachAufwand ?? !angebot;
  const schonAbgerechnet = (feld: 'zeitIds' | 'zusatzleistungIds') => new Set(bisher.flatMap((r) => r[feld] ?? []));

  // 1. Angebot (bei Abrechnung nach Angebot)
  const angebotArtikel = new Set<ID>();
  const angebotLeistungIstLohn = new Set<ID>();
  if (angebot && !nachAufwand) {
    v.angebotId = angebot.id;
    for (const p of angebot.positionen) {
      if (p.optional || p.art === 'zwischensumme') continue;
      if (p.artikelId) angebotArtikel.add(p.artikelId);
      if (p.einheit === 'h' && p.leistungId) angebotLeistungIstLohn.add(p.leistungId);
      v.positionen.push({ ...p, id: neueId('p') });
    }
    if (angebot.rabattProzent) {
      const basis = summen(angebot.positionen, 0).netto;
      v.positionen.push(pos({ art: 'pauschal', text: `Rabatt ${angebot.rabattProzent} % laut Angebot`, menge: 1, einheit: 'Psch', einzelpreis: -Math.round((basis * angebot.rabattProzent) / 100) }));
    }
    v.quellen.push(`Positionen aus Angebot ${angebot.nummer}`);
    if (art === 'schluss' || art === 'rechnung') {
      const vorher = bisher.filter((r) => (r.art === 'abschlag' || r.art === 'teil') && r.status !== 'entwurf');
      if (art === 'rechnung' && vorher.length) v.hinweise.push('Es gibt schon Abschlags- oder Teilrechnungen. Wähle „Schlussrechnung“, damit sie abgezogen werden.');
    }
  } else if (angebot && nachAufwand) {
    v.quellen.push(`Abrechnung nach Aufwand (Angebot ${angebot.nummer} nur als Richtwert)`);
  }

  // 2. Verbrauchtes Material, noch nicht abgerechnet (Positionen wie im Modul „Material am Auftrag“)
  const material = db.material
    .where((m) => m.auftragId === auftragId && m.status === 'verbraucht' && !m.abgerechnetIn)
    .filter((m) => nachAufwand || !m.artikelId || !angebotArtikel.has(m.artikelId));
  v.positionen.push(...alsPositionen(material, (id) => db.artikel.get(id), materialAufschlagProzent()));
  v.materialIds.push(...material.map((m) => m.id));
  if (v.materialIds.length) v.quellen.push(v.materialIds.length === 1 ? '1 verbrauchte Materialbuchung' : `${v.materialIds.length} verbrauchte Materialbuchungen`);

  // 3. Zeiten (nur nach Aufwand)
  if (nachAufwand) {
    const vergeben = schonAbgerechnet('zeitIds');
    const zeiten = db.zeiten.where((z) => z.auftragId === auftragId && !!z.ende && !vergeben.has(z.id) && (z.art === 'arbeit' || z.art === 'fahrt'));
    const satz = b?.stundensatz ?? 0;
    for (const zart of ['arbeit', 'fahrt'] as const) {
      const liste = zeiten.filter((z) => z.art === zart);
      const h = viertel(liste.reduce((s, z) => s + stunden(z.start, z.ende!, z.pauseMinuten), 0));
      if (!h) continue;
      v.positionen.push(pos({ art: 'lohn', text: zart === 'arbeit' ? 'Arbeitszeit' : 'Fahrtzeit', menge: h, einheit: 'h', einzelpreis: satz }));
      v.zeitIds.push(...liste.map((z) => z.id));
    }
    if (v.zeitIds.length) v.quellen.push(`${v.zeitIds.length === 1 ? '1 Zeiteintrag' : `${v.zeitIds.length} Zeiteinträge`} × Stundensatz ${euro(satz)}`);
    if (!satz && v.zeitIds.length) v.hinweise.push('In deinen Betriebsdaten fehlt der Stundensatz.');
    if (zeiten.some((z) => !z.freigegeben)) v.hinweise.push('Einige Zeiten sind noch nicht freigegeben. Prüf die Stunden.');
  }

  // 4. Freigegebene Zusatzleistungen (Nachträge)
  const zusatzVergeben = schonAbgerechnet('zusatzleistungIds');
  for (const z of abrechenbareZusatzleistungen(auftragId)) {
    if (zusatzVergeben.has(z.id)) continue;
    v.positionen.push(alsPosition(z));
    v.zusatzleistungIds.push(z.id);
  }
  if (v.zusatzleistungIds.length) v.quellen.push(`${v.zusatzleistungIds.length === 1 ? '1 Zusatzleistung' : `${v.zusatzleistungIds.length} Zusatzleistungen`}`);

  // 5. Schlussrechnung: Abschläge und Teilrechnungen abziehen
  if (art === 'schluss') {
    const abzug = bisher.filter((r) => (r.art === 'abschlag' || r.art === 'teil') && r.status !== 'entwurf');
    v.abzugRechnungIds = abzug.map((r) => r.id);
    if (abzug.length) v.quellen.push(`abzüglich bezahlter Abschläge aus ${abzug.map((r) => r.nummer).join(', ')}`);
    for (const r of abzug) {
      const offen = summen(r.positionen, ustSatzFuer(r, b)).brutto - Math.max(0, beglichen(r.id));
      if (offen > 0) v.hinweise.push(`${r.nummer} ist noch nicht ganz bezahlt (${euro(offen)} offen). Der Rest steht in dieser Schlussrechnung, ${r.nummer} gilt danach als verrechnet.`);
    }
    if (bisher.some((r) => (r.art === 'abschlag' || r.art === 'teil') && r.status === 'entwurf'))
      v.hinweise.push('Es gibt noch einen nicht versendeten Abschlags-Entwurf. Er wird nicht abgezogen.');
  }

  if (!v.positionen.length) v.hinweise.push('Nichts Abrechenbares gefunden. Füge die Positionen selbst hinzu.');
  return v;
}

/** Welche Rechnung passt jetzt? Gibt es schon festgeschriebene Abschläge oder Teilrechnungen → Schlussrechnung. */
export function passendeArt(auftragId: ID): RechnungsArt {
  return gueltigeRechnungen(auftragId).some((r) => (r.art === 'abschlag' || r.art === 'teil') && r.status !== 'entwurf') ? 'schluss' : 'rechnung';
}

/** Ist der Auftrag fertig abgerechnet (Rechnung oder Schlussrechnung vorhanden)? */
export function abschlussRechnung(auftragId: ID): RechnungX | undefined {
  return gueltigeRechnungen(auftragId).find((r) => r.art === 'rechnung' || r.art === 'schluss');
}

/** Fortgeschrittene Angaben – in der Oberfläche hinter „Weitere Optionen“ */
export interface RechnungsOptionen {
  /** Sicherheitseinbehalt in Prozent */
  einbehaltProzent?: number;
  /** Zahlungsziel in Tagen (sonst Kunde bzw. Betrieb) */
  zielTage?: number;
  /** § 13b UStG */
  reverseCharge?: boolean;
  /** eigenes Nummernkürzel nur für diese Rechnung */
  nummernkreis?: string;
}

/** Optionen an einen Entwurf hängen (nur Entwürfe – Festgeschriebenes bleibt unverändert) */
export function optionenSetzen(id: ID, o: RechnungsOptionen): RechnungX | undefined {
  const r = rechnungX(id);
  if (!r || r.status !== 'entwurf') return r;
  const patch: Partial<RechnungX> = {};
  if (o.einbehaltProzent !== undefined) patch.einbehaltProzent = o.einbehaltProzent > 0 ? Math.min(100, o.einbehaltProzent) : undefined;
  if (o.zielTage !== undefined) patch.faelligAm = plusTage(r.datum, Math.max(0, Math.round(o.zielTage)));
  if (o.reverseCharge !== undefined) patch.reverseCharge = o.reverseCharge || undefined;
  if (o.nummernkreis !== undefined) patch.nummernkreis = o.nummernkreis.trim().toUpperCase() || undefined;
  return rechnungAendern(id, patch, { leise: true });
}

/** Fachliches Event, wenn ein Rechnungsentwurf entsteht */
function erstelltMelden(r: RechnungX) {
  emit({ typ: 'rechnung.erstellt', sammlung: 'rechnungen', objekt: r, daten: { art: r.art, auftragId: r.auftragId } });
}

/**
 * Rechnungsentwurf aus einem Auftrag. Gibt es schon einen Entwurf derselben Art, wird er zurückgegeben.
 * Material und Zusatzleistungen werden als abgerechnet markiert, damit nichts doppelt in Rechnung gestellt wird.
 */
export function rechnungErstellen(auftragId: ID, art: RechnungsArt = 'rechnung', opts: VorschauOptionen & RechnungsOptionen & { vonMacher?: boolean } = {}): RechnungX | undefined {
  const auftrag = db.auftraege.get(auftragId);
  if (!auftrag) return undefined;
  const vorhanden = alleRechnungen().find((r) => r.auftragId === auftragId && r.status === 'entwurf' && r.art === art);
  if (vorhanden) return vorhanden;
  const v = rechnungsVorschau(auftragId, art, opts);
  const kunde = db.kunden.get(auftrag.kundeId);
  const ziel = opts.zielTage ?? kunde?.zahlungszielTage ?? betrieb()?.zahlungszielTage ?? 14;
  const neu: Omit<RechnungX, 'id' | 'erstelltAm' | 'geaendertAm'> = {
    nummer: '',
    art,
    auftragId,
    kundeId: auftrag.kundeId,
    titel: v.titel,
    positionen: v.positionen,
    abzugRechnungIds: v.abzugRechnungIds.length ? v.abzugRechnungIds : undefined,
    status: 'entwurf',
    datum: heute(),
    leistungszeitraum: v.leistungszeitraum,
    leistungVon: v.leistungVon,
    leistungBis: v.leistungBis,
    faelligAm: plusTage(heute(), ziel),
    mahnstufe: 0,
    angebotId: v.angebotId,
    materialIds: v.materialIds,
    zeitIds: v.zeitIds,
    zusatzleistungIds: v.zusatzleistungIds,
    abschlagProzent: v.abschlagProzent,
    vonMacher: opts.vonMacher,
    einbehaltProzent: opts.einbehaltProzent && opts.einbehaltProzent > 0 ? opts.einbehaltProzent : undefined,
    reverseCharge: opts.reverseCharge || undefined,
    nummernkreis: opts.nummernkreis?.trim().toUpperCase() || undefined,
    beispiel: auftrag.beispiel,
  };
  const r = db.rechnungen.create(neu);
  for (const id of v.materialIds) db.material.update(id, { abgerechnetIn: r.id }, { leise: true });
  alsAbgerechnetMarkieren(v.zusatzleistungIds, r);
  vermerken({ typ: 'auftraege', id: auftragId }, 'rechnung.entwurf', `${ART_LABEL[art]} als Entwurf angelegt`);
  erstelltMelden(r);
  return r;
}

/** Freie Rechnung ohne Auftrag (z. B. Kleinauftrag am Telefon) */
export function freieRechnung(kundeId: ID): RechnungX {
  const kunde = db.kunden.get(kundeId);
  const ziel = kunde?.zahlungszielTage ?? betrieb()?.zahlungszielTage ?? 14;
  const r = db.rechnungen.create({
    nummer: '',
    art: 'rechnung',
    kundeId,
    titel: 'Rechnung',
    positionen: [{ id: neueId('p'), art: 'leistung', text: '', menge: 1, einheit: 'Stk', einzelpreis: 0 }],
    status: 'entwurf',
    datum: heute(),
    faelligAm: plusTage(heute(), ziel),
    mahnstufe: 0,
  });
  erstelltMelden(r);
  return r;
}

/** Entwurf verwerfen – Material und Zusatzleistungen werden wieder freigegeben. Festgeschriebene Rechnungen bleiben (GoBD). */
export function entwurfLoeschen(id: ID): boolean {
  const r = rechnungX(id);
  if (!r || r.status !== 'entwurf') return false;
  materialFreigeben(r.id);
  vonRechnungLoesen(r.id);
  db.rechnungen.remove(id);
  return true;
}

function materialFreigeben(rechnungId: ID) {
  for (const m of db.material.where((x) => x.abgerechnetIn === rechnungId)) db.material.update(m.id, { abgerechnetIn: undefined }, { leise: true });
}

// ------------------------------------------------------------------ Pflichtangaben § 14 UStG

export interface Mangel {
  feld: string;
  text: string;
  /** wo man es behebt */
  wo: 'betrieb' | 'kunde' | 'rechnung';
}

export function pflichtangabenPruefen(r: RechnungX, b: Betrieb | undefined = betrieb(), k: Kunde | undefined = db.kunden.get(r.kundeId)) {
  const pflicht: Mangel[] = [];
  const empfehlung: Mangel[] = [];
  if (!b?.name?.trim()) pflicht.push({ feld: 'betrieb.name', text: 'Der Name deines Betriebs fehlt.', wo: 'betrieb' });
  if (!b?.adresse?.strasse?.trim() || !b?.adresse?.plz?.trim() || !b?.adresse?.ort?.trim())
    pflicht.push({ feld: 'betrieb.adresse', text: 'Die vollständige Anschrift deines Betriebs fehlt.', wo: 'betrieb' });
  if (!b?.steuernummer?.trim() && !b?.ustId?.trim())
    pflicht.push({ feld: 'betrieb.steuernummer', text: 'Deine Steuernummer oder USt-IdNr. fehlt.', wo: 'betrieb' });
  if (!k) pflicht.push({ feld: 'kunde', text: 'Die Rechnung hat keinen Kunden.', wo: 'rechnung' });
  else if (!k.adresse?.strasse?.trim() || !k.adresse?.plz?.trim() || !k.adresse?.ort?.trim())
    pflicht.push({ feld: 'kunde.adresse', text: `Bei ${k.name} fehlt die vollständige Anschrift.`, wo: 'kunde' });
  const echte = r.positionen.filter((p) => p.art !== 'text' && p.art !== 'zwischensumme');
  if (!echte.length) pflicht.push({ feld: 'positionen', text: 'Füge mindestens eine Position hinzu.', wo: 'rechnung' });
  r.positionen.forEach((p, i) => {
    if (!p.text.trim()) pflicht.push({ feld: `position.${p.id}`, text: `Position ${i + 1} hat keine Beschreibung.`, wo: 'rechnung' });
  });
  // Bei Abschlägen ist die Leistung noch nicht (voll) erbracht – dann kein Leistungsdatum nötig
  if (!r.leistungszeitraum?.trim() && r.art !== 'abschlag')
    pflicht.push({ feld: 'leistungszeitraum', text: 'Gib das Leistungsdatum oder den Leistungszeitraum an.', wo: 'rechnung' });
  if (r.reverseCharge && k?.art === 'privat')
    pflicht.push({ feld: 'reverseCharge', text: '§ 13b gilt nur, wenn dein Kunde selbst Bauleistungen erbringt – nicht bei Privatkunden.', wo: 'rechnung' });
  if (echte.length && rechnungsSummen(r, b).zahlbetrag === 0 && r.art !== 'gutschrift')
    empfehlung.push({ feld: 'betrag', text: 'Die Rechnung steht auf 0 €.', wo: 'rechnung' });
  if (!b?.iban?.trim()) empfehlung.push({ feld: 'betrieb.iban', text: 'Deine IBAN fehlt – ohne sie kann dein Kunde nicht überweisen.', wo: 'betrieb' });
  if (!b?.email?.trim() || !b?.telefon?.trim())
    empfehlung.push({ feld: 'betrieb.kontakt', text: 'Telefon und E-Mail deines Betriebs gehören in die E-Rechnung.', wo: 'betrieb' });
  if (k && !k.email?.trim()) empfehlung.push({ feld: 'kunde.email', text: `Bei ${k.name} fehlt die E-Mail-Adresse für den Versand.`, wo: 'kunde' });
  return { pflicht, empfehlung, ok: pflicht.length === 0 };
}

/** Texte, die automatisch unter die Rechnung gehören */
export function pflichtTexte(r: RechnungX, b: Betrieb | undefined = betrieb(), k: Kunde | undefined = db.kunden.get(r.kundeId)): string[] {
  const t: string[] = [];
  if (b?.kleinunternehmer) t.push('Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).');
  else if (r.reverseCharge) t.push('Steuerschuldnerschaft des Leistungsempfängers gemäß § 13b UStG.');
  if (k?.art === 'privat' && r.art !== 'gutschrift')
    t.push('Sie sind gesetzlich verpflichtet, diese Rechnung zwei Jahre lang aufzubewahren (§ 14b Abs. 1 Satz 5 UStG).');
  if (r.art === 'abschlag') t.push('Abschlagsrechnung – wird mit der Schlussrechnung verrechnet.');
  if (r.einbehaltProzent) t.push(`Sicherheitseinbehalt ${String(r.einbehaltProzent).replace('.', ',')} % – fällig nach Ablauf der vereinbarten Gewährleistung.`);
  if (r.art === 'schluss' && r.abzugRechnungIds?.length) t.push('Mit dieser Schlussrechnung sind alle aufgeführten Abschlags- und Teilrechnungen verrechnet. Abgezogen sind die darauf bereits gezahlten Beträge.');
  return t;
}

// ------------------------------------------------------------------ Festschreiben, Versand, Storno

export interface FestschreibenErgebnis {
  ok: boolean;
  rechnung?: RechnungX;
  maengel?: Mangel[];
}

/**
 * Vergibt die fortlaufende Nummer, setzt Rechnungsdatum und Fälligkeit, Status „versendet“.
 * Danach ist die Rechnung unveränderbar (GoBD). Feuert `rechnung.versendet`.
 */
export function festschreiben(id: ID, opts: { weg?: 'email' | 'post' | 'selbst' } = {}): FestschreibenErgebnis {
  const r = rechnungX(id);
  if (!r) return { ok: false };
  if (r.status !== 'entwurf') return { ok: true, rechnung: r };
  const pruefung = pflichtangabenPruefen(r);
  if (!pruefung.ok) return { ok: false, maengel: pruefung.pflicht };
  const zielTage = Math.max(0, tageZwischen(r.datum, r.faelligAm));
  const nummer = r.nummer || rechnungsNummer(r);
  // Abschläge: bezahlten Stand einfrieren – eine festgeschriebene Rechnung ändert ihren Betrag nie mehr
  const abzugStand = r.abzugRechnungIds?.length ? Object.fromEntries(rechnungsSummen(r).abzuege.map((a) => [a.id, a.gezahlt])) : undefined;
  const neu = rechnungAendern(
    id,
    { nummer, datum: heute(), faelligAm: plusTage(heute(), zielTage), status: 'versendet', versendetAm: new Date().toISOString(), eRechnung: true, ...(abzugStand ? { abzugStand } : {}) },
    { text: `Festgeschrieben als ${nummer}` },
  )!;
  vermerken({ typ: 'rechnungen', id }, 'rechnung.versendet', opts.weg === 'email' ? 'Per E-Mail versendet' : 'Als versendet markiert');
  if (r.auftragId) vermerken({ typ: 'auftraege', id: r.auftragId }, 'rechnung.versendet', `${ART_LABEL[r.art]} ${nummer} versendet`);
  emit({ typ: 'rechnung.versendet', sammlung: 'rechnungen', objekt: neu, daten: { weg: opts.weg } });
  return { ok: true, rechnung: neu };
}

/** Storno: Stornorechnung (Gutschrift mit negativen Positionen), Original wird „storniert“. */
export function stornieren(id: ID, grund?: string): RechnungX | undefined {
  const r = rechnungX(id);
  if (!r || r.status === 'entwurf' || r.status === 'storniert' || r.stornoFuerId) return undefined;
  const storno = db.rechnungen.create({
    nummer: naechsteDokumentNummer('storno', db.rechnungen.allMitGeloeschten().map((x) => x.nummer)),
    art: 'gutschrift',
    auftragId: r.auftragId,
    kundeId: r.kundeId,
    titel: `Stornorechnung zu ${r.nummer}`,
    positionen: r.positionen.map((p) => ({ ...p, id: neueId('p'), menge: -p.menge })),
    abzugRechnungIds: r.abzugRechnungIds,
    abzugStand: r.abzugStand,
    einbehaltProzent: r.einbehaltProzent,
    status: 'versendet',
    datum: heute(),
    faelligAm: heute(),
    leistungszeitraum: r.leistungszeitraum,
    versendetAm: new Date().toISOString(),
    mahnstufe: 0,
    stornoFuerId: r.id,
    reverseCharge: r.reverseCharge,
    bemerkung: grund ? `Grund: ${grund}` : undefined,
    beispiel: r.beispiel,
  });
  const storniert = rechnungAendern(id, { status: 'storniert', stornoDurchId: storno.id }, { text: `Storniert durch ${storno.nummer}` });
  materialFreigeben(id);
  vonRechnungLoesen(id);
  if (r.auftragId) vermerken({ typ: 'auftraege', id: r.auftragId }, 'rechnung.storniert', `${r.nummer} storniert (${storno.nummer})`);
  // Objekt ist die stornierte Rechnung (wie bei der Ableitung des Kerns) – so kommt das Ereignis nur einmal an
  emit({ typ: 'rechnung.storniert', sammlung: 'rechnungen', objekt: storniert ?? r, daten: { rechnungId: r.id, stornoId: storno.id, grund } });
  return storno;
}

/** Nach dem Storno: neue Rechnung mit denselben Positionen als Entwurf (zur Korrektur) */
export function korrekturEntwurf(id: ID): RechnungX | undefined {
  const r = rechnungX(id);
  if (!r) return undefined;
  const neu = db.rechnungen.create({
    nummer: '',
    art: r.art,
    auftragId: r.auftragId,
    kundeId: r.kundeId,
    titel: r.titel,
    positionen: r.positionen.map((p) => ({ ...p, id: neueId('p') })),
    abzugRechnungIds: r.abzugRechnungIds,
    status: 'entwurf',
    datum: heute(),
    faelligAm: plusTage(heute(), Math.max(0, tageZwischen(r.datum, r.faelligAm))),
    leistungszeitraum: r.leistungszeitraum,
    leistungVon: r.leistungVon,
    leistungBis: r.leistungBis,
    mahnstufe: 0,
    reverseCharge: r.reverseCharge,
    einbehaltProzent: r.einbehaltProzent,
    nummernkreis: r.nummernkreis,
    angebotId: r.angebotId,
    materialIds: r.materialIds,
    zeitIds: r.zeitIds,
    zusatzleistungIds: r.zusatzleistungIds,
    bemerkung: `Ersetzt ${r.nummer}.`,
    beispiel: r.beispiel,
  });
  erstelltMelden(neu);
  for (const mid of r.materialIds ?? []) {
    const m = db.material.get(mid);
    if (m && !m.abgerechnetIn) db.material.update(mid, { abgerechnetIn: neu.id }, { leise: true });
  }
  alsAbgerechnetMarkieren(r.zusatzleistungIds ?? [], neu);
  return neu;
}

/**
 * Rechnung korrigieren (geführter Weg): Storno + Kopie als Entwurf in einem Schritt.
 * Für Handwerker ist das die Rechnungskorrektur – eine eigene Art „Korrektur“ gibt es bewusst nicht.
 */
export function korrigieren(id: ID, grund?: string): { storno: RechnungX; entwurf: RechnungX } | undefined {
  const storno = stornieren(id, grund);
  if (!storno) return undefined;
  const entwurf = korrekturEntwurf(id);
  if (!entwurf) return undefined;
  return { storno, entwurf };
}

// ------------------------------------------------------------------ Versand

export function mailtoLink(r: RechnungX): string | undefined {
  const k = db.kunden.get(r.kundeId);
  const b = betrieb();
  const s = rechnungsSummen(r);
  const an = k?.email ?? '';
  const betreff = `${r.stornoFuerId ? 'Stornorechnung' : ART_LABEL[r.art]} ${r.nummer || ''} – ${r.titel}`.trim();
  const anrede = k?.art === 'privat' ? `Guten Tag ${k.name},` : 'Guten Tag,';
  const zeilen = [
    anrede,
    '',
    r.art === 'gutschrift'
      ? `anbei erhalten Sie unsere ${r.stornoFuerId ? 'Stornorechnung' : 'Gutschrift'} ${r.nummer} über ${euro(Math.abs(s.zahlbetrag))}.`
      : `anbei erhalten Sie unsere ${ART_LABEL[r.art]} ${r.nummer} über ${euro(s.zahlbetrag)}. Bitte überweisen Sie den Betrag bis zum ${datum(r.faelligAm)}${b?.iban ? ` auf das Konto ${b.iban}` : ''}.`,
    '',
    'Die Rechnung als PDF und die E-Rechnung (XRechnung) finden Sie im Anhang.',
    '',
    'Vielen Dank für Ihren Auftrag.',
    '',
    'Mit freundlichen Grüßen',
    b?.name ?? '',
  ];
  return `mailto:${encodeURIComponent(an)}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(zeilen.join('\n'))}`;
}

/** Entwürfe, die liegen bleiben – ab wann ein Hinweis kommt */
export const ENTWURF_TAGE = 3;
