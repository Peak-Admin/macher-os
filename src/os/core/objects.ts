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
  /** Adresszusatz, z. B. „Hinterhaus, 2. OG“ */
  zusatz?: string;
  /** Land, wenn nicht Deutschland */
  land?: string;
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
  bic?: string;
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
  nummer: string; // Projektnummer "2610-001" (YYMM-XXX); ältere Aufträge "A-2026-0042"
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
  /** Mitarbeiter, die am Auftrag arbeiten (Projektteam) */
  mitarbeiterIds?: ID[];
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
  /** Kunde hat das Angebot zuerst im Kundenbereich geöffnet */
  geoeffnetAm?: Zeitpunkt;
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
  /** diese Rechnung ist die Stornorechnung zu … */
  stornoFuerId?: ID;
  /** diese Rechnung wurde storniert durch … */
  stornoDurchId?: ID;
  /** Steuerschuldnerschaft des Leistungsempfängers (§ 13b UStG) */
  reverseCharge?: boolean;
  angebotId?: ID;
  /** Materialbuchungen, die in dieser Rechnung stehen */
  materialIds?: ID[];
  /** Zeiteinträge, die in dieser Rechnung stehen */
  zeitIds?: ID[];
  /** Zusatzleistungen, die in dieser Rechnung stehen */
  zusatzleistungIds?: ID[];
  leistungVon?: Datum;
  leistungBis?: Datum;
  /** von Macher automatisch vorbereitet */
  vonMacher?: boolean;
  abschlagProzent?: number;
  /** freier Text unter den Positionen */
  bemerkung?: string;
  /** Sicherheitseinbehalt in Prozent vom Gesamtbetrag (z. B. 5 nach § 17 VOB/B) */
  einbehaltProzent?: number;
  /** beim Festschreiben eingefroren: wie viel auf jede abgezogene Abschlags-/Teilrechnung bezahlt war (Cent je ID) */
  abzugStand?: Record<ID, Cent>;
  /** eigenes Nummernkürzel nur für diese Rechnung (Standard aus den Nummernkreisen) */
  nummernkreis?: string;
}

export interface Zahlung extends Basis {
  rechnungId: ID;
  betrag: Cent;
  datum: Datum;
  art: 'ueberweisung' | 'bar' | 'karte' | 'paypal' | 'sonstiges';
  verwendungszweck?: string;
  /** abgezogenes Skonto (zählt als beglichen) */
  skonto?: Cent;
  /** von Hand erfasst oder aus dem Kontoauszug / Zahlungsabgleich */
  quelle?: 'manuell' | 'kontoauszug';
  /** Name des Zahlers laut Kontoauszug */
  zahler?: string;
  /** Kontoumsatz (Sammlung `bankumsaetze`), aus dem diese Zahlung zugeordnet wurde */
  umsatzId?: ID;
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
  /** Betriebsbereich (Lager, Büro, Fahrzeuge …), wenn der Beleg zu keinem Auftrag gehört – entweder Auftrag oder Bereich */
  bereich?: string;
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
  /** nur `kanal: 'telefon'`: Gesprächsdaten (z. B. vom Telefonassistenten) – siehe `modules/telefon` */
  anruf?: AnrufDetails;
}

/** Dringlichkeit eines Anrufs, wie der Telefonassistent sie einordnet */
export type AnrufDringlichkeit = 'normal' | 'dringend' | 'notfall';

/**
 * Ein Anruf ist eine `Nachricht` mit `kanal: 'telefon'` (eine Business-Realität). Was der Telefonassistent dazu weiß,
 * steht hier – Anrufer, Kunde und Auftrag stehen wie immer in der Nachricht selbst.
 */
export interface AnrufDetails {
  quelle: 'ki-assistent' | 'manuell';
  /** Gesprächs-ID beim Telefonanbieter – gegen doppelte Zustellung */
  anrufId?: string;
  anbieter?: string;
  /** Nummer des Anrufers (wie übermittelt) */
  nummer?: string;
  beginn: Zeitpunkt;
  dauerSekunden?: number;
  zusammenfassung?: string;
  /** abgefragte Felder: anliegen, name, adresse, dringlichkeit, rueckrufnummer, erreichbarkeit … */
  felder?: Record<string, string>;
  dringlichkeit: AnrufDringlichkeit;
  /** woran der Notfall erkannt wurde (Stichwort oder Einschätzung des Assistenten) */
  notfallGrund?: string;
  /** bei `status: 'neu'` der Vorschlag des Assistenten, danach das, was Macher daraus gemacht hat */
  ergebnis?: 'anfrage' | 'rueckruf' | 'notiz' | 'weitergeleitet';
  transkript?: { wer: 'anrufer' | 'assistent'; text: string }[];
  /** an wen der Notfall ging (Bereitschaft) */
  weitergeleitetAn?: ID;
  /** der Anbieter hat den Anrufer schon im Gespräch zur Bereitschaft durchgestellt */
  durchgestellt?: boolean;
  /** neu = vom Anbieter abgelegt, noch nicht in Anfrage/Rückruf übersetzt */
  status: 'neu' | 'verarbeitet' | 'fehler';
  fehler?: string;
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

/**
 * Relevanzstufe einer Meldung (Attention Level):
 * `jetzt` = sofort (now) · `aktion` = Aktion nötig (action_required) · `info` = zur Kenntnis · `aktivitaet` = Systemaktivität.
 */
export type Aufmerksamkeit = 'jetzt' | 'aktion' | 'info' | 'aktivitaet';

/** Direkte Aktion an einer Meldung – `id` ist eine in `aktionen` eines Moduls registrierte Aktion */
export interface MeldungsAktion {
  id: string;
  label: string;
  primaer?: boolean;
  payload?: unknown;
}

/**
 * Persönliche Meldung (Attention Item) – zustandsbehaftet, kein Archiv. Regeln, Lebensdauer und Auflösung
 * stehen zentral in `core/aufmerksamkeit.ts`. Was passiert ist, steht im Zeitstrahl des Objekts, nicht hier.
 */
export interface Benachrichtigung extends Basis {
  titel: string;
  text?: string;
  /** worum es geht – nur die ID; der Zustand dieses Objekts entscheidet, ob die Meldung noch gilt */
  bezug?: Bezug;
  /** übergeordnetes Objekt zum Bündeln (z. B. der Auftrag einer Kundennachricht) */
  gruppe?: Bezug;
  /** Empfänger (jede Meldung gehört genau einem Menschen) */
  fuerMitarbeiterId?: ID;
  /** Ereignisart aus dem Regelwerk, z. B. `abwesenheit.beantragt` */
  art?: string;
  stufe?: Aufmerksamkeit;
  /** Warum du das siehst („Du bist für die Freigabe zuständig.“) */
  grund?: string;
  /** Pain-Score 1–100 (Dringlichkeit × Wirkung) – Reihenfolge innerhalb der Stufe */
  gewicht?: number;
  aktionen?: MeldungsAktion[];
  /** Deduplizierung: gleiche Art + Objekt + Empfänger = ein Eintrag */
  schluessel?: string;
  /** ID des auslösenden Ereignisses – gleiche Quelle wird nie zweimal gemeldet (Wiederholungen, Retries) */
  quelleId?: string;
  /** wie oft das Ereignis zusammengefasst wurde */
  anzahl?: number;
  /** danach nicht mehr in der Inbox (nur `info`/`aktivitaet` oder ausdrücklich gesetzt) */
  ablaufAm?: Zeitpunkt;
  /** bleibt, bis der Grund weg ist – verfällt nicht wegen des Alters */
  bisGeloest?: boolean;
  /** „Später“: bis dahin ausgeblendet, zählt nicht */
  spaeterBis?: Zeitpunkt;
  /** Grund erledigt (von wem auch immer) */
  geloestAm?: Zeitpunkt;
  /** vom Empfänger bewusst geschlossen („Erledigt“) */
  geschlossenAm?: Zeitpunkt;
  /** @deprecated altes Gelesen-Modell – nur noch für Bestandsdaten gelesen */
  gelesen?: boolean;
  /** @deprecated wird zu `stufe: 'aktion'` */
  wichtig?: boolean;
  /** @deprecated altes Archiv – gilt als geschlossen */
  archiviert?: boolean;
}

/** Wer eine Änderung ausgelöst hat: Mensch, Automation, Macher (KI), Import, Abgleich */
export type AuditQuelle = 'user' | 'automation' | 'ai' | 'import' | 'sync';

/** Ein geändertes Feld im Verlauf (nur geänderte Felder werden gespeichert) */
export interface FeldAenderung {
  vorher?: unknown;
  nachher?: unknown;
  /** Wert zu groß zum Speichern (z. B. Foto) – dann ist „Rückgängig“ nicht möglich */
  gekuerzt?: boolean;
  /** geschützter Wert (Geld, Lohn) – steht nicht im für alle lesbaren Verlauf */
  geschuetzt?: boolean;
}

/** Zeitstrahl/Audit: jede Änderung an einem Objekt */
export interface Ereignis extends Basis {
  typ: string; // "auftrag.created", "rechnung.overdue" …
  bezug: Bezug;
  text: string;
  vonMitarbeiterId?: ID;
  daten?: unknown;
  /** Audit: woher die Änderung kam (fehlt bei alten Einträgen = Mensch) */
  quelle?: AuditQuelle;
  /** Audit: Automation-ID, „macher“, Import-Name … */
  akteurId?: string;
  /** Audit: automatisch protokollierte Datenänderung */
  aenderung?: 'created' | 'updated' | 'removed' | 'restored';
  /** Audit: geänderte Felder mit vorher/nachher */
  felder?: Record<string, FeldAenderung>;
  /** mehrere stille Bearbeitungen (Tippen im Editor) in einem Eintrag zusammengefasst */
  zusammengefasst?: boolean;
  /** über „Rückgängig“ zurückgenommen */
  rueckgaengigAm?: Zeitpunkt;
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
