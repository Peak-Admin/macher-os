import { defineModul } from '@core/modul';
import { db } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { darf } from '@core/session';
import { datum, heute } from '@core/format';
import { abschlussPunkte, monatsSpanne } from './daten';
import { K, type ExportProtokoll } from './speicher';
import { DatevSeite, letzteMonate, monatLabel } from './DatevSeite';

/** Noch nicht übergebene Rechnungen und Belege eines Monats */
function offenImMonat(monat: string) {
  const s = monatsSpanne(monat);
  const exportiert = einstellung<Record<string, string>>(K.rechnungen, {});
  const imMonat = (d: string) => d >= s.von && d <= s.bis;
  const belege = db.belege.where((b) => imMonat(b.datum) && !b.exportiertAm).length;
  const rechnungen = db.rechnungen.where((r) => imMonat(r.datum) && ['versendet', 'teilbezahlt', 'bezahlt'].includes(r.status) && !exportiert[r.id]).length;
  return belege + rechnungen;
}

export default defineModul({
  id: 'datev',
  titel: 'Steuerberater & DATEV',
  bereich: 'betrieb',
  gruppe: 'geld',
  beschreibung: 'Übergibt die benötigten Daten und Belege sauber an die Buchhaltung.',
  icon: 'download',
  gewicht: 58,
  routen: [{ pfad: '', element: DatevSeite }],
  kurzinfo: () => {
    if (!darf('geld')) return undefined;
    const vormonat = letzteMonate(2)[1];
    const offen = offenImMonat(vormonat);
    if (offen) return { text: `${monatLabel(vormonat).split(' ')[0]}: ${offen} nicht übergeben`, ton: 'achtung' };
    const letzter = einstellung<ExportProtokoll[]>(K.exporte, [])[0];
    return letzter ? { text: `Letzter Export ${datum(letzter.zeitpunkt)}`, ton: 'erfolg' } : undefined;
  },
  hinweise: () => {
    // Ab dem 3. des Monats an den Vormonat erinnern (Umsatzsteuer-Voranmeldung bis zum 10.)
    if (Number(heute().slice(8, 10)) < 3) return [];
    const monat = letzteMonate(2)[1];
    const offen = offenImMonat(monat);
    if (!offen) return [];
    const b = { rechnungen: db.rechnungen.all(), belege: db.belege.all(), zeiten: db.zeiten.all() };
    const ungeprueft = abschlussPunkte(b, monat, {}, einstellung(K.rechnungen, {})).find((p) => p.id === 'belege-geprueft');
    return [
      {
        schluessel: `datev-monat:${monat}`,
        art: 'entscheidung' as const,
        titel: `${monatLabel(monat)} an den Steuerberater übergeben`,
        text: `${offen} ${offen === 1 ? 'Rechnung oder Beleg ist' : 'Rechnungen und Belege sind'} noch nicht exportiert.${ungeprueft && !ungeprueft.erledigt ? ' ' + ungeprueft.text : ''} Die Umsatzsteuer-Voranmeldung ist meist am 10. fällig.`,
        gewicht: 48,
        fuerRollen: ['chef' as const, 'buero' as const],
        pfad: `/betrieb/datev?monat=${monat}`,
        aktionen: [
          { aktion: 'datev.oeffnen', label: 'Export vorbereiten', primaer: true, payload: { monat } },
          { aktion: 'datev.abschluss', label: 'Checkliste', payload: { monat } },
        ],
      },
    ];
  },
  aktionen: {
    'datev.oeffnen': (p) => `/betrieb/datev?monat=${(p as { monat?: string })?.monat ?? ''}`,
    'datev.abschluss': (p) => `/betrieb/datev?reiter=abschluss&monat=${(p as { monat?: string })?.monat ?? ''}`,
  },
});
