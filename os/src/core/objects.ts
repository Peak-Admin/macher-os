/**
 * Kanonische Geschäftsobjekte von Macher OS.
 *
 * Regel: Jedes Objekt existiert genau einmal (eine ID, eine Quelle).
 * Module sind Sichten auf diese Objekte, keine Silos. Modulspezifische
 * Daten liegen in eigenen Sammlungen und verweisen per ID auf diese Objekte
 * (z. B. `{ auftragId }`), statt Daten zu kopieren.
 *
 * Diese Datei gehört zum Kern. Module ändern sie nicht, sondern legen
 * eigene Sammlungen mit `defineCollection` an.
 */

export type ID = string;
/** ISO-Datum `YYYY-MM-DD` */
export type Datum = string;
/** ISO-Zeitstempel */
export type Zeitpunkt = string;
/** Geldbetrag in Cent (ganzzahlig, keine Rundungsfehler) */
export type Cent = number;

export interface Basis {
  id: ID;
  erstelltAm: Zeitpunkt;
  geaendertAm: Zeitpunkt;
  erstelltVon?: ID;
  /** Soft Delete: gesetzt = im Papierkorb, wiederherstellbar */
  geloeschtAm?: Zeitpunkt;
  /** Beispieldaten aus dem Onboarding – sichtbar gekennzeichnet, mit einem Klick entfernbar */
  beispiel?: boolean;
}

export interface Adresse {
  strasse: string;
  plz: string;
  ort: string;
}

/**
 * Verweis auf ein beliebiges Objekt (generische Beziehungsschicht).
 * `typ` ist eine Kernsammlung oder der Name einer Modul-Sammlung (z. B. `servicevertraege`).
 */
export interface Bezug {
  typ: SammlungsName;
  id: ID;
}

/** Name einer Kern- oder Modul-Sammlung */
export type SammlungsName = ObjektTyp | (string & {});

// ---------------------------------------------------------------- Betrieb

export type Gewerk =
  | 'elektro'
  | 'shk'
  | 'maler'
  | 'dach'
  | 'tischler'
  | 'fliesen'
  | 'garten'
  | 'metall'
  | 'bau'
  | 'sonstiges';

export type Arbeitsweise = 'kundendienst' | 'baustelle' | 'werkstatt' | 'wartung';

export interface Betrieb extends Basis {
  name: string;
  gewerk: Gewerk;
  arbeitsweisen: Arbeitsweise[];
  teamgroesse: number;
  adresse: Adresse;
  telefon: string;
  email: string;
  steuernummer?: string;
  ustId?: string;
  iban?: string;
  /** Verrechnungssatz netto je Stunde */
  stundensatz: Cent;
  /** Standard-Zahlungsziel in Tagen */
  zahlungszielTage: number;
  /** USt-Satz in Prozent, Standard 19 */
  ustSatz: number;
  kleinunternehmer?: boolean;
  /** Arbeitszeit-Standard */
  arbeitsbeginn: string; // "07:00"
  arbeitsende: string; // "16:00"
  onboardingFertig: boolean;
}

// ---------------------------------------------------------------- Menschen

export type Rolle = 'chef' | 'buero' | 'monteur' | 'azubi';

export interface Mitarbeiter extends Basis {
  vorname: string;
  nachname: string;
  rolle: Rolle;
  telefon?: string;
  email?: string;
  /** Kennfarbe im Plan (aus der Markenpalette gewählt) */
  farbe?: string;
  wochenstunden: number;
  urlaubstageJahr: number;
  /** interne Kosten je Stunde (Lohn + Nebenkosten) */
  kostensatz: Cent;
  eintritt?: Datum;
  austritt?: Datum;
  aktiv: boolean;
  /** Team/Kolonne, optional */
  team?: string;
  /** Wohnort/Startpunkt für Fahrtplanung */
  startAdresse?: Adresse;
}

export interface Qualifikation extends Basis {
  name: string;
  kategorie: 'fachlich' | 'pflicht' | 'fuehrerschein' | 'zertifikat';
  /** Gültigkeit in Monaten; leer = unbefristet */
  gueltigMonate?: number;
  beschreibung?: string;
}

/** Nachweis: Mitarbeiter X hat Qualifikation Y (bis Datum Z) */
export interface Nachweis extends Basis {
  mitarbeiterId: ID;
  qualifikationId: ID;
  erworbenAm?: Datum;
  gueltigBis?: Datum;
  dokumentId?: ID;
}

export type AbwesenheitsArt = 'urlaub' | 'krank' | 'schule' | 'schulung' | 'frei' | 'sonstiges';

export interface Abwesenheit extends Basis {
  mitarbeiterId: ID;
  art: AbwesenheitsArt;
  von: Datum;
  bis: Datum;
  halbtags?: boolean;
  status: 'beantragt' | 'genehmigt' | 'abgelehnt';
  notiz?: string;
}

// ---------------------------------------------------------------- Kunden & Orte

export interface Ansprechpartner {
  id: ID;
  name: string;
  funktion?: string;
  telefon?: string;
  email?: string;
}

export interface Kunde extends Basis {
  art: 'privat' | 'firma' | 'hausverwaltung' | 'oeffentlich';
  /** Anzeigename: Person oder Firma */
  name: string;
  firma?: string;
  ansprechpartner: Ansprechpartner[];
  telefon?: string;
  email?: string;
  adresse?: Adresse;
  notiz?: string;
  quelle?: Kanal;
  /** eigene Kundennummer */
  nummer?: string;
  zahlungszielTage?: number;
}

export interface Ort extends Basis {
  kundeId: ID;
  bezeichnung: string;
  art: 'haus' | 'wohnung' | 'gewerbe' | 'baustelle' | 'filiale' | 'sonstiges';
  adresse: Adresse;
  /** Zugang, Schlüssel, Parken, Hund … */
  hinweise?: string;
  ansprechpartnerVorOrt?: string;
  telefonVorOrt?: string;
  lat?: number;
  lng?: number;
}

export interface Anlage extends Basis {
  ortId: ID;
  kundeId: ID;
  typ: string; // "Gasheizung", "Wallbox", "PV-Anlage" …
  hersteller?: string;
  modell?: string;
  seriennummer?: string;
  baujahr?: number;
  eingebautAm?: Datum;
  /** Wartungsintervall in Monaten */
  wartungMonate?: number;
  letzteWartung?: Datum;
  naechsteWartung?: Datum;
  gewaehrleistungBis?: Datum;
  notiz?: string;
}

// ---------------------------------------------------------------- Vorgang / Auftrag

export type Kanal = 'telefon' | 'email' | 'website' | 'whatsapp' | 'empfehlung' | 'portal' | 'vor_ort' | 'sonstiges';

/**
 * Ein Auftrag ist der durchgehende Vorgang vom ersten Kontakt bis zur Bezahlung.
 * Eine Anfrage IST ein Auftrag in Phase "anfrage" – kein separates Objekt.
 */
export type Phase =
  | 'anfrage'
  | 'besichtigung'
  | 'angebot'
  | 'beauftragt'
  | 'in_arbeit'
  | 'abnahme'
  | 'abrechnung'
  | 'erledigt'
  | 'verloren';

export const PHASEN: { id: Phase; label: string }[] = [
  { id: 'anfrage', label: 'Anfrage' },
  { id: 'besichtigung', label: 'Besichtigung' },
  { id: 'angebot', label: 'Angebot' },
  { id: 'beauftragt', label: 'Beauftragt' },
  { id: 'in_arbeit', label: 'In Arbeit' },
  { id: 'abnahme', label: 'Abnahme' },
  { id: 'abrechnung', label: 'Abrechnung' },
  { id: 'erledigt', label: 'Erledigt' },
  { id: 'verloren', label: 'Nicht zustande gekommen' },
];

export type Auftragsart = 'kundendienst' | 'projekt' | 'wartung' | 'reklamation' | 'werkstatt';

export interface Auftrag extends Basis {
  nummer: string; // "A-2026-0042"
  titel: string;
  art: Auftragsart;
  phase: Phase;
  kundeId: ID;
  ortId?: ID;
  anlageIds?: ID[];
  beschreibung?: string;
  quelle?: Kanal;
  dringend?: boolean;
  /** verantwortlich im Büro / Bauleitung */
  verantwortlichId?: ID;
  /** gewünschter Zeitraum des Kunden, Freitext */
  wunschtermin?: string;
  /** geschätzte Arbeitsstunden für die Planung */
  geplanteStunden?: number;
  /** benötigte Qualifikationen für die Ausführung */
  qualifikationIds?: ID[];
  /** Grund, falls verloren */
  verlorenGrund?: string;
  /** Leistungen aus dem Leistungskatalog, die erwartet werden */
  leistungIds?: ID[];
  abgeschlossenAm?: Zeitpunkt;
}

/** Eine Aufgabe ist überall dieselbe Aufgabe. Module ergänzen nur Kontext. */
export interface Aufgabe extends Basis {
  titel: string;
  notiz?: string;
  auftragId?: ID;
  bezug?: Bezug;
  zustaendigId?: ID;
  faellig?: Datum;
  erledigt: boolean;
  erledigtAm?: Zeitpunkt;
  prioritaet: 'normal' | 'hoch';
  /** Herkunft, z. B. "checkliste", "macher", "manuell" */
  quelle?: string;
  reihenfolge?: number;
}

export type TerminArt = 'einsatz' | 'besichtigung' | 'wartung' | 'intern' | 'schulung' | 'abnahme';

export interface Termin extends Basis {
  art: TerminArt;
  titel: string;
  start: Zeitpunkt;
  ende: Zeitpunkt;
  ganztags?: boolean;
  auftragId?: ID;
  kundeId?: ID;
  ortId?: ID;
  mitarbeiterIds: ID[];
  betriebsmittelIds?: ID[];
  status: 'geplant' | 'bestaetigt' | 'unterwegs' | 'vor_ort' | 'erledigt' | 'abgesagt';
  notiz?: string;
  /** Serie, z. B. bei wiederkehrenden Terminen */
  serieId?: ID;
  /** vom Kunden selbst gebucht */
  selbstGebucht?: boolean;
}

// ---------------------------------------------------------------- Leistungen, Material, Geld

export type Einheit = 'Stk' | 'm' | 'm²' | 'm³' | 'h' | 'Psch' | 'kg' | 'l' | 'Pkt' | 'km';

export interface Leistung extends Basis {
  name: string;
  beschreibung?: string;
  einheit: Einheit;
  /** Verkaufspreis netto je Einheit */
  preis: Cent;
  /** Arbeitszeit je Einheit in Minuten (Kalkulationsgrundlage) */
  minuten?: number;
  /** Material, das typischerweise dazugehört */
  material?: { artikelId: ID; menge: number }[];
  kategorie?: string;
  qualifikationIds?: ID[];
  aktiv: boolean;
}

export interface Lieferant extends Basis {
  name: string;
  kundennummer?: string;
  telefon?: string;
  email?: string;
  website?: string;
  adresse?: Adresse;
  lieferzeitTage?: number;
  /** Konditionen als Freitext, z. B. "3 % Skonto 10 Tage" */
  konditionen?: string;
  notiz?: string;
}

export interface Artikel extends Basis {
  nummer?: string;
  name: string;
  einheit: Einheit;
  /** Einkaufspreis netto */
  ek: Cent;
  /** Verkaufspreis netto */
  vk: Cent;
  lieferantId?: ID;
  herstellerNummer?: string;
  ean?: string;
  kategorie?: string;
  /** Bestand im Lager (Summe), nur bei Lagerartikeln gepflegt */
  bestand?: number;
  mindestbestand?: number;
  lagerort?: string;
  aktiv: boolean;
}

export interface Position {
  id: ID;
  art: 'leistung' | 'material' | 'lohn' | 'pauschal' | 'text' | 'zwischensumme';
  text: string;
  menge: number;
  einheit: Einheit;
  /** Einzelpreis netto */
  einzelpreis: Cent;
  leistungId?: ID;
  artikelId?: ID;
  /** Alternativ- oder Bedarfsposition (nicht in Summe) */
  optional?: boolean;
}

export interface Angebot extends Basis {
  nummer: string;
  auftragId: ID;
  kundeId: ID;
  titel: string;
  einleitung?: string;
  positionen: Position[];
  /** Rabatt in Prozent auf die Nettosumme */
  rabattProzent?: number;
  status: 'entwurf' | 'versendet' | 'angenommen' | 'abgelehnt' | 'abgelaufen';
  datum: Datum;
  gueltigBis: Datum;
  versendetAm?: Zeitpunkt;
  entschiedenAm?: Zeitpunkt;
  version: number;
}

export type RechnungsArt = 'rechnung' | 'abschlag' | 'teil' | 'schluss' | 'gutschrift';

export interface Rechnung extends Basis {
  nummer: string;
  art: RechnungsArt;
  auftragId?: ID;
  kundeId: ID;
  titel: string;
  positionen: Position[];
  /** bereits abgerechnete Abschläge, die bei Schlussrechnung abgezogen werden */
  abzugRechnungIds?: ID[];
  status: 'entwurf' | 'versendet' | 'teilbezahlt' | 'bezahlt' | 'storniert';
  datum: Datum;
  leistungszeitraum?: string;
  faelligAm: Datum;
  versendetAm?: Zeitpunkt;
  /** 0 = keine, 1 = Erinnerung, 2 = 1. Mahnung, 3 = 2. Mahnung */
  mahnstufe: number;
  letzteMahnungAm?: Datum;
  /** E-Rechnung (XRechnung/ZUGFeRD) erzeugt */
  eRechnung?: boolean;
}

export interface Zahlung extends Basis {
  rechnungId: ID;
  betrag: Cent;
  datum: Datum;
  art: 'ueberweisung' | 'bar' | 'karte' | 'paypal' | 'sonstiges';
  verwendungszweck?: string;
}

/** Eingangsrechnung, Quittung, Tankbeleg … */
export interface Beleg extends Basis {
  art: 'eingangsrechnung' | 'quittung' | 'tankbeleg' | 'sonstiges';
  lieferantId?: ID;
  lieferantName?: string;
  nummer?: string;
  datum: Datum;
  netto: Cent;
  ust: Cent;
  auftragId?: ID;
  kategorie?: string; // "Material", "Fahrzeug", "Werkzeug" …
  faelligAm?: Datum;
  status: 'neu' | 'geprueft' | 'bezahlt';
  dokumentId?: ID;
  /** an Steuerberater übergeben */
  exportiertAm?: Zeitpunkt;
}

// ---------------------------------------------------------------- Ausführung

export interface Zeiteintrag extends Basis {
  mitarbeiterId: ID;
  auftragId?: ID;
  terminId?: ID;
  datum: Datum;
  start: string; // "07:30"
  ende?: string; // leer = läuft
  pauseMinuten: number;
  art: 'arbeit' | 'fahrt' | 'werkstatt' | 'buero';
  notiz?: string;
  freigegeben?: boolean;
}

/** Material, das an einem Auftrag geplant oder verbraucht wurde */
export interface Materialbuchung extends Basis {
  auftragId: ID;
  artikelId?: ID;
  text: string;
  menge: number;
  einheit: Einheit;
  /** EK netto je Einheit zum Zeitpunkt der Buchung */
  ek: Cent;
  status: 'geplant' | 'bestellt' | 'bereit' | 'verbraucht';
  mitarbeiterId?: ID;
  datum?: Datum;
  /** bereits in einer Rechnung abgerechnet */
  abgerechnetIn?: ID;
}

export type DokumentArt = 'foto' | 'video' | 'sprache' | 'notiz' | 'datei' | 'plan' | 'bericht' | 'unterschrift' | 'pdf';

export interface Dokument extends Basis {
  art: DokumentArt;
  titel: string;
  /** Datei als Data-URL (lokal) oder URL (später Storage) */
  url?: string;
  mime?: string;
  groesse?: number;
  /** Text bei Notiz/Sprache (Transkript) */
  text?: string;
  auftragId?: ID;
  bezug?: Bezug;
  tags?: string[];
  /** für Kunden im Kundenbereich sichtbar */
  fuerKunde?: boolean;
}

export interface Nachricht extends Basis {
  kanal: 'intern' | 'email' | 'sms' | 'whatsapp' | 'telefon' | 'portal';
  richtung: 'ein' | 'aus' | 'intern';
  auftragId?: ID;
  kundeId?: ID;
  vonMitarbeiterId?: ID;
  text: string;
  gelesen: boolean;
  betreff?: string;
}

export type BetriebsmittelArt = 'werkzeug' | 'maschine' | 'fahrzeug';

export interface Betriebsmittel extends Basis {
  art: BetriebsmittelArt;
  name: string;
  inventarnummer?: string;
  kennzeichen?: string;
  hersteller?: string;
  seriennummer?: string;
  /** aktueller Standort / Fahrzeug / Lager */
  standort?: string;
  /** ausgegeben an */
  mitarbeiterId?: ID;
  status: 'verfuegbar' | 'im_einsatz' | 'defekt' | 'in_pruefung' | 'ausgemustert';
  naechstePruefung?: Datum;
  pruefungArt?: string; // "DGUV V3", "TÜV/HU", "UVV"
  anschaffungAm?: Datum;
  anschaffungspreis?: Cent;
  notiz?: string;
}

// ---------------------------------------------------------------- Macher (Assistenz & Automation)

/**
 * Hinweis: etwas, wofür ein Mensch gebraucht wird (Entscheidung, Freigabe, Problem).
 * Wird von Modulen oder Automationen erzeugt und in „Braucht dich“ gezeigt.
 */
export interface Hinweis extends Basis {
  art: 'entscheidung' | 'freigabe' | 'problem' | 'info';
  titel: string;
  text?: string;
  bezug?: Bezug;
  /** an wen (leer = Chef/Büro) */
  fuerMitarbeiterId?: ID;
  fuerRollen?: Rolle[];
  /** Pain-Score 1–100: Frequenz × Intensität; bestimmt Reihenfolge */
  gewicht: number;
  status: 'offen' | 'erledigt' | 'verworfen';
  /** Schlüssel zur Deduplizierung, z. B. "rechnung-ueberfaellig:<id>" */
  schluessel?: string;
  /** Aktionen, die per Registry (`registerAktion`) ausgeführt werden */
  aktionen?: { id: string; label: string; primaer?: boolean; payload?: unknown }[];
  erledigtAm?: Zeitpunkt;
  faellig?: Datum;
}

/** Protokoll dessen, was Macher automatisch erledigt hat */
export interface Erledigung extends Basis {
  titel: string;
  text?: string;
  bezug?: Bezug;
  /** Regel/Automation, die es ausgelöst hat */
  regel: string;
  /** eingesparte Minuten (Schätzung je Regel, als Schätzung gekennzeichnet) */
  minutenGespart?: number;
  rueckgaengig?: { aktion: string; payload?: unknown };
}

export interface Benachrichtigung extends Basis {
  titel: string;
  text?: string;
  bezug?: Bezug;
  fuerMitarbeiterId?: ID;
  gelesen: boolean;
  wichtig?: boolean;
}

/** Zeitstrahl/Audit: jede Änderung an einem Objekt */
export interface Ereignis extends Basis {
  typ: string; // "auftrag.created", "rechnung.overdue" …
  bezug: Bezug;
  text: string;
  vonMitarbeiterId?: ID;
  daten?: unknown;
}

// ---------------------------------------------------------------- Typ-Registry

export interface ObjektMap {
  betrieb: Betrieb;
  mitarbeiter: Mitarbeiter;
  qualifikationen: Qualifikation;
  nachweise: Nachweis;
  abwesenheiten: Abwesenheit;
  kunden: Kunde;
  orte: Ort;
  anlagen: Anlage;
  auftraege: Auftrag;
  aufgaben: Aufgabe;
  termine: Termin;
  leistungen: Leistung;
  lieferanten: Lieferant;
  artikel: Artikel;
  angebote: Angebot;
  rechnungen: Rechnung;
  zahlungen: Zahlung;
  belege: Beleg;
  zeiten: Zeiteintrag;
  material: Materialbuchung;
  dokumente: Dokument;
  nachrichten: Nachricht;
  betriebsmittel: Betriebsmittel;
  hinweise: Hinweis;
  erledigungen: Erledigung;
  benachrichtigungen: Benachrichtigung;
  ereignisse: Ereignis;
}

export type ObjektTyp = keyof ObjektMap;

export const OBJEKT_LABEL: Record<ObjektTyp, string> = {
  betrieb: 'Betrieb',
  mitarbeiter: 'Mitarbeiter',
  qualifikationen: 'Qualifikation',
  nachweise: 'Nachweis',
  abwesenheiten: 'Abwesenheit',
  kunden: 'Kunde',
  orte: 'Ort',
  anlagen: 'Anlage',
  auftraege: 'Auftrag',
  aufgaben: 'Aufgabe',
  termine: 'Termin',
  leistungen: 'Leistung',
  lieferanten: 'Lieferant',
  artikel: 'Artikel',
  angebote: 'Angebot',
  rechnungen: 'Rechnung',
  zahlungen: 'Zahlung',
  belege: 'Beleg',
  zeiten: 'Zeiteintrag',
  material: 'Material',
  dokumente: 'Dokument',
  nachrichten: 'Nachricht',
  betriebsmittel: 'Betriebsmittel',
  hinweise: 'Hinweis',
  erledigungen: 'Erledigt',
  benachrichtigungen: 'Benachrichtigung',
  ereignisse: 'Ereignis',
};
