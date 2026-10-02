/**
 * Rechnung in 1 Minute – Anlegen und Senden mit der vorhandenen Rechnungslogik:
 * Pflichtangaben (§ 14 UStG), Festschreiben mit Nummer (GoBD), XRechnung als Anhang,
 * Versand über den Cloud-Vertrag mit Link zum Kundenbereich (lokal: Mailprogramm).
 */
import { db, vermerken } from '@core/db';
import type { Versand } from '@core/cloud';
import { datum, euro } from '@core/format';
import type { ID, Position } from '@core/objects';
import { kundenLink } from '@modules/angebote/erstwert';
import { dokumentVersendet, sendenMitRueckfall, type SendeErgebnis } from '@modules/start/daten';
import { absenderVon, dokumentHtml, zeilenAus } from '@modules/start/emailHtml';
import { ART_LABEL, betrieb, festschreiben, freieRechnung, pflichtTexte, rechnungErstellen, rechnungsSummen, type Mangel } from './logik';
import { rechnungAendern, type RechnungX } from './typen';
import { xrechnungFuer } from './xrechnung';

/** Entwurf aus Auftrag (vorhandener Entwurf wird genutzt) oder frei – mit den Positionen vom Bildschirm */
export function schnellEntwurf(q: { auftragId?: ID; kundeId: ID }, positionen: Position[], leistungszeitraum: string, titel?: string): RechnungX | undefined {
  const r = q.auftragId ? rechnungErstellen(q.auftragId, 'rechnung') : freieRechnung(q.kundeId);
  if (!r) return undefined;
  return rechnungAendern(r.id, { positionen, leistungszeitraum, ...(titel?.trim() ? { titel: titel.trim() } : {}) }, { leise: true }) as RechnungX;
}

export function rechnungNachricht(r: RechnungX, kanal: Versand['kanal']): { betreff: string; text: string } {
  const k = db.kunden.get(r.kundeId);
  const b = betrieb();
  const s = rechnungsSummen(r);
  const betreff = `${ART_LABEL[r.art]} ${r.nummer} – ${r.titel}`;
  const anrede = `Guten Tag${k?.art === 'privat' ? ' ' + k.name : ''},`;
  const zahlen = `Bitte überweisen Sie ${euro(s.zahlbetrag)} bis zum ${datum(r.faelligAm)}${b?.iban ? ` auf das Konto ${b.iban}` : ''}.`;
  if (kanal !== 'email') return { betreff, text: `${anrede} hier ist unsere ${ART_LABEL[r.art]} ${r.nummer}. ${zahlen} Rechnung und E-Rechnung finden Sie unter diesem Link. Vielen Dank, ${b?.name ?? ''}`.trim() };
  return {
    betreff,
    text: [
      anrede,
      '',
      `vielen Dank für Ihren Auftrag. Anbei erhalten Sie unsere ${ART_LABEL[r.art]} ${r.nummer} über ${euro(s.zahlbetrag)}.`,
      zahlen,
      '',
      'Die Rechnung als PDF und die E-Rechnung (XRechnung) finden Sie auch unter dem Link unten.',
      '',
      'Mit freundlichen Grüßen',
      b?.name ?? '',
      b?.telefon ?? '',
    ].join('\n'),
  };
}

/** Die Rechnung direkt in der E-Mail – mit Pflichttexten, Fälligkeit und Bankverbindung */
export function rechnungHtml(r: RechnungX, link?: string): string {
  const b = betrieb();
  const k = db.kunden.get(r.kundeId);
  const s = rechnungsSummen(r);
  return dokumentHtml({
    betrieb: b,
    titel: `${ART_LABEL[r.art]} ${r.nummer}`,
    daten: [
      ['Rechnungsdatum', datum(r.datum)],
      ['Leistung', r.leistungszeitraum ?? ''],
      ['Fällig am', datum(r.faelligAm)],
    ],
    absaetze: [`Guten Tag${k?.art === 'privat' ? ' ' + k.name : ''},`, 'vielen Dank für Ihren Auftrag. Wir berechnen folgende Leistungen:'],
    zeilen: zeilenAus(r.positionen),
    summen: [
      ['Netto', euro(s.netto)],
      ...(b?.kleinunternehmer ? [] : ([[`USt ${s.ustSatz} %`, euro(s.ust)]] as [string, string][])),
      ...s.abzuege.map((x) => [`abzüglich ${x.nummer}`, euro(-x.brutto)] as [string, string]),
      ['Zahlbetrag', euro(s.zahlbetrag), true],
    ],
    link: link ? { label: 'Rechnung online ansehen', url: link } : undefined,
    schluss: [
      `Bitte überweisen Sie ${euro(s.zahlbetrag)} bis zum ${datum(r.faelligAm)}${b?.iban ? ` auf das Konto ${b.iban}` : ''}, Verwendungszweck ${r.nummer}.`,
      ...pflichtTexte(r, b, k),
      'Die E-Rechnung (XRechnung) hängt an dieser E-Mail.',
      'Mit freundlichen Grüßen',
      b?.name ?? '',
    ],
  });
}

/** Festschreiben und senden. Fehlen Pflichtangaben, wird nichts festgeschrieben und nichts gesendet. */
export async function rechnungSenden(id: ID, an: string, kanal: Versand['kanal'], opts: { sekunden?: number } = {}): Promise<{ r: SendeErgebnis; maengel?: Mangel[]; rechnung?: RechnungX }> {
  const f = festschreiben(id, { weg: kanal === 'email' ? 'email' : 'selbst' });
  if (!f.ok || !f.rechnung) return { r: { status: 'fehler', fehler: 'Es fehlen Pflichtangaben.' }, maengel: f.maengel };
  const rechnung = f.rechnung;
  const { betreff, text } = rechnungNachricht(rechnung, kanal);
  const xml = xrechnungFuer(rechnung);
  const bezug = { typ: 'rechnungen', id } as const;
  const link = kundenLink(rechnung.kundeId);
  const r = await sendenMitRueckfall({
    an: an.trim(),
    kanal,
    betreff,
    text,
    link,
    html: kanal === 'email' ? rechnungHtml(rechnung, link) : undefined,
    absender: absenderVon(betrieb()),
    anhaenge: [{ name: `${rechnung.nummer}_XRechnung.xml`, url: `data:application/xml;charset=utf-8,${encodeURIComponent(xml)}`, mime: 'application/xml' }],
    bezug,
  });
  const wie = kanal === 'sms' ? 'SMS' : 'E-Mail';
  vermerken(bezug, 'dokument.versendet', r.status === 'gesendet' ? `Per ${wie} an ${an.trim()} verschickt (mit XRechnung)` : `${wie} an ${an.trim()} vorbereitet (im eigenen Programm geöffnet)`, { kanal, status: r.status });
  dokumentVersendet(bezug, kanal, r, opts.sekunden);
  return { r, rechnung };
}
