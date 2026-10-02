/**
 * Kontoauszug im ISO-20022-Format (CAMT.053 Tagesauszug, auch CAMT.052/054) lesen.
 * Liefert nur Zahlungseingänge (CRDT, keine Stornobuchungen) – wie der CSV-Import.
 * Sammelbuchungen mit mehreren Einzelumsätzen (TxDtls) werden aufgeteilt.
 */
import type { Cent } from '@core/objects';
import { alle, kind, kinder, textVon, wert, xmlLesen, type XmlKnoten } from '@modules/schnittstellen/xml';
import type { Umsatz } from './logik';

export const istCamt = (text: string) => /<(?:\w+:)?(BkToCstmrStmt|BkToCstmrAcctRpt|BkToCstmrDbtCdtNtfctn)\b/.test(text);

const centAusXml = (s: string): Cent | undefined => {
  const n = Number(s.trim());
  return s.trim() && Number.isFinite(n) ? Math.round(n * 100) : undefined;
};

export const ibanNorm = (s: string | undefined) => (s ?? '').replace(/\s+/g, '').toUpperCase() || undefined;

function datumVon(n: XmlKnoten, pfad: string) {
  return (wert(n, `${pfad}/Dt`) || wert(n, `${pfad}/DtTm`)).slice(0, 10);
}

function zweckVon(tx: XmlKnoten | undefined, ntry: XmlKnoten): string {
  const rmt = kind(tx, 'RmtInf');
  const teile = [
    // Banken teilen den Verwendungszweck in Stücke zu 35 Zeichen – ohne Leerzeichen zusammensetzen,
    // damit eine getrennte Rechnungsnummer („R-2026-00“ + „42“) erkennbar bleibt
    kinder(rmt, 'Ustrd')
      .map((u) => textVon(u))
      .join(''),
    ...alle(rmt, 'CdtrRefInf').map((c) => wert(c, 'Ref')),
    wert(tx, 'AddtlTxInf'),
  ].filter(Boolean);
  return (teile.length ? teile : [wert(ntry, 'AddtlNtryInf')]).join(' ').replace(/\s+/g, ' ').trim();
}

function nameVon(tx: XmlKnoten | undefined): string {
  return wert(tx, 'RltdPties/Dbtr/Nm') || wert(tx, 'RltdPties/Dbtr/Pty/Nm') || wert(tx, 'RltdPties/UltmtDbtr/Nm') || wert(tx, 'RltdPties/UltmtDbtr/Pty/Nm');
}

function ibanVon(tx: XmlKnoten | undefined): string | undefined {
  return ibanNorm(wert(tx, 'RltdPties/DbtrAcct/Id/IBAN'));
}

const brauchbar = (r: string) => (r && r !== 'NOTPROVIDED' ? r : '');

/** CAMT-XML lesen. `fehler` ist ein Satz für den Menschen. */
export function camtLesen(xml: string): { umsaetze: Umsatz[]; fehler?: string; iban?: string } {
  let wurzel: XmlKnoten;
  try {
    wurzel = xmlLesen(xml);
  } catch {
    return { umsaetze: [], fehler: 'Die Datei ist kein lesbarer Kontoauszug (XML).' };
  }
  if (!istCamt(xml)) return { umsaetze: [], fehler: 'Die XML-Datei ist kein Kontoauszug im CAMT-Format. Exportiere „CAMT.053“ aus deinem Online-Banking.' };
  const iban = ibanNorm(wert(alle(wurzel, 'Acct')[0], 'Id/IBAN'));
  const umsaetze: Umsatz[] = [];
  let nr = 0;
  for (const ntry of alle(wurzel, 'Ntry')) {
    nr++;
    if (wert(ntry, 'CdtDbtInd') !== 'CRDT') continue;
    if (wert(ntry, 'RvslInd') === 'true') continue;
    const sts = wert(ntry, 'Sts/Cd') || wert(ntry, 'Sts');
    if (sts === 'PDNG' || sts === 'INFO') continue;
    const waehrung = kind(ntry, 'Amt')?.attr.Ccy;
    if (waehrung && waehrung !== 'EUR') continue;
    const datum = datumVon(ntry, 'BookgDt') || datumVon(ntry, 'ValDt');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) continue;
    const ref = brauchbar(wert(ntry, 'AcctSvcrRef')) || brauchbar(wert(ntry, 'NtryRef'));
    const txs = alle(ntry, 'TxDtls');
    if (txs.length <= 1) {
      const tx = txs[0];
      const betrag = centAusXml(wert(ntry, 'Amt'));
      if (!betrag || betrag <= 0) continue;
      const txRef = brauchbar(wert(tx, 'Refs/AcctSvcrRef')) || brauchbar(wert(tx, 'Refs/EndToEndId'));
      umsaetze.push({ zeile: nr, datum, betrag, name: nameVon(tx), iban: ibanVon(tx), zweck: zweckVon(tx, ntry), referenz: ref || txRef ? `camt:${ref || txRef}` : undefined });
      continue;
    }
    txs.forEach((tx, i) => {
      if (wert(tx, 'CdtDbtInd') === 'DBIT') return;
      const betrag = centAusXml(wert(tx, 'Amt') || wert(tx, 'AmtDtls/TxAmt/Amt') || wert(tx, 'AmtDtls/InstdAmt/Amt'));
      if (!betrag || betrag <= 0) return;
      const txRef = brauchbar(wert(tx, 'Refs/AcctSvcrRef')) || brauchbar(wert(tx, 'Refs/EndToEndId'));
      const referenz = ref ? `camt:${ref}#${i + 1}` : txRef ? `camt:${txRef}` : undefined;
      umsaetze.push({ zeile: nr, datum, betrag, name: nameVon(tx), iban: ibanVon(tx), zweck: zweckVon(tx, ntry), referenz });
    });
  }
  return { umsaetze, iban };
}
