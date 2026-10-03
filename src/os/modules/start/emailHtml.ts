/**
 * Gestaltete E-Mail für Angebot und Rechnung: Das Dokument steht direkt in der Mail (Positionen, Summen),
 * damit der Kunde auch ohne Link alles sieht. E-Mail-Programme brauchen Inline-Styles und feste Farben –
 * die Werte entsprechen den Playbook-Tokens (Markengrün, tiefes Grün, Linie, Text).
 */
import type { Betrieb, Position } from '@core/objects';
import { adresseText, euro, positionSumme, zahl } from '@core/format';

const FARBE = { gruen: '#2F9250', tief: '#06480C', text: '#374040', linie: '#D9D9D9', flaeche: '#F7FAFB' };

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface DokumentMail {
  betrieb?: Betrieb;
  titel: string;
  daten: [string, string][];
  absaetze: string[];
  zeilen: { pos: string; text: string; menge: string; einzel: string; gesamt: string }[];
  summen: [string, string, boolean?][];
  link?: { label: string; url: string };
  schluss: string[];
}

export function dokumentHtml(m: DokumentMail): string {
  const b = m.betrieb;
  const zelle = 'padding:8px 6px;border-bottom:1px solid ' + FARBE.linie;
  const absender = [b?.adresse?.strasse ? adresseText(b.adresse) : '', b?.telefon ? `Tel. ${b.telefon}` : '', b?.email ?? ''].filter(Boolean).map(esc).join(' · ');
  return `<!doctype html><html lang="de"><body style="margin:0;padding:0;background:${FARBE.flaeche};font-family:Barlow,Arial,Helvetica,sans-serif;color:${FARBE.text};font-size:15px;line-height:1.5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FARBE.flaeche}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;border:1px solid ${FARBE.linie};border-radius:8px">
<tr><td style="padding:24px 24px 12px;border-bottom:2px solid ${FARBE.gruen}">
<div style="font-size:20px;font-weight:700;color:#000000">${esc(b?.name ?? '')}</div>
${absender ? `<div style="font-size:12px;margin-top:4px">${absender}</div>` : ''}
</td></tr>
<tr><td style="padding:20px 24px 8px">
<div style="font-size:22px;font-weight:700;color:#000000;margin-bottom:8px">${esc(m.titel)}</div>
<div style="font-size:13px;margin-bottom:12px">${m.daten.map(([l, w]) => `${esc(l)}: <strong>${esc(w)}</strong>`).join(' &nbsp;·&nbsp; ')}</div>
${m.absaetze.map((p) => `<p style="margin:0 0 12px">${esc(p)}</p>`).join('')}
</td></tr>
<tr><td style="padding:0 24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
<tr style="text-align:left;font-size:12px"><th style="${zelle}">Pos.</th><th style="${zelle}">Beschreibung</th><th style="${zelle};text-align:right">Menge</th><th style="${zelle};text-align:right">Einzelpreis</th><th style="${zelle};text-align:right">Gesamt</th></tr>
${m.zeilen.map((z) => `<tr><td style="${zelle}">${esc(z.pos)}</td><td style="${zelle}">${esc(z.text)}</td><td style="${zelle};text-align:right;white-space:nowrap">${esc(z.menge)}</td><td style="${zelle};text-align:right;white-space:nowrap">${esc(z.einzel)}</td><td style="${zelle};text-align:right;white-space:nowrap">${esc(z.gesamt)}</td></tr>`).join('')}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px">
${m.summen.map(([l, w, fett]) => `<tr><td style="padding:4px 6px;text-align:right${fett ? ';font-weight:700;font-size:16px;color:#000000' : ''}">${esc(l)}</td><td style="padding:4px 6px;text-align:right;white-space:nowrap;width:120px${fett ? ';font-weight:700;font-size:16px;color:#000000' : ''}">${esc(w)}</td></tr>`).join('')}
</table>
</td></tr>
${m.link ? `<tr><td style="padding:20px 24px 4px"><a href="${esc(m.link.url)}" style="display:inline-block;background:${FARBE.gruen};color:#FFFFFF;font-weight:700;font-size:19px;text-decoration:none;padding:12px 20px;border-radius:4px">${esc(m.link.label)}</a></td></tr>` : ''}
<tr><td style="padding:16px 24px 24px">${m.schluss.map((p) => `<p style="margin:0 0 8px">${esc(p)}</p>`).join('')}</td></tr>
</table>
<div style="font-size:11px;margin-top:12px;color:${FARBE.text}">Versendet mit Handwerk OS im Auftrag von ${esc(b?.name ?? 'Ihrem Handwerksbetrieb')}. Antworten gehen direkt an den Betrieb.</div>
</td></tr></table></body></html>`;
}

/** Positionen als Tabellenzeilen (Hinweistexte ohne Nummer, Bedarfspositionen in Klammern) */
export function zeilenAus(positionen: Position[]): DokumentMail['zeilen'] {
  let nr = 0;
  return positionen.map((p) => {
    if (p.art === 'text') return { pos: '', text: p.text, menge: '', einzel: '', gesamt: '' };
    nr++;
    return {
      pos: String(nr),
      text: p.optional ? `${p.text} (Bedarfsposition, nicht in der Summe)` : p.text,
      menge: `${zahl(p.menge)} ${p.einheit}`,
      einzel: euro(p.einzelpreis),
      gesamt: p.optional ? `(${euro(Math.round(p.menge * p.einzelpreis))})` : euro(positionSumme(p)),
    };
  });
}

/** Absenderangaben für den Versand: Name des Betriebs, Antworten an den Betrieb */
export function absenderVon(b: Betrieb | undefined) {
  return { name: b?.name || undefined, antwortAn: b?.email || undefined };
}
