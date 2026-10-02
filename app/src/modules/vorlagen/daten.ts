/**
 * Vorlagen & Formulare: Textbausteine mit Platzhaltern für Angebot, Rechnung,
 * Mahnung, E-Mail und Terminbestätigung – plus Briefkopf.
 *
 * Für andere Module:
 *   vorlageAnwenden('rechnung.text', kontextAus({ rechnungId }))  → fertiger Text
 *   betreffAnwenden('email.rechnung', kontext)                     → fertiger Betreff
 *   briefkopf()                                                    → Logo, Absender, Fußzeile
 */
import { db, defineCollection } from '@core/db';
import { einstellung } from '@core/einstellungen';
import { adresseText, datum, euro, heute, personName, summen, uhrzeit, zahl } from '@core/format';
import type { Basis, Gewerk, ID } from '@core/objects';

export type VorlagenArt = 'angebot' | 'rechnung' | 'mahnung' | 'email' | 'termin';

export const VORLAGEN_ARTEN: { id: VorlagenArt; label: string; mitBetreff: boolean }[] = [
  { id: 'angebot', label: 'Angebot', mitBetreff: false },
  { id: 'rechnung', label: 'Rechnung', mitBetreff: false },
  { id: 'mahnung', label: 'Zahlungserinnerung & Mahnung', mitBetreff: true },
  { id: 'email', label: 'E-Mail', mitBetreff: true },
  { id: 'termin', label: 'Termin', mitBetreff: true },
];

export interface Vorlage extends Basis {
  /** stabiler Schlüssel für andere Module, z. B. `angebot.einleitung` */
  schluessel: string;
  art: VorlagenArt;
  titel: string;
  betreff?: string;
  text: string;
}

export const vorlagen = defineCollection<Vorlage>('vorlagen');

export const PLATZHALTER: { name: string; beschreibung: string }[] = [
  { name: 'anrede', beschreibung: 'Briefanrede, z. B. „Guten Tag Frau Schulz“' },
  { name: 'kunde', beschreibung: 'Name des Kunden' },
  { name: 'auftrag', beschreibung: 'Titel des Auftrags' },
  { name: 'auftragsnummer', beschreibung: 'Auftragsnummer' },
  { name: 'ort', beschreibung: 'Adresse des Einsatzorts' },
  { name: 'betrag', beschreibung: 'Betrag brutto (Rechnung/Angebot)' },
  { name: 'offen', beschreibung: 'Noch offener Betrag' },
  { name: 'datum', beschreibung: 'Datum des Dokuments' },
  { name: 'faellig', beschreibung: 'Fälligkeitsdatum' },
  { name: 'rechnungsnummer', beschreibung: 'Rechnungsnummer' },
  { name: 'angebotsnummer', beschreibung: 'Angebotsnummer' },
  { name: 'gueltig_bis', beschreibung: 'Angebot gültig bis' },
  { name: 'termin', beschreibung: 'Termin-Datum mit Wochentag' },
  { name: 'uhrzeit', beschreibung: 'Uhrzeit von–bis' },
  { name: 'mitarbeiter', beschreibung: 'Wer kommt' },
  { name: 'betrieb', beschreibung: 'Name deines Betriebs' },
  { name: 'betrieb_telefon', beschreibung: 'Telefon deines Betriebs' },
  { name: 'betrieb_email', beschreibung: 'E-Mail deines Betriebs' },
  { name: 'heute', beschreibung: 'Heutiges Datum' },
];

export type Kontext = Record<string, string | number | undefined | null>;

const MUSTER = /\{([a-zA-Z_äöüÄÖÜß]+)\}/g;

/** Ersetzt `{name}` durch Werte aus dem Kontext. Fehlende Werte bleiben als `{name}` stehen – so fällt die Lücke auf. */
export function platzhalterErsetzen(text: string, kontext: Kontext): string {
  return text.replace(MUSTER, (ganz, name: string) => {
    const w = kontext[name];
    if (w == null || w === '') return ganz;
    return typeof w === 'number' ? zahl(w) : w;
  });
}

/** Welche Platzhalter im Text haben (noch) keinen Wert? */
export function fehlendePlatzhalter(text: string, kontext: Kontext): string[] {
  const fehlt = new Set<string>();
  for (const m of text.matchAll(MUSTER)) {
    const w = kontext[m[1]];
    if (w == null || w === '') fehlt.add(m[1]);
  }
  return [...fehlt];
}

/** Vorlage über ID oder Schlüssel finden (bei mehreren gleichen Schlüsseln: zuletzt geänderte) */
export function vorlageFinden(idOderSchluessel: string): Vorlage | undefined {
  const direkt = vorlagen.get(idOderSchluessel);
  if (direkt && !direkt.geloeschtAm) return direkt;
  return vorlagen
    .where((v) => v.schluessel === idOderSchluessel)
    .sort((a, b) => b.geaendertAm.localeCompare(a.geaendertAm))[0];
}

/** Platzhalter, die immer gefüllt sind (Betrieb, heute) */
export function standardKontext(): Kontext {
  const b = db.betrieb.get('betrieb');
  return { betrieb: b?.name, betrieb_telefon: b?.telefon, betrieb_email: b?.email, heute: datum(heute()) };
}

/**
 * Text einer Vorlage mit eingesetzten Platzhaltern. Keine Seiteneffekte.
 * Leerer Text, wenn es die Vorlage nicht gibt.
 */
export function vorlageAnwenden(idOderSchluessel: string, kontext: Kontext = {}): string {
  const v = vorlageFinden(idOderSchluessel);
  return v ? platzhalterErsetzen(v.text, { ...standardKontext(), ...kontext }) : '';
}

/** Betreff einer Vorlage mit eingesetzten Platzhaltern */
export function betreffAnwenden(idOderSchluessel: string, kontext: Kontext = {}): string {
  const v = vorlageFinden(idOderSchluessel);
  return v?.betreff ? platzhalterErsetzen(v.betreff, { ...standardKontext(), ...kontext }) : '';
}

/** Kontext aus Objekten zusammenstellen (Werte werden gelesen, nicht kopiert) */
export function kontextAus(q: { auftragId?: ID; kundeId?: ID; rechnungId?: ID; angebotId?: ID; terminId?: ID }): Kontext {
  const b = db.betrieb.get('betrieb');
  const ust = b?.kleinunternehmer ? 0 : (b?.ustSatz ?? 19);
  const r = db.rechnungen.get(q.rechnungId);
  const an = db.angebote.get(q.angebotId);
  const t = db.termine.get(q.terminId);
  const auftragId = q.auftragId ?? r?.auftragId ?? an?.auftragId ?? t?.auftragId;
  const a = db.auftraege.get(auftragId);
  const k = db.kunden.get(q.kundeId ?? a?.kundeId ?? r?.kundeId ?? an?.kundeId ?? t?.kundeId);
  const o = db.orte.get(t?.ortId ?? a?.ortId);
  const k2: Kontext = {};
  if (k) {
    k2.kunde = k.name;
    k2.anrede = k.art === 'privat' ? `Guten Tag ${k.name}` : 'Sehr geehrte Damen und Herren';
  }
  if (a) {
    k2.auftrag = a.titel;
    k2.auftragsnummer = a.nummer;
  }
  if (o) k2.ort = adresseText(o.adresse);
  else if (k?.adresse) k2.ort = adresseText(k.adresse);
  if (an) {
    k2.angebotsnummer = an.nummer;
    k2.gueltig_bis = datum(an.gueltigBis);
    k2.datum = datum(an.datum);
    k2.betrag = euro(summen(an.positionen, ust, an.rabattProzent).brutto);
  }
  if (r) {
    const brutto = summen(r.positionen, ust).brutto;
    const bezahlt = db.zahlungen.where((z) => z.rechnungId === r.id).reduce((s, z) => s + z.betrag, 0);
    k2.rechnungsnummer = r.nummer;
    k2.datum = datum(r.datum);
    k2.faellig = datum(r.faelligAm);
    k2.betrag = euro(brutto);
    k2.offen = euro(Math.max(0, brutto - bezahlt));
  }
  if (t) {
    k2.termin = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(t.start));
    k2.uhrzeit = t.ganztags ? 'ganztägig' : `${uhrzeit(t.start)}–${uhrzeit(t.ende)} Uhr`;
    const leute = t.mitarbeiterIds.map((id) => db.mitarbeiter.get(id)).filter(Boolean);
    if (leute.length) k2.mitarbeiter = leute.map((m) => personName(m)).join(', ');
  }
  return k2;
}

// ------------------------------------------------------------------ Briefkopf

export interface BriefkopfEinstellung {
  /** Logo als verkleinerte Data-URL */
  logo?: string;
  /** zusätzliche Zeile in der Fußzeile, z. B. Handwerkskammer, Geschäftsführer */
  zusatz?: string;
  zeigeBank: boolean;
  zeigeSteuer: boolean;
}

export const BRIEFKOPF_KEY = 'vorlagen.briefkopf';
export const BRIEFKOPF_STANDARD: BriefkopfEinstellung = { zeigeBank: true, zeigeSteuer: true };

/** Briefkopf aus den Betriebsdaten – immer aktuell, nichts kopiert */
export function briefkopf(e: BriefkopfEinstellung = einstellung(BRIEFKOPF_KEY, BRIEFKOPF_STANDARD)) {
  const b = db.betrieb.get('betrieb');
  const adresse = b?.adresse?.strasse ? adresseText(b.adresse) : '';
  const fusszeilen = [
    [b?.name, adresse].filter(Boolean).join(' · '),
    [b?.telefon && `Tel. ${b.telefon}`, b?.email].filter(Boolean).join(' · '),
    e.zeigeBank && b?.iban ? `IBAN ${ibanFormat(b.iban)}` : '',
    e.zeigeSteuer ? [b?.steuernummer && `Steuernr. ${b.steuernummer}`, b?.ustId && `USt-IdNr. ${b.ustId}`].filter(Boolean).join(' · ') : '',
    e.zusatz?.trim() ?? '',
  ].filter(Boolean);
  return { logo: e.logo, absenderzeile: [b?.name, adresse].filter(Boolean).join(' · '), fusszeilen };
}

export function ibanFormat(iban: string) {
  return iban.replace(/\s/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();
}

// ------------------------------------------------------------------ Startvorlagen je Gewerk

const ZUGANG: Partial<Record<Gewerk, string>> = {
  elektro: 'Bitte sorgen Sie dafür, dass Zählerschrank und Unterverteilung frei zugänglich sind.',
  shk: 'Bitte sorgen Sie dafür, dass Heizraum, Heizung und Wasseranschlüsse frei zugänglich sind.',
  maler: 'Bitte räumen Sie kleine Möbel und Dekoration aus den Räumen. Große Möbel decken wir für Sie ab.',
  dach: 'Bitte halten Sie die Zufahrt für unser Fahrzeug und den Bereich rund ums Haus frei.',
  tischler: 'Bitte halten Sie den Weg zum Einbauort frei, damit wir die Teile gut hineintragen können.',
  fliesen: 'Bitte räumen Sie den Raum vorher leer. Wasser und Strom sollten vor Ort verfügbar sein.',
  garten: 'Bitte sorgen Sie dafür, dass wir Zugang zum Garten haben, auch wenn Sie nicht zu Hause sind.',
  metall: 'Bitte halten Sie den Montagebereich frei. Für die Montage brauchen wir einen Stromanschluss.',
  bau: 'Bitte halten Sie die Zufahrt frei und sorgen Sie für Baustrom und Wasser.',
};

const LEISTUNGSWORT: Partial<Record<Gewerk, string>> = {
  elektro: 'Elektroarbeiten',
  shk: 'Arbeiten',
  maler: 'Maler- und Lackierarbeiten',
  dach: 'Dacharbeiten',
  tischler: 'Tischlerarbeiten',
  fliesen: 'Fliesenarbeiten',
  garten: 'Garten- und Landschaftsbauarbeiten',
  metall: 'Metallbauarbeiten',
  bau: 'Bauleistungen',
};

export function startVorlagen(gewerk: Gewerk): Omit<Vorlage, keyof Basis>[] {
  const leistung = LEISTUNGSWORT[gewerk] ?? 'Arbeiten';
  const zugang = ZUGANG[gewerk] ? `\n\n${ZUGANG[gewerk]}` : '';
  return [
    {
      schluessel: 'angebot.einleitung',
      art: 'angebot',
      titel: 'Angebot – Einleitung',
      text: `{anrede},\n\nvielen Dank für Ihre Anfrage und das Vertrauen in unseren Betrieb. Gerne bieten wir Ihnen die folgenden ${leistung} für „{auftrag}“ an:`,
    },
    {
      schluessel: 'angebot.schluss',
      art: 'angebot',
      titel: 'Angebot – Schluss',
      text: 'Dieses Angebot gilt bis {gueltig_bis}. Den Ausführungstermin stimmen wir nach Ihrer Zusage gemeinsam ab.\n\nHaben Sie Fragen? Sie erreichen uns unter {betrieb_telefon}.\n\nMit freundlichen Grüßen\n{betrieb}',
    },
    {
      schluessel: 'rechnung.text',
      art: 'rechnung',
      titel: 'Rechnung – Text',
      text: '{anrede},\n\nvielen Dank für Ihren Auftrag. Für die ausgeführten Arbeiten „{auftrag}“ stellen wir Ihnen in Rechnung:',
    },
    {
      schluessel: 'rechnung.schluss',
      art: 'rechnung',
      titel: 'Rechnung – Zahlungshinweis',
      text: 'Bitte überweisen Sie {betrag} bis zum {faellig} unter Angabe der Rechnungsnummer {rechnungsnummer}.\n\nMit freundlichen Grüßen\n{betrieb}',
    },
    {
      schluessel: 'mahnung.erinnerung',
      art: 'mahnung',
      titel: 'Zahlungserinnerung',
      betreff: 'Zahlungserinnerung zu Rechnung {rechnungsnummer}',
      text: '{anrede},\n\nsicher ist es Ihrer Aufmerksamkeit entgangen: Unsere Rechnung {rechnungsnummer} vom {datum} über {betrag} war am {faellig} fällig. Offen sind noch {offen}.\n\nBitte überweisen Sie den Betrag in den nächsten 7 Tagen. Falls Sie bereits bezahlt haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.\n\nMit freundlichen Grüßen\n{betrieb}',
    },
    {
      schluessel: 'mahnung.stufe1',
      art: 'mahnung',
      titel: '1. Mahnung',
      betreff: '1. Mahnung zu Rechnung {rechnungsnummer}',
      text: '{anrede},\n\nauf unsere Zahlungserinnerung haben wir leider noch keinen Zahlungseingang festgestellt. Offen sind aus Rechnung {rechnungsnummer} vom {datum} noch {offen}.\n\nBitte überweisen Sie den Betrag innerhalb von 7 Tagen. Melden Sie sich gern, wenn es Fragen zur Rechnung gibt.\n\nMit freundlichen Grüßen\n{betrieb}',
    },
    {
      schluessel: 'mahnung.stufe2',
      art: 'mahnung',
      titel: '2. Mahnung',
      betreff: '2. Mahnung zu Rechnung {rechnungsnummer}',
      text: '{anrede},\n\ntrotz Erinnerung und Mahnung ist unsere Rechnung {rechnungsnummer} vom {datum} weiterhin offen. Offen sind noch {offen}.\n\nBitte überweisen Sie den Betrag innerhalb von 7 Tagen. Danach müssen wir die Forderung leider ohne weitere Ankündigung abgeben.\n\nMit freundlichen Grüßen\n{betrieb}',
    },
    {
      schluessel: 'email.angebot',
      art: 'email',
      titel: 'E-Mail – Angebot senden',
      betreff: 'Ihr Angebot {angebotsnummer}: {auftrag}',
      text: '{anrede},\n\nanbei erhalten Sie unser Angebot {angebotsnummer} für „{auftrag}“. Es gilt bis {gueltig_bis}.\n\nWenn alles passt, reicht eine kurze Antwort auf diese E-Mail.\n\nViele Grüße\n{betrieb}\n{betrieb_telefon}',
    },
    {
      schluessel: 'email.rechnung',
      art: 'email',
      titel: 'E-Mail – Rechnung senden',
      betreff: 'Ihre Rechnung {rechnungsnummer}',
      text: '{anrede},\n\nanbei erhalten Sie unsere Rechnung {rechnungsnummer} über {betrag}. Bitte überweisen Sie den Betrag bis zum {faellig}.\n\nVielen Dank für Ihren Auftrag!\n\nViele Grüße\n{betrieb}',
    },
    {
      schluessel: 'email.rueckfrage',
      art: 'email',
      titel: 'E-Mail – Rückfrage zur Anfrage',
      betreff: 'Ihre Anfrage: {auftrag}',
      text: '{anrede},\n\nvielen Dank für Ihre Anfrage. Damit wir Ihnen schnell ein passendes Angebot machen können, schicken Sie uns bitte ein paar Fotos und, wenn vorhanden, die Maße.\n\nViele Grüße\n{betrieb}\n{betrieb_telefon}',
    },
    {
      schluessel: 'termin.bestaetigung',
      art: 'termin',
      titel: 'Terminbestätigung',
      betreff: 'Terminbestätigung: {termin}',
      text: `{anrede},\n\nhiermit bestätigen wir Ihren Termin für „{auftrag}“:\n\n{termin}, {uhrzeit}\n{ort}\n\nEs kommt: {mitarbeiter}.${zugang}\n\nFalls etwas dazwischenkommt, rufen Sie uns bitte unter {betrieb_telefon} an.\n\nViele Grüße\n{betrieb}`,
    },
    {
      schluessel: 'termin.erinnerung',
      art: 'termin',
      titel: 'Terminerinnerung (kurz, für SMS)',
      betreff: 'Erinnerung: Termin {termin}',
      text: 'Erinnerung: {betrieb} kommt am {termin}, {uhrzeit}. Fragen? {betrieb_telefon}',
    },
  ];
}
