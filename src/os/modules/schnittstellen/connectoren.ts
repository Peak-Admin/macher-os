/**
 * Integration Hub: Verzeichnis aller Verbindungen zu anderen Programmen (Connector-Registry).
 *
 * Jeder Connector sagt ehrlich,
 * - wie er verbunden wird (`art`): Datei-Import/-Export, über einen externen Integrationsanbieter (OAuth –
 *   Macher OS baut kein eigenes OAuth und speichert keine fremden Passwörter), mit Zugangsschlüssel, oder eingebaut,
 * - was er kann (`faehigkeiten`, in Handwerkersprache),
 * - wie es gerade steht (`status()`: verbunden / nicht verbunden / Fehler / geplant – immer als Text).
 *
 * Der Zustand je Connector (letzte Nutzung, letzter Fehler) liegt in der Sammlung `anbindungen`
 * (ID = Connector-ID), damit jede Verbindung genau einmal existiert.
 */
import { db, defineCollection } from '@core/db';
import { cloudAktiv } from '@core/cloud';
import { einstellung } from '@core/einstellungen';
import { datum } from '@core/format';
import { modul, modulPfad } from '@core/modul';
import type { Basis, Zeitpunkt } from '@core/objects';
import type { Recht } from '@core/session';
import { postfachAdresse } from '@/os/server/postfach';
import { K as DATEV_K, type ExportProtokoll } from '@modules/datev/speicher';
import { bankumsaetze } from '@modules/zahlungen/daten';
import { schnittstellen } from './daten';
import { webhookQuelle, zustellungText } from './webhooks';

export type Kategorie = 'buchhaltung' | 'grosshandel' | 'ausschreibung' | 'kommunikation' | 'kalender' | 'banking' | 'plattform';

export const KATEGORIEN: { id: Kategorie; titel: string; text: string }[] = [
  { id: 'banking', titel: 'Bank', text: 'Zahlungseingänge automatisch den Rechnungen zuordnen.' },
  { id: 'buchhaltung', titel: 'Buchhaltung', text: 'Daten an Steuerberater und Buchhaltung übergeben.' },
  { id: 'grosshandel', titel: 'Großhandel', text: 'Artikel, Preise und Bestellungen deines Großhändlers.' },
  { id: 'ausschreibung', titel: 'Ausschreibungen', text: 'Leistungsverzeichnisse direkt ins Angebot übernehmen.' },
  { id: 'kalender', titel: 'Kalender', text: 'Termine im Handy- oder Bürokalender.' },
  { id: 'kommunikation', titel: 'E-Mail & Telefon', text: 'Anfragen und Nachrichten am richtigen Auftrag.' },
  { id: 'plattform', titel: 'Für Programmierer', text: 'Daten und Ereignisse für eigene Programme.' },
];

/** Wie wird verbunden? */
export type Verbindungsart = 'datei' | 'anbieter' | 'schluessel' | 'eingebaut';

export const VERBINDUNGSART: Record<Verbindungsart, { titel: string; text: string }> = {
  datei: { titel: 'Datei', text: 'Du lädst eine Datei hoch oder herunter. Keine Zugangsdaten nötig.' },
  anbieter: {
    titel: 'Über Integrationspartner',
    text: 'Die Anmeldung läuft beim Anbieter selbst (OAuth) über unseren Integrationspartner. Macher OS sieht und speichert dein Passwort nie.',
  },
  schluessel: { titel: 'Mit Zugangsschlüssel', text: 'Du bekommst vom Anbieter einen Schlüssel oder eine Adresse und trägst sie einmal ein.' },
  eingebaut: { titel: 'Eingebaut', text: 'Läuft ohne Einrichtung, sobald dein Betrieb mit der Cloud verbunden ist.' },
};

export type Zustand = 'verbunden' | 'nicht_verbunden' | 'fehler' | 'geplant';

export interface ConnectorStatus {
  zustand: Zustand;
  /** ein kurzer Satz, z. B. „Zuletzt eingelesen am 01.10.2026“ */
  text: string;
}

export const ZUSTAND_LABEL: Record<Zustand, string> = {
  verbunden: 'Verbunden',
  nicht_verbunden: 'Nicht verbunden',
  fehler: 'Fehler',
  geplant: 'Geplant',
};

export const ZUSTAND_TON = { verbunden: 'erfolg', nicht_verbunden: 'neutral', fehler: 'achtung', geplant: 'neutral' } as const;

export interface Connector {
  id: string;
  titel: string;
  kategorie: Kategorie;
  /** ein Satz: wofür? */
  text: string;
  art: Verbindungsart;
  /** was geht damit – kurze Verben */
  faehigkeiten: string[];
  /** heute nutzbar? Sonst ehrlich „geplant“ */
  verfuegbar: boolean;
  /** wo die Arbeit passiert */
  pfad?: string;
  /** Beschriftung des Knopfs, z. B. „DATANORM einlesen“ */
  aktion?: string;
  /** wer sieht den Connector */
  recht?: Recht;
  /** Technisches für „Weitere Optionen“ (Formate, Versionen, Adressen) */
  technik?: string[];
  status: () => ConnectorStatus;
}

// ------------------------------------------------------------------ Zustand je Connector

export interface Anbindung extends Basis {
  /** letzte erfolgreiche Nutzung (Import, Export, Abruf) */
  zuletzt?: Zeitpunkt;
  /** z. B. „1.204 Artikel eingelesen“ */
  zuletztText?: string;
  fehler?: string;
  fehlerAm?: Zeitpunkt;
}

export const anbindungen = defineCollection<Anbindung>('anbindungen');

/** Erfolgreiche Nutzung vermerken (löscht einen alten Fehler) */
export function nutzungMelden(connectorId: string, text: string) {
  const patch = { zuletzt: new Date().toISOString(), zuletztText: text, fehler: undefined, fehlerAm: undefined };
  if (anbindungen.get(connectorId)) anbindungen.update(connectorId, patch, { text });
  else anbindungen.create({ id: connectorId, ...patch });
}

/** Fehler vermerken – erscheint als Status „Fehler“ mit dem Satz */
export function fehlerMelden(connectorId: string, fehler: string) {
  const patch = { fehler, fehlerAm: new Date().toISOString() };
  if (anbindungen.get(connectorId)) anbindungen.update(connectorId, patch, { text: fehler });
  else anbindungen.create({ id: connectorId, ...patch });
}

/** Status aus der Anbindung: Fehler gewinnt, sonst letzte Nutzung, sonst `leer` */
export function statusAusAnbindung(id: string, leer: ConnectorStatus): ConnectorStatus {
  const a = anbindungen.get(id);
  if (a?.fehler && (!a.zuletzt || (a.fehlerAm ?? '') > a.zuletzt)) return { zustand: 'fehler', text: a.fehler };
  if (a?.zuletzt) return { zustand: 'verbunden', text: `Zuletzt am ${datum(a.zuletzt)}${a.zuletztText ? `: ${a.zuletztText}` : ''}` };
  return leer;
}

const geplant = (text = 'Kommt – wir richten das über einen Integrationspartner ein.'): (() => ConnectorStatus) => () => ({ zustand: 'geplant', text });

// ------------------------------------------------------------------ Verzeichnis

export function connectoren(): Connector[] {
  const datev = modul('datev');
  const telefon = modul('telefon');
  return [
    // Bank
    {
      id: 'kontoauszug',
      titel: 'Kontoauszug',
      kategorie: 'banking',
      text: 'Umsätze als CAMT.053 oder CSV aus dem Online-Banking einlesen. Macher ordnet die Zahlungen den Rechnungen zu.',
      art: 'datei',
      faehigkeiten: ['Zahlungen zuordnen', 'Skonto erkennen', 'Mahnungen stoppen'],
      verfuegbar: true,
      pfad: '/betrieb/zahlungen/import',
      aktion: 'Kontoauszug einlesen',
      recht: 'geld',
      technik: ['CAMT.053, CAMT.052, CAMT.054 (ISO 20022, XML)', 'CSV mit Semikolon, deutsche Zahlen, UTF-8 oder Windows-1252', 'Dubletten werden an der Bankreferenz erkannt'],
      status: () => {
        const letzter = bankumsaetze
          .all()
          .filter((u) => u.quelle !== 'bank')
          .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))[0];
        return letzter ? { zustand: 'verbunden', text: `Zuletzt eingelesen am ${datum(letzter.erstelltAm)}` } : { zustand: 'nicht_verbunden', text: 'Noch kein Kontoauszug eingelesen' };
      },
    },
    {
      id: 'bankverbindung',
      titel: 'Bankkonto verbinden',
      kategorie: 'banking',
      text: 'Umsätze kommen jeden Tag von selbst – ohne Datei. Die Anmeldung bei deiner Bank läuft über einen Kontoinformationsdienst.',
      art: 'anbieter',
      faehigkeiten: ['Umsätze täglich abholen', 'Zahlungen automatisch zuordnen'],
      verfuegbar: false,
      recht: 'geld',
      technik: ['Eingang: POST /api/eingang/bank (signiert, siehe docs/os/BACKEND.md)', 'Umsätze werden als „bankumsaetze“ gespeichert und abgeglichen'],
      status: () => {
        const letzter = bankumsaetze
          .all()
          .filter((u) => u.quelle === 'bank')
          .sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))[0];
        if (letzter) return { zustand: 'verbunden', text: `Letzter Umsatz am ${datum(letzter.datum)}` };
        return { zustand: 'geplant', text: 'Kommt – bis dahin den Kontoauszug als Datei einlesen.' };
      },
    },
    // Buchhaltung
    {
      id: 'datev',
      titel: 'DATEV',
      kategorie: 'buchhaltung',
      text: 'Rechnungen und Belege im DATEV-Format an deinen Steuerberater übergeben.',
      art: 'datei',
      faehigkeiten: ['Buchungsstapel exportieren', 'Monatsabschluss vorbereiten'],
      verfuegbar: !!datev,
      pfad: datev ? modulPfad(datev) : undefined,
      aktion: 'Zum Export',
      recht: 'geld',
      technik: ['DATEV-Format EXTF 700, Buchungsstapel (Kategorie 21)', 'Kontenrahmen SKR03 oder SKR04'],
      status: () => {
        const letzter = einstellung<ExportProtokoll[]>(DATEV_K.exporte, [])[0];
        return letzter ? { zustand: 'verbunden', text: `Letzter Export am ${datum(letzter.zeitpunkt)}` } : { zustand: 'nicht_verbunden', text: 'Noch nichts übergeben' };
      },
    },
    {
      id: 'lexware',
      titel: 'Lexware Office',
      kategorie: 'buchhaltung',
      text: 'Rechnungen und Belege automatisch an Lexware übertragen.',
      art: 'anbieter',
      faehigkeiten: ['Rechnungen übertragen', 'Belege übertragen', 'Kunden abgleichen'],
      verfuegbar: false,
      recht: 'geld',
      technik: ['Kundenliste aus Lexware kannst du schon heute beim Einrichten als CSV übernehmen'],
      status: geplant(),
    },
    // Großhandel
    {
      id: 'datanorm',
      titel: 'DATANORM',
      kategorie: 'grosshandel',
      text: 'Artikel und Preise deines Großhändlers einlesen – vorhandene Artikel werden aktualisiert, nicht verdoppelt.',
      art: 'datei',
      faehigkeiten: ['Artikel anlegen', 'Preise aktualisieren', 'EAN übernehmen'],
      verfuegbar: true,
      pfad: '/betrieb/schnittstellen/datanorm',
      aktion: 'DATANORM einlesen',
      recht: 'geld',
      technik: ['DATANORM 4 und 5, Satzarten A (Artikel) und B (Zusatz/EAN)', 'Zeichensatz UTF-8, CP850 (DOS) oder Windows-1252', 'Kennzeichen „L“ deaktiviert Artikel'],
      status: () => statusAusAnbindung('datanorm', { zustand: 'nicht_verbunden', text: 'Noch keine Datei eingelesen' }),
    },
    {
      id: 'ids-connect',
      titel: 'IDS Connect',
      kategorie: 'grosshandel',
      text: 'Im Shop deines Großhändlers bestellen – der Warenkorb kommt als Bestellung zurück an den Auftrag.',
      art: 'schluessel',
      faehigkeiten: ['Im Shop bestellen', 'Verfügbarkeit prüfen', 'Warenkorb übernehmen'],
      verfuegbar: false,
      recht: 'geld',
      technik: ['IDS Connect 2.x (Warenkorb-Rückgabe per Hook-Adresse)', 'Zugangsdaten: Kundennummer und Shop-Benutzer deines Großhändlers'],
      status: geplant('Kommt – bis dahin Bestellungen in Macher anlegen und per E-Mail senden.'),
    },
    {
      id: 'oci',
      titel: 'OCI',
      kategorie: 'grosshandel',
      text: 'Shops, die das Open Catalog Interface anbieten, wie IDS Connect nutzen.',
      art: 'schluessel',
      faehigkeiten: ['Im Shop bestellen', 'Warenkorb übernehmen'],
      verfuegbar: false,
      recht: 'geld',
      technik: ['SAP OCI 4.0 / 5.0 (NEW_ITEM-Felder)'],
      status: geplant(),
    },
    {
      id: 'ugl',
      titel: 'UGL',
      kategorie: 'grosshandel',
      text: 'Anfragen, Bestellungen und Lieferscheine mit dem Großhandel als Datei austauschen.',
      art: 'datei',
      faehigkeiten: ['Bestellung senden', 'Lieferschein einlesen'],
      verfuegbar: false,
      recht: 'geld',
      technik: ['UGL 4.0 (Anfrage, Angebot, Auftrag, Lieferschein)'],
      status: geplant('Kommt.'),
    },
    {
      id: 'shk-connect',
      titel: 'SHK Connect',
      kategorie: 'grosshandel',
      text: 'Herstellerdaten, Bilder und Ersatzteile aus dem SHK-Portal.',
      art: 'anbieter',
      faehigkeiten: ['Herstellerdaten übernehmen', 'Ersatzteile finden'],
      verfuegbar: false,
      recht: 'geld',
      status: geplant(),
    },
    // Ausschreibungen
    {
      id: 'gaeb',
      titel: 'GAEB',
      kategorie: 'ausschreibung',
      text: 'Leistungsverzeichnis aus einer Ausschreibung einlesen – die Positionen landen im Angebot, du trägst nur noch Preise ein.',
      art: 'datei',
      faehigkeiten: ['LV ins Angebot übernehmen', 'Mengen und Einheiten übernehmen', 'Bedarfs- und Wahlpositionen erkennen'],
      verfuegbar: true,
      pfad: '/betrieb/schnittstellen/gaeb',
      aktion: 'LV einlesen',
      recht: 'geld',
      technik: ['GAEB DA XML 3.x: X83 (Angebotsaufforderung), X84 (Angebotsabgabe), auch X81 und X86', 'Ordnungszahlen aus den Ebenen (z. B. 01.02.0010)', 'Export als X84: geplant'],
      status: () => statusAusAnbindung('gaeb', { zustand: 'nicht_verbunden', text: 'Noch kein Leistungsverzeichnis eingelesen' }),
    },
    // Kalender
    {
      id: 'kalenderdatei',
      titel: 'Kalenderdatei',
      kategorie: 'kalender',
      text: 'Alle oder nur deine Termine für Outlook, Google Kalender oder das iPhone herunterladen.',
      art: 'datei',
      faehigkeiten: ['Termine exportieren', 'Adresse, Kunde und Team im Termin'],
      verfuegbar: true,
      pfad: '/betrieb/schnittstellen/export',
      aktion: 'Termine exportieren',
      technik: ['iCalendar (ICS, RFC 5545)', 'Stabile Termin-IDs: erneuter Import aktualisiert statt doppelt'],
      status: () => {
        const l = schnittstellen.all().filter((p) => p.art === 'ics').sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))[0];
        return l ? { zustand: 'verbunden', text: `Zuletzt exportiert am ${datum(l.erstelltAm)}` } : { zustand: 'nicht_verbunden', text: 'Noch nicht exportiert' };
      },
    },
    {
      id: 'google-kalender',
      titel: 'Google Kalender',
      kategorie: 'kalender',
      text: 'Termine laufend in Google Kalender – neue und verschobene Termine kommen von selbst.',
      art: 'anbieter',
      faehigkeiten: ['Termine abgleichen', 'Belegte Zeiten berücksichtigen'],
      verfuegbar: false,
      technik: ['Bis dahin: Kalenderdatei (ICS) herunterladen'],
      status: geplant(),
    },
    {
      id: 'microsoft-kalender',
      titel: 'Outlook / Microsoft 365',
      kategorie: 'kalender',
      text: 'Termine laufend im Outlook-Kalender deines Teams.',
      art: 'anbieter',
      faehigkeiten: ['Termine abgleichen', 'Belegte Zeiten berücksichtigen'],
      verfuegbar: false,
      technik: ['Bis dahin: Kalenderdatei (ICS) herunterladen'],
      status: geplant(),
    },
    // Kommunikation
    {
      id: 'email',
      titel: 'E-Mail',
      kategorie: 'kommunikation',
      text: 'Anfragen per E-Mail landen als Anfrage in Macher. Angebote und Rechnungen gehen mit deinem Betriebsnamen raus.',
      art: 'eingebaut',
      faehigkeiten: ['Anfragen empfangen', 'Angebote und Rechnungen senden'],
      verfuegbar: true,
      technik: [`Anfrage-Postfach: ${postfachAdresse(db.betrieb.get('betrieb')?.name)}`, 'Versand über Resend, Antworten gehen an die E-Mail deines Betriebs'],
      status: () =>
        cloudAktiv()
          ? { zustand: 'verbunden', text: `Anfragen an ${postfachAdresse(db.betrieb.get('betrieb')?.name)}` }
          : { zustand: 'nicht_verbunden', text: 'Braucht die Cloud-Verbindung – bis dahin öffnet „Per E-Mail senden“ dein Mail-Programm' },
    },
    {
      id: 'telefon',
      titel: 'Telefonanlage',
      kategorie: 'kommunikation',
      text: 'Bei einem Anruf sofort sehen, wer dran ist und welcher Auftrag offen ist.',
      art: 'schluessel',
      faehigkeiten: ['Anrufer erkennen', 'Anruf am Auftrag vermerken'],
      verfuegbar: false,
      pfad: telefon ? modulPfad(telefon) : undefined,
      aktion: telefon ? 'Anrufe erfassen' : undefined,
      technik: ['Bis dahin: Anrufe in „Telefon & Empfang“ von Hand erfassen'],
      status: geplant('Kommt – Anrufe erfasst du bis dahin von Hand.'),
    },
    // Plattform
    {
      id: 'json',
      titel: 'Datenexport',
      kategorie: 'plattform',
      text: 'Alle Daten lesbar als JSON – für ein anderes Programm oder deinen IT-Dienstleister.',
      art: 'datei',
      faehigkeiten: ['Alle Daten exportieren'],
      verfuegbar: true,
      pfad: '/betrieb/schnittstellen/export',
      aktion: 'Daten exportieren',
      recht: 'admin',
      technik: ['JSON, Geldbeträge in Cent, Datum als JJJJ-MM-TT, Verweise per ID', 'Ohne Papierkorb und interne Protokolle'],
      status: () => {
        const l = schnittstellen.all().filter((p) => p.art === 'json').sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm))[0];
        return l ? { zustand: 'verbunden', text: `Zuletzt exportiert am ${datum(l.erstelltAm)}` } : { zustand: 'nicht_verbunden', text: 'Noch nicht exportiert' };
      },
    },
    {
      id: 'webhooks',
      titel: 'Webhooks',
      kategorie: 'plattform',
      text: 'Ein anderes Programm erfährt sofort, wenn etwas passiert – z. B. „Rechnung bezahlt“.',
      art: 'schluessel',
      faehigkeiten: ['Bei Ereignissen benachrichtigen', 'Signiert mit eigenem Geheimnis'],
      verfuegbar: true,
      pfad: '/betrieb/schnittstellen/webhooks',
      aktion: 'Webhooks einrichten',
      recht: 'admin',
      technik: ['POST mit JSON, Kopfzeile x-macher-signatur: sha256=<HMAC>'],
      status: () => {
        const abos = webhookQuelle().abos();
        if (!abos.length) return { zustand: 'nicht_verbunden', text: 'Noch kein Webhook eingerichtet' };
        const fehler = abos.find((a) => a.letzteZustellung && !a.letzteZustellung.ok);
        if (fehler) return { zustand: 'fehler', text: `Zustellung an ${new URL(fehler.url).host} fehlgeschlagen` };
        const n = abos.filter((a) => a.aktiv).length;
        return { zustand: webhookQuelle().zustellungAktiv() ? 'verbunden' : 'nicht_verbunden', text: `${n === 1 ? '1 Webhook' : `${n} Webhooks`} aktiv – ${zustellungText()}` };
      },
    },
    {
      id: 'api',
      titel: 'Programmierschnittstelle (API)',
      kategorie: 'plattform',
      text: 'Daten aus eigenen Programmen lesen und schreiben – mit denselben Rechten wie in Macher.',
      art: 'schluessel',
      faehigkeiten: ['Daten lesen', 'Daten schreiben'],
      verfuegbar: false,
      recht: 'admin',
      status: geplant('Kommt – bis dahin Datenexport und Webhooks nutzen.'),
    },
  ];
}

export function connector(id: string): Connector | undefined {
  return connectoren().find((c) => c.id === id);
}
