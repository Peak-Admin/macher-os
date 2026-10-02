/**
 * DATEV-Einstellungen und Export-Protokoll – als Schlüssel-Wert-Einstellungen gespeichert
 * (das Paket hat keine eigene Sammlung). Belege bekommen `exportiertAm` direkt am Kernobjekt;
 * für Rechnungen gibt es das Feld im Kern nicht, deshalb führen wir eine Liste (Kernwunsch).
 */
import { batch, db } from '@core/db';
import { einstellung, setzeEinstellung } from '@core/einstellungen';
import { erledigt } from '@core/macher';
import type { ID } from '@core/objects';
import { basisAusDb } from '../kosten/basis';
import { ustSatzVon } from '../ertrag/daten';
import { buchungenErzeugen, cp1252Bytes, dateiname, extfDatei, type DatevEinstellungen, type ExportErgebnis } from './daten';

export const K = {
  einstellungen: 'datev.einstellungen',
  steuerberater: 'datev.steuerberater',
  rechnungen: 'datev.rechnungenExportiert',
  debitoren: 'datev.debitoren',
  kreditoren: 'datev.kreditoren',
  exporte: 'datev.exporte',
  abschluss: (monat: string) => `datev.abschluss.${monat}`,
};

export const STANDARD_EINSTELLUNGEN: DatevEinstellungen = { rahmen: 'SKR03', beraterNr: '', mandantNr: '' };

export interface Steuerberater {
  name: string;
  kanzlei: string;
  telefon: string;
  email: string;
}
export const LEERER_STEUERBERATER: Steuerberater = { name: '', kanzlei: '', telefon: '', email: '' };

export interface ExportProtokoll {
  id: string;
  zeitpunkt: string;
  von: string;
  bis: string;
  rahmen: string;
  rechnungen: number;
  belege: number;
  summe: number;
  dateiname: string;
  erneut?: boolean;
}

export const AUTOMATION_EXPORT = 'datev-export';

export function exportVorbereiten(von: string, bis: string, auchExportierte: boolean): ExportErgebnis {
  const e = einstellung(K.einstellungen, STANDARD_EINSTELLUNGEN);
  const b = basisAusDb();
  return buchungenErzeugen(
    { rechnungen: b.rechnungen, belege: b.belege, kunden: b.kunden, lieferanten: b.lieferanten },
    {
      von,
      bis,
      rahmen: e.rahmen,
      ustSatz: ustSatzVon(b),
      kleinunternehmer: b.betrieb?.kleinunternehmer,
      debitoren: einstellung(K.debitoren, {}),
      kreditoren: einstellung(K.kreditoren, {}),
      rechnungenExportiert: einstellung(K.rechnungen, {}),
      auchExportierte,
    },
  );
}

/** Datei erzeugen, als exportiert markieren, protokollieren. Gibt Dateiinhalt (Windows-1252) zurück. */
export function exportAusfuehren(von: string, bis: string, auchExportierte: boolean, jetzt = new Date()) {
  const e = einstellung(K.einstellungen, STANDARD_EINSTELLUNGEN);
  const ergebnis = exportVorbereiten(von, bis, auchExportierte);
  const text = extfDatei(ergebnis.buchungen, { beraterNr: e.beraterNr, mandantNr: e.mandantNr, von, bis, rahmen: e.rahmen, erzeugtAm: jetzt });
  const name = dateiname(von, bis);
  const zeit = jetzt.toISOString();
  const erneut = ergebnis.doppelt.rechnungen.length + ergebnis.doppelt.belege.length > 0 && auchExportierte;
  batch(() => {
    for (const id of ergebnis.belegIds) db.belege.update(id, { exportiertAm: zeit }, { text: `An Steuerberater übergeben (${name})` });
    const markiert: Record<ID, string> = { ...einstellung(K.rechnungen, {}) };
    for (const id of ergebnis.rechnungIds) markiert[id] = zeit;
    setzeEinstellung(K.rechnungen, markiert);
    setzeEinstellung(K.debitoren, ergebnis.debitoren);
    setzeEinstellung(K.kreditoren, ergebnis.kreditoren);
    const protokoll: ExportProtokoll = {
      id: zeit,
      zeitpunkt: zeit,
      von,
      bis,
      rahmen: e.rahmen,
      rechnungen: ergebnis.rechnungIds.length,
      belege: ergebnis.belegIds.length,
      summe: ergebnis.buchungen.reduce((s, x) => s + x.umsatz, 0),
      dateiname: name,
      erneut,
    };
    setzeEinstellung(K.exporte, [protokoll, ...einstellung<ExportProtokoll[]>(K.exporte, [])].slice(0, 50));
  });
  erledigt(AUTOMATION_EXPORT, `DATEV-Buchungsstapel erstellt: ${ergebnis.buchungen.length} Buchungen`, {
    text: `${ergebnis.rechnungIds.length} Rechnungen und ${ergebnis.belegIds.length} Belege vom ${von} bis ${bis} als exportiert markiert.`,
    minuten: 30,
  });
  return { bytes: cp1252Bytes(text), name, ergebnis };
}

export function herunterladen(bytes: Uint8Array, name: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'text/csv;charset=windows-1252' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
