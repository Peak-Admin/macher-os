/**
 * E-Rechnung nach XRechnung 3.0 (Syntax UBL 2.1, EN 16931).
 * Erzeugt Invoice bzw. CreditNote (Gutschrift/Storno) mit allen Pflichtfeldern.
 * ZUGFeRD (PDF mit eingebettetem XML) ist geplant.
 */
import { db } from '@core/db';
import { pflichtTexte, rechnungsSummen, betrieb as aktuellerBetrieb } from './logik';
import type { RechnungX } from './typen';
import { xrechnungAus } from './xrechnung-xml';

export { xrechnungAus, type XRechnungDaten } from './xrechnung-xml';

/** XML für eine gespeicherte Rechnung */
export function xrechnungFuer(r: RechnungX): string {
  const b = aktuellerBetrieb();
  const k = db.kunden.get(r.kundeId);
  const original = r.stornoFuerId ? db.rechnungen.get(r.stornoFuerId) : undefined;
  return xrechnungAus({
    r,
    s: rechnungsSummen(r, b),
    betrieb: b,
    kunde: k,
    originalNummer: original?.nummer,
    originalDatum: original?.datum,
    auftragNummer: db.auftraege.get(r.auftragId)?.nummer,
    texte: pflichtTexte(r, b, k),
  });
}

/** Datei im Browser herunterladen */
export function herunterladen(dateiname: string, inhalt: string, mime = 'application/xml') {
  const blob = new Blob([inhalt], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function xrechnungHerunterladen(r: RechnungX) {
  herunterladen(`${r.nummer || 'Entwurf'}_XRechnung.xml`, xrechnungFuer(r));
}
