/**
 * Dokumenten-Engine: Versand für alle Geschäftsdokumente – Vorbereiten → Vorschau → Bestätigen → Ausführen.
 *
 * Nutzt den bestehenden Versand (Cloud-Vertrag mit Server-E-Mail aus `@core/cloud-versand`, sonst ehrlicher Rückfall
 * aufs Mail-/SMS-Programm über `sendenMitRueckfall`). Rechnungen und Angebote laufen über ihre vorhandenen
 * Sende-Funktionen (Festschreiben, XRechnung, Kundenbereich), alles andere über die Engine.
 */
import { db, vermerken } from '@core/db';
import type { Versand } from '@core/cloud';
import { datum, euro } from '@core/format';
import type { Bezug, Cent, ID } from '@core/objects';
import { angebotNachricht, angebotSenden } from '@modules/angebote/erstwert';
import { angebotSummen, ustSatz } from '@modules/angebote/daten';
import { berichte } from '@modules/berichte/daten';
import { abnahmen } from '@modules/abnahme/daten';
import { mahntext, mahnungen, senden as mahnungFreigeben } from '@modules/mahnungen/daten';
import { pflichtangabenPruefen, rechnungsNummer, rechnungsSummen } from '@modules/rechnungen/logik';
import { rechnungNachricht, rechnungSenden } from '@modules/rechnungen/RechnungSchnellVersand';
import { rechnungX } from '@modules/rechnungen/typen';
import { dokumentVersendet, kontaktArt, sendenMitRueckfall, type SendeErgebnis } from '@modules/start/daten';
import { absenderVon, dokumentHtml, zeilenAus } from '@modules/start/emailHtml';
import { alsVersendet, geschaeftsdokumente, positionenVon, summeVon } from './daten';
import { dokumentLabel, ohneLuecken, textbaustein, textFuer } from './variablen';
import { versionMerken } from './historie';
import { artVon } from './arten';

const artIdVon = (bezug: Bezug): string => artVon(bezug)?.id ?? bezug.typ;

export interface VersandEntwurf {
  bezug: Bezug;
  /** z. B. „Schlussrechnung“ */
  label: string;
  an: string;
  kanal?: 'email' | 'sms';
  betreff: string;
  text: string;
  /** Nummer, die das Dokument trägt bzw. beim Senden bekommt */
  nummer?: string;
  /** Betrag, den das Dokument nennt */
  betrag?: Cent;
  /** Was beim Senden passiert, in Handwerkersprache */
  folgen: string[];
  /** Was vorher noch fehlt – dann wird nicht gesendet */
  fehler: string[];
}

const STANDARD_MAIL = '{kunde.anrede},\n\nanbei erhalten Sie {dokument.bezeichnung} zu „{auftrag.titel}“.\n\nBei Fragen erreichen Sie uns unter {betrieb.telefon}.\n\nViele Grüße\n{betrieb.name}';
const STANDARD_BETREFF = '{dokument.art} {dokument.nummer}: {auftrag.titel}';

/** Kunde zum Dokument (für Empfänger und Anrede) */
export function kundeVon(bezug: Bezug): ID | undefined {
  switch (bezug.typ) {
    case 'rechnungen':
      return rechnungX(bezug.id)?.kundeId;
    case 'angebote':
      return db.angebote.get(bezug.id)?.kundeId;
    case 'mahnungen':
      return rechnungX(mahnungen.get(bezug.id)?.rechnungId)?.kundeId;
    case 'geschaeftsdokumente':
      return geschaeftsdokumente.get(bezug.id)?.kundeId;
    case 'berichte':
      return db.auftraege.get(berichte.get(bezug.id)?.auftragId)?.kundeId;
    case 'abnahmen':
      return db.auftraege.get(abnahmen.get(bezug.id)?.auftragId)?.kundeId;
  }
  return undefined;
}

/** Nummer und Betrag, wie sie gerade im Dokument stehen (für Versionen und Vorschau) */
export function eckdatenVon(bezug: Bezug): { nummer?: string; betrag?: Cent; titel?: string } {
  switch (bezug.typ) {
    case 'rechnungen': {
      const r = rechnungX(bezug.id);
      return r ? { nummer: r.nummer || undefined, betrag: rechnungsSummen(r).zahlbetrag, titel: r.titel } : {};
    }
    case 'angebote': {
      const a = db.angebote.get(bezug.id);
      return a ? { nummer: a.nummer, betrag: angebotSummen(a).brutto, titel: a.titel } : {};
    }
    case 'mahnungen': {
      const m = mahnungen.get(bezug.id);
      return m ? { nummer: rechnungX(m.rechnungId)?.nummer, betrag: m.offen + m.gebuehr + m.zinsen } : {};
    }
    case 'geschaeftsdokumente': {
      const g = geschaeftsdokumente.get(bezug.id);
      return g ? { nummer: g.nummer, titel: g.titel, betrag: g.art === 'auftragsbestaetigung' ? summeVon(g, ustSatz()).brutto : undefined } : {};
    }
    case 'berichte': {
      const b = berichte.get(bezug.id);
      return b ? { nummer: b.nummer } : {};
    }
  }
  return {};
}

/** Standard-Empfänger: E-Mail des Kunden, sonst Mobilnummer */
export function standardEmpfaenger(bezug: Bezug): string {
  const k = db.kunden.get(kundeVon(bezug));
  return k?.email?.trim() || k?.ansprechpartner.find((a) => a.email)?.email || k?.telefon?.trim() || '';
}

/**
 * Schritt 1 – Vorbereiten: Empfänger, Betreff, Text, Nummer, Betrag, was passieren wird und was noch fehlt.
 * Ändert nichts.
 */
export function versandVorbereiten(bezug: Bezug, an: string = standardEmpfaenger(bezug)): VersandEntwurf {
  const kanal = kontaktArt(an);
  const label = dokumentLabel(bezug);
  const fehler: string[] = [];
  const folgen: string[] = [];
  const eck = eckdatenVon(bezug);
  const betrag = eck.betrag;
  let nummer = eck.nummer;
  let betreff = '';
  let text = '';
  if (!kanal) fehler.push(an.trim() ? `„${an.trim()}“ ist keine E-Mail-Adresse und keine Handynummer.` : 'Trag ein, wohin das Dokument soll: E-Mail oder Handynummer.');

  if (bezug.typ === 'rechnungen') {
    const r = rechnungX(bezug.id);
    if (!r) fehler.push('Die Rechnung gibt es nicht mehr.');
    else {
      if (r.status === 'entwurf') {
        nummer = rechnungsNummer(r);
        const p = pflichtangabenPruefen(r);
        fehler.push(...p.pflicht.map((m) => m.text));
        folgen.push(`Lotte schreibt die Rechnung fest: Nummer ${nummer}, Datum von heute. Danach ändern nur noch per Storno.`);
      }
      const n = rechnungNachricht({ ...r, nummer: nummer ?? r.nummer }, kanal ?? 'email');
      betreff = n.betreff;
      text = n.text;
      folgen.push('Die E-Rechnung (XRechnung) hängt automatisch an, dazu der Link zum Kundenbereich.');
    }
  } else if (bezug.typ === 'angebote') {
    const a = db.angebote.get(bezug.id);
    if (!a) fehler.push('Das Angebot gibt es nicht mehr.');
    else {
      const n = angebotNachricht(a, kanal ?? 'email');
      betreff = n.betreff;
      text = n.text;
      folgen.push('Dein Kunde bekommt den Link zum Kundenbereich und kann dort direkt annehmen.');
      if (a.status === 'entwurf') folgen.push('Das Angebot gilt danach als versendet, Lotte erinnert dich ans Nachfassen.');
    }
  } else if (bezug.typ === 'mahnungen') {
    const m = mahnungen.get(bezug.id);
    if (!m) fehler.push('Das Schreiben gibt es nicht mehr.');
    else {
      const t = mahntext(m);
      betreff = t.betreff;
      text = [t.anrede, '', ...t.absaetze.flatMap((x) => [x, '']), ...t.posten.map(([l, c]) => `${l}: ${euro(c)}`), m.gebuehr || m.zinsen ? `Gesamt: ${euro(t.gesamt)}` : '', '', ...t.gruss].join('\n');
      if (m.status === 'vorbereitet') folgen.push('Die Mahnstufe an der Rechnung wird gesetzt, die nächste Frist läuft.');
    }
  } else {
    const t = textbaustein('email.dokument', STANDARD_MAIL, bezug);
    const sauber = ohneLuecken(t.text);
    text = sauber.text;
    betreff = (t.betreff ?? textFuer(STANDARD_BETREFF, bezug)).replace(/\s*\{[^}]+\}/g, '');
    if (sauber.fehlend.length) folgen.push(`Ohne Wert und deshalb weggelassen: ${sauber.fehlend.map((f) => `{${f}}`).join(', ')}. Ergänze die Angabe, dann steht sie beim nächsten Mal drin.`);
    const g = bezug.typ === 'geschaeftsdokumente' ? geschaeftsdokumente.get(bezug.id) : undefined;
    if (g) folgen.push(`${label} steht direkt in der E-Mail${g.art === 'lieferschein' ? ' – unterschreiben lässt du ihn vor Ort.' : '.'}`);
    else folgen.push(`Für ${label === 'Abnahmeprotokoll' ? 'das Abnahmeprotokoll' : `den ${label}`} speicherst du vorher das PDF und hängst es an.`);
  }
  return { bezug, label, an: an.trim(), kanal, betreff: betreff.replace(/\s+–\s*$/, ''), text, nummer, betrag, folgen, fehler };
}

/** E-Mail-Fassung für Auftragsbestätigung und Lieferschein (Dokument direkt in der Mail) */
function geschaeftsHtml(id: ID, text: string): string | undefined {
  const g = geschaeftsdokumente.get(id);
  if (!g) return undefined;
  const b = db.betrieb.get('betrieb');
  const ab = g.art === 'auftragsbestaetigung';
  const s = ab ? summeVon(g, ustSatz()) : undefined;
  const zeilen = zeilenAus(positionenVon(g)).map((z) => (ab ? z : { ...z, einzel: '', gesamt: '' }));
  return dokumentHtml({
    betrieb: b,
    titel: `${ab ? 'Auftragsbestätigung' : 'Lieferschein'} ${g.nummer}`,
    daten: [
      ['Datum', datum(g.datum)],
      ['Auftrag', db.auftraege.get(g.auftragId)?.nummer ?? ''],
    ],
    absaetze: text.split('\n\n').filter(Boolean),
    zeilen,
    summen: s ? [['Summe netto', euro(s.netto)], [`zzgl. USt`, euro(s.ust)], ['Gesamtbetrag', euro(s.brutto), true]] : [],
    schluss: g.schluss ? g.schluss.split('\n').filter(Boolean) : [],
  });
}

export interface VersandErgebnisMitText {
  ergebnis: SendeErgebnis;
  /** Pflichtangaben fehlen (nur Rechnungen) – dann wurde nichts gesendet */
  fehler?: string[];
}

/**
 * Schritt 3 – Bestätigt: ausführen. Ein Fehler vorher (Pflichtangaben, Empfänger) verhindert jeden Versand.
 * Meldet `dokument.versendet` (die Engine hält daraufhin die Version fest) und das fachliche Event der Art.
 */
export async function versandAusfuehren(e: VersandEntwurf, opts: { sekunden?: number } = {}): Promise<VersandErgebnisMitText> {
  if (e.fehler.length || !e.kanal) return { ergebnis: { status: 'fehler', fehler: e.fehler[0] ?? 'Empfänger fehlt.' }, fehler: e.fehler };
  const kanal = e.kanal;
  const merken = (ergebnis: SendeErgebnis) => {
    if (ergebnis.status !== 'fehler') versionMerken(e.bezug, artIdVon(e.bezug), 'versendet', { ...eckdatenVon(e.bezug), kanal, an: e.an, betreff: e.betreff, versandStatus: ergebnis.status });
  };
  if (e.bezug.typ === 'rechnungen') {
    const r = await rechnungSenden(e.bezug.id, e.an, kanal, opts);
    merken(r.r);
    return { ergebnis: r.r, fehler: r.maengel?.map((m) => m.text) };
  }
  if (e.bezug.typ === 'angebote') {
    const ergebnis = await angebotSenden(e.bezug.id, e.an, kanal, opts);
    merken(ergebnis);
    return { ergebnis };
  }

  const v: Versand = {
    an: e.an,
    kanal,
    betreff: e.betreff,
    text: e.text,
    bezug: e.bezug,
    absender: absenderVon(db.betrieb.get('betrieb')),
    html: kanal === 'email' && e.bezug.typ === 'geschaeftsdokumente' ? geschaeftsHtml(e.bezug.id, e.text) : undefined,
  };
  const ergebnis = await sendenMitRueckfall(v);
  if (ergebnis.status === 'fehler') return { ergebnis };
  if (e.bezug.typ === 'mahnungen') mahnungFreigeben(e.bezug.id);
  if (e.bezug.typ === 'geschaeftsdokumente') alsVersendet(e.bezug.id, kanal === 'email' ? 'Per E-Mail versendet' : 'Per SMS versendet');
  const wie = kanal === 'sms' ? 'SMS' : 'E-Mail';
  vermerken(e.bezug, 'dokument.versendet', ergebnis.status === 'gesendet' ? `Per ${wie} an ${e.an} verschickt` : `${wie} an ${e.an} vorbereitet (im eigenen Programm geöffnet)`, { kanal, status: ergebnis.status });
  dokumentVersendet(e.bezug, kanal, ergebnis, opts.sekunden);
  merken(ergebnis);
  return { ergebnis };
}
