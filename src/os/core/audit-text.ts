/**
 * Klartext für den Verlauf am Objekt („Geändert: Status (Entwurf → Versendet) – durch Macher“).
 * Rein und ohne Datenzugriff, damit die Datenschicht ihn beim Protokollieren nutzen kann.
 */
import type { Akteur } from './akteur';
import type { FeldAenderung } from './objects';
import { PHASEN } from './objects';

/** Sprechende Namen für häufige Felder. Unbekannte Felder erscheinen als „weitere Angaben“. */
export const FELD_LABEL: Record<string, string> = {
  status: 'Status',
  phase: 'Schritt',
  titel: 'Titel',
  name: 'Name',
  firma: 'Firma',
  vorname: 'Vorname',
  nachname: 'Nachname',
  positionen: 'Positionen',
  faelligAm: 'Fällig am',
  gueltigBis: 'Gültig bis',
  datum: 'Datum',
  start: 'Beginn',
  ende: 'Ende',
  mitarbeiterIds: 'Mitarbeiter',
  mitarbeiterId: 'Mitarbeiter',
  notiz: 'Notiz',
  beschreibung: 'Beschreibung',
  einleitung: 'Einleitung',
  telefon: 'Telefon',
  email: 'E-Mail',
  adresse: 'Adresse',
  ansprechpartner: 'Ansprechpartner',
  betrag: 'Betrag',
  menge: 'Menge',
  preis: 'Preis',
  ek: 'Einkaufspreis',
  vk: 'Verkaufspreis',
  bestand: 'Bestand',
  mindestbestand: 'Mindestbestand',
  kundeId: 'Kunde',
  auftragId: 'Auftrag',
  ortId: 'Ort',
  zustaendigId: 'Zuständig',
  verantwortlichId: 'Verantwortlich',
  erledigt: 'Erledigt',
  prioritaet: 'Priorität',
  nummer: 'Nummer',
  mahnstufe: 'Mahnstufe',
  rabattProzent: 'Rabatt',
  wunschtermin: 'Wunschtermin',
  dringend: 'Dringend',
  geplanteStunden: 'Geplante Stunden',
  art: 'Art',
  rolle: 'Rolle',
  aktiv: 'Aktiv',
  von: 'Von',
  bis: 'Bis',
  text: 'Text',
  kanal: 'Kanal',
  geloeschtAm: 'Papierkorb',
};

const STATUS_LABEL: Record<string, string> = {
  entwurf: 'Entwurf',
  versendet: 'Versendet',
  angenommen: 'Angenommen',
  abgelehnt: 'Abgelehnt',
  abgelaufen: 'Abgelaufen',
  teilbezahlt: 'Teilweise bezahlt',
  bezahlt: 'Bezahlt',
  storniert: 'Storniert',
  geplant: 'Geplant',
  bestaetigt: 'Bestätigt',
  unterwegs: 'Unterwegs',
  vor_ort: 'Vor Ort',
  erledigt: 'Erledigt',
  abgesagt: 'Abgesagt',
  beantragt: 'Beantragt',
  genehmigt: 'Genehmigt',
  offen: 'Offen',
  verworfen: 'Verworfen',
  neu: 'Neu',
  geprueft: 'Geprüft',
  bestellt: 'Bestellt',
  bereit: 'Bereit',
  verbraucht: 'Verbraucht',
  vorbereitet: 'Vorbereitet',
  ...Object.fromEntries(PHASEN.map((p) => [p.id, p.label])),
};

/** Ein Statuswert in Klartext („vor_ort“ → „Vor Ort“) */
export function statusLabel(wert: unknown): string {
  if (typeof wert !== 'string' || !wert) return '–';
  return STATUS_LABEL[wert] ?? wert.charAt(0).toUpperCase() + wert.slice(1).replace(/_/g, ' ');
}

/** „Geändert: Status (Entwurf → Versendet), Positionen“ – höchstens drei Felder, dann „und 2 weitere“ */
export function felderText(felder: Record<string, FeldAenderung> | undefined): string {
  if (!felder) return '';
  const namen: string[] = [];
  let unbekannt = 0;
  for (const [f, a] of Object.entries(felder)) {
    const label = FELD_LABEL[f];
    if (!label) {
      unbekannt++;
      continue;
    }
    if ((f === 'status' || f === 'phase') && !a.gekuerzt) namen.push(`${label} (${statusLabel(a.vorher)} → ${statusLabel(a.nachher)})`);
    else if (f === 'geloeschtAm') continue;
    else namen.push(label);
  }
  const sichtbar = namen.slice(0, 3);
  const weitere = namen.length - sichtbar.length;
  if (!sichtbar.length) return unbekannt ? 'weitere Angaben' : '';
  if (weitere > 0) return `${sichtbar.join(', ')} und ${weitere} weitere`;
  return unbekannt ? `${sichtbar.join(', ')} und weitere Angaben` : sichtbar.join(', ');
}

/** Zusatz für den Verlauf: wer hat es getan, wenn nicht der Mensch selbst? */
export function akteurZusatz(a: Akteur | undefined): string {
  if (!a || a.quelle === 'user') return '';
  if (a.quelle === 'automation' || a.quelle === 'ai') return ' – durch Macher';
  if (a.quelle === 'import') return ' – durch Import';
  if (a.quelle === 'sync') return ' – beim Abgleich';
  return '';
}

const GRUNDTEXT: Record<string, string> = {
  created: 'Angelegt',
  updated: 'Geändert',
  removed: 'In den Papierkorb gelegt',
  restored: 'Wiederhergestellt',
};

/** Text eines automatisch protokollierten Verlaufseintrags */
export function verlaufText(aktion: string, opts: { text?: string; felder?: Record<string, FeldAenderung>; akteur?: Akteur; still?: boolean } = {}): string {
  const zusatz = akteurZusatz(opts.akteur);
  if (opts.text) return opts.text + zusatz;
  if (aktion === 'updated') {
    const f = felderText(opts.felder);
    const grund = opts.still ? 'Bearbeitet' : 'Geändert';
    return `${f ? `${grund}: ${f}` : grund}${zusatz}`;
  }
  return (GRUNDTEXT[aktion] ?? aktion) + zusatz;
}
