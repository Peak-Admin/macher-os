/**
 * Gewerk-Vorlagen (Template Engine): typische Leistungen, Material, Qualifikationen, Anlagentypen,
 * Begriffe, Auftragsarten, Abläufe (Pipelines), Checklisten, Aufmaß-/Formularfelder, Dokumente, Schulungen,
 * Automationen, Planungsregeln und Heute-Inhalte je Gewerk. So startet niemand mit einer leeren Software.
 *
 * Reine Daten – angewendet werden sie im Onboarding (`onboarding/daten.ts`), von der Ablauf-Engine
 * (`modules/ablauf`) und später von der Felder-Engine (`modules/felder`, Feldvorlagen `felderFuer`).
 *
 * Rückwärtskompatibel: `GEWERKE` enthält wie bisher genau die Gewerke aus `objects.ts`. Feinere Vorlagen
 * (Solar, Fensterbau, Gebäudereinigung) stehen in `FACHRICHTUNGEN` und hängen an einem Basis-Gewerk.
 */
import type { Arbeitsweise, Auftragsart, Einheit, Gewerk, Phase } from './objects';

export interface LeistungVorlage {
  name: string;
  einheit: Einheit;
  /** Netto in Euro (wird in Cent umgerechnet) */
  preis: number;
  minuten?: number;
  kategorie: string;
}

export interface ArtikelVorlage {
  name: string;
  einheit: Einheit;
  ek: number;
  vk: number;
  kategorie: string;
  mindestbestand?: number;
}

/** Grunddaten einer Vorlage (bestehendes Format) */
export interface GewerkGrund {
  label: string;
  /** Wer wird typischerweise im Betrieb sein? */
  standardArbeitsweisen: Arbeitsweise[];
  leistungen: LeistungVorlage[];
  artikel: ArtikelVorlage[];
  qualifikationen: { name: string; kategorie: 'fachlich' | 'pflicht' | 'fuehrerschein' | 'zertifikat'; gueltigMonate?: number }[];
  anlagentypen: string[];
  /** typische Prüfungen für Werkzeug/Fahrzeug */
  pruefungen: string[];
  stundensatz: number;
}

export interface GewerkVorlage extends GewerkGrund, GewerkEngine {
  id: Gewerk;
  /** Basis-Gewerk (bei Gewerken = id) */
  gewerk: Gewerk;
}

const gemeinsamQuali = [
  { name: 'Erste Hilfe', kategorie: 'pflicht' as const, gueltigMonate: 24 },
  { name: 'Arbeitsschutz-Unterweisung', kategorie: 'pflicht' as const, gueltigMonate: 12 },
  { name: 'Führerschein B', kategorie: 'fuehrerschein' as const },
  { name: 'Arbeiten auf Leitern und Gerüsten', kategorie: 'pflicht' as const, gueltigMonate: 12 },
];

const GRUND: (GewerkGrund & { id: Gewerk })[] = [
  {
    id: 'elektro',
    label: 'Elektro',
    standardArbeitsweisen: ['kundendienst', 'baustelle', 'wartung'],
    stundensatz: 68,
    leistungen: [
      { name: 'Arbeitsstunde Geselle', einheit: 'h', preis: 68, minuten: 60, kategorie: 'Lohn' },
      { name: 'Arbeitsstunde Meister', einheit: 'h', preis: 82, minuten: 60, kategorie: 'Lohn' },
      { name: 'Anfahrtspauschale', einheit: 'Psch', preis: 39, kategorie: 'Fahrt' },
      { name: 'Steckdose setzen inkl. Dose', einheit: 'Stk', preis: 69, minuten: 35, kategorie: 'Installation' },
      { name: 'Lichtschalter tauschen', einheit: 'Stk', preis: 45, minuten: 20, kategorie: 'Installation' },
      { name: 'Leitung verlegen NYM 3x1,5 auf Putz', einheit: 'm', preis: 14.5, minuten: 6, kategorie: 'Installation' },
      { name: 'Zählerschrank erneuern', einheit: 'Psch', preis: 2450, minuten: 600, kategorie: 'Verteilung' },
      { name: 'FI-Schutzschalter nachrüsten', einheit: 'Stk', preis: 210, minuten: 60, kategorie: 'Verteilung' },
      { name: 'Wallbox 11 kW installieren', einheit: 'Psch', preis: 1290, minuten: 360, kategorie: 'E-Mobilität' },
      { name: 'E-Check / DGUV V3 Prüfung je Gerät', einheit: 'Stk', preis: 6.5, minuten: 4, kategorie: 'Prüfung' },
      { name: 'Störungssuche', einheit: 'h', preis: 74, minuten: 60, kategorie: 'Kundendienst' },
      { name: 'PV-Anlage Wartung', einheit: 'Psch', preis: 249, minuten: 120, kategorie: 'Wartung' },
    ],
    artikel: [
      { name: 'NYM-J 3x1,5 mm²', einheit: 'm', ek: 0.62, vk: 1.1, kategorie: 'Leitung', mindestbestand: 200 },
      { name: 'NYM-J 5x2,5 mm²', einheit: 'm', ek: 1.85, vk: 3.2, kategorie: 'Leitung', mindestbestand: 100 },
      { name: 'Schuko-Steckdose reinweiß', einheit: 'Stk', ek: 3.9, vk: 8.5, kategorie: 'Schalter & Dosen', mindestbestand: 20 },
      { name: 'Unterputzdose tief', einheit: 'Stk', ek: 0.45, vk: 1.2, kategorie: 'Schalter & Dosen', mindestbestand: 50 },
      { name: 'Wechselschalter reinweiß', einheit: 'Stk', ek: 4.2, vk: 9.5, kategorie: 'Schalter & Dosen', mindestbestand: 10 },
      { name: 'LS-Schalter B16 1-polig', einheit: 'Stk', ek: 3.1, vk: 7.9, kategorie: 'Verteilung', mindestbestand: 15 },
      { name: 'FI/LS 30 mA B16', einheit: 'Stk', ek: 39, vk: 72, kategorie: 'Verteilung', mindestbestand: 4 },
      { name: 'Wallbox 11 kW', einheit: 'Stk', ek: 520, vk: 749, kategorie: 'E-Mobilität' },
      { name: 'Wago-Klemme 3-fach', einheit: 'Stk', ek: 0.28, vk: 0.6, kategorie: 'Kleinmaterial', mindestbestand: 200 },
    ],
    qualifikationen: [
      { name: 'Elektrofachkraft', kategorie: 'fachlich' },
      { name: 'Elektrofachkraft für festgelegte Tätigkeiten', kategorie: 'fachlich' },
      { name: 'Befähigte Person DGUV V3', kategorie: 'zertifikat', gueltigMonate: 36 },
      { name: 'Eintragung Netzbetreiber (Installateurverzeichnis)', kategorie: 'zertifikat', gueltigMonate: 60 },
      { name: 'Wallbox-Herstellerschulung', kategorie: 'zertifikat', gueltigMonate: 24 },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['Zählerschrank', 'Unterverteilung', 'Wallbox', 'PV-Anlage', 'Batteriespeicher', 'Sprechanlage', 'Rauchmelder'],
    pruefungen: ['DGUV V3', 'TÜV/HU', 'UVV Fahrzeug', 'Leiterprüfung'],
  },
  {
    id: 'shk',
    label: 'Sanitär, Heizung, Klima',
    standardArbeitsweisen: ['kundendienst', 'baustelle', 'wartung'],
    stundensatz: 72,
    leistungen: [
      { name: 'Arbeitsstunde Geselle', einheit: 'h', preis: 72, minuten: 60, kategorie: 'Lohn' },
      { name: 'Arbeitsstunde Meister', einheit: 'h', preis: 86, minuten: 60, kategorie: 'Lohn' },
      { name: 'Anfahrtspauschale', einheit: 'Psch', preis: 45, kategorie: 'Fahrt' },
      { name: 'Heizungswartung Gas-Brennwert', einheit: 'Psch', preis: 189, minuten: 90, kategorie: 'Wartung' },
      { name: 'Heizungswartung Öl', einheit: 'Psch', preis: 229, minuten: 120, kategorie: 'Wartung' },
      { name: 'Wärmepumpe Wartung', einheit: 'Psch', preis: 269, minuten: 120, kategorie: 'Wartung' },
      { name: 'Hydraulischer Abgleich', einheit: 'Psch', preis: 890, minuten: 360, kategorie: 'Heizung' },
      { name: 'WC tauschen inkl. Montage', einheit: 'Stk', preis: 390, minuten: 180, kategorie: 'Sanitär' },
      { name: 'Waschtischarmatur tauschen', einheit: 'Stk', preis: 129, minuten: 60, kategorie: 'Sanitär' },
      { name: 'Rohrreinigung', einheit: 'Psch', preis: 149, minuten: 60, kategorie: 'Kundendienst' },
      { name: 'Notdienstzuschlag', einheit: 'Psch', preis: 95, kategorie: 'Zuschlag' },
      { name: 'Badsanierung Komplett (Richtpreis je m²)', einheit: 'm²', preis: 1450, minuten: 600, kategorie: 'Bad' },
    ],
    artikel: [
      { name: 'Kupferrohr 15 mm', einheit: 'm', ek: 7.8, vk: 13.5, kategorie: 'Rohr', mindestbestand: 25 },
      { name: 'Pressfitting Bogen 15 mm', einheit: 'Stk', ek: 3.2, vk: 6.9, kategorie: 'Fittings', mindestbestand: 30 },
      { name: 'Eckventil ½"', einheit: 'Stk', ek: 6.5, vk: 14.9, kategorie: 'Armaturen', mindestbestand: 10 },
      { name: 'Waschtischarmatur Standard', einheit: 'Stk', ek: 58, vk: 109, kategorie: 'Armaturen' },
      { name: 'Wand-WC spülrandlos', einheit: 'Stk', ek: 145, vk: 259, kategorie: 'Keramik' },
      { name: 'Dichtungsset Brenner', einheit: 'Stk', ek: 18, vk: 34, kategorie: 'Wartung', mindestbestand: 6 },
      { name: 'Heizungswasser-Inhibitor 1 l', einheit: 'l', ek: 21, vk: 39, kategorie: 'Wartung', mindestbestand: 4 },
      { name: 'Silikon sanitär weiß', einheit: 'Stk', ek: 4.5, vk: 9.9, kategorie: 'Kleinmaterial', mindestbestand: 12 },
    ],
    qualifikationen: [
      { name: 'Anlagenmechaniker SHK', kategorie: 'fachlich' },
      { name: 'Kältescheinkategorie I (F-Gase)', kategorie: 'zertifikat' },
      { name: 'Gas-Konzession / TRGI', kategorie: 'zertifikat', gueltigMonate: 60 },
      { name: 'Trinkwasserhygiene VDI 6023', kategorie: 'zertifikat', gueltigMonate: 60 },
      { name: 'Wärmepumpen-Herstellerschulung', kategorie: 'zertifikat', gueltigMonate: 24 },
      { name: 'Schweißschein', kategorie: 'zertifikat', gueltigMonate: 24 },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['Gasheizung', 'Ölheizung', 'Wärmepumpe', 'Klimaanlage', 'Warmwasserspeicher', 'Enthärtungsanlage', 'Solarthermie'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'DGUV V3', 'Leiterprüfung', 'Kältemittel-Dichtheit'],
  },
  {
    id: 'maler',
    label: 'Maler & Lackierer',
    standardArbeitsweisen: ['baustelle'],
    stundensatz: 58,
    leistungen: [
      { name: 'Arbeitsstunde Geselle', einheit: 'h', preis: 58, minuten: 60, kategorie: 'Lohn' },
      { name: 'Wandflächen streichen, 2 Anstriche', einheit: 'm²', preis: 9.8, minuten: 9, kategorie: 'Anstrich' },
      { name: 'Decke streichen, 2 Anstriche', einheit: 'm²', preis: 11.5, minuten: 11, kategorie: 'Anstrich' },
      { name: 'Raufaser tapezieren', einheit: 'm²', preis: 12.9, minuten: 12, kategorie: 'Tapete' },
      { name: 'Vliestapete tapezieren', einheit: 'm²', preis: 16.5, minuten: 15, kategorie: 'Tapete' },
      { name: 'Abkleben und Abdecken', einheit: 'm²', preis: 2.4, minuten: 2, kategorie: 'Vorarbeit' },
      { name: 'Spachteln Q3', einheit: 'm²', preis: 14, minuten: 14, kategorie: 'Vorarbeit' },
      { name: 'Fassade streichen', einheit: 'm²', preis: 24, minuten: 18, kategorie: 'Fassade' },
      { name: 'Tür lackieren inkl. Zarge', einheit: 'Stk', preis: 165, minuten: 150, kategorie: 'Lack' },
      { name: 'Baustelleneinrichtung', einheit: 'Psch', preis: 120, kategorie: 'Baustelle' },
    ],
    artikel: [
      { name: 'Innenfarbe weiß 12,5 l', einheit: 'Stk', ek: 48, vk: 79, kategorie: 'Farbe', mindestbestand: 6 },
      { name: 'Tiefgrund 10 l', einheit: 'Stk', ek: 26, vk: 45, kategorie: 'Grundierung', mindestbestand: 3 },
      { name: 'Raufaser Rolle', einheit: 'Stk', ek: 4.9, vk: 9.5, kategorie: 'Tapete', mindestbestand: 20 },
      { name: 'Malerkrepp 38 mm', einheit: 'Stk', ek: 2.1, vk: 4.2, kategorie: 'Verbrauch', mindestbestand: 24 },
      { name: 'Abdeckvlies 25 m²', einheit: 'Stk', ek: 19, vk: 34, kategorie: 'Verbrauch', mindestbestand: 5 },
      { name: 'Fassadenfarbe 12,5 l', einheit: 'Stk', ek: 89, vk: 139, kategorie: 'Farbe' },
    ],
    qualifikationen: [
      { name: 'Maler- und Lackierergeselle', kategorie: 'fachlich' },
      { name: 'Gerüstbau-Befähigung', kategorie: 'zertifikat', gueltigMonate: 36 },
      { name: 'Sachkunde Schimmelsanierung', kategorie: 'zertifikat' },
      { name: 'Hubarbeitsbühne', kategorie: 'zertifikat', gueltigMonate: 12 },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['Fassade', 'Treppenhaus', 'Fenster', 'Holzverkleidung'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'Leiterprüfung', 'Gerüstprüfung'],
  },
  {
    id: 'dach',
    label: 'Dachdecker',
    standardArbeitsweisen: ['baustelle', 'kundendienst'],
    stundensatz: 64,
    leistungen: [
      { name: 'Arbeitsstunde Geselle', einheit: 'h', preis: 64, minuten: 60, kategorie: 'Lohn' },
      { name: 'Dachziegel neu eindecken', einheit: 'm²', preis: 68, minuten: 45, kategorie: 'Eindeckung' },
      { name: 'Dachrinne erneuern', einheit: 'm', preis: 54, minuten: 30, kategorie: 'Klempner' },
      { name: 'Dachfenster einbauen', einheit: 'Stk', preis: 1350, minuten: 480, kategorie: 'Fenster' },
      { name: 'Sturmschaden sichern', einheit: 'Psch', preis: 290, minuten: 120, kategorie: 'Reparatur' },
      { name: 'Dachinspektion mit Bericht', einheit: 'Psch', preis: 189, minuten: 90, kategorie: 'Wartung' },
      { name: 'Gerüst stellen', einheit: 'm²', preis: 11, kategorie: 'Gerüst' },
      { name: 'Flachdach abdichten (Bitumen)', einheit: 'm²', preis: 72, minuten: 40, kategorie: 'Flachdach' },
      { name: 'Dachrinne reinigen', einheit: 'm', preis: 6.5, minuten: 4, kategorie: 'Wartung' },
      { name: 'Schornsteinanschluss erneuern', einheit: 'Psch', preis: 640, minuten: 300, kategorie: 'Klempner' },
    ],
    artikel: [
      { name: 'Dachziegel Standard', einheit: 'Stk', ek: 1.1, vk: 1.9, kategorie: 'Eindeckung' },
      { name: 'Unterspannbahn 75 m²', einheit: 'Stk', ek: 95, vk: 149, kategorie: 'Folie' },
      { name: 'Dachrinne Zink 333', einheit: 'm', ek: 14, vk: 24, kategorie: 'Klempner' },
      { name: 'Dachlatte 30x50', einheit: 'm', ek: 0.9, vk: 1.6, kategorie: 'Holz', mindestbestand: 200 },
    ],
    qualifikationen: [
      { name: 'Dachdeckergeselle', kategorie: 'fachlich' },
      { name: 'Absturzsicherung PSAgA', kategorie: 'pflicht', gueltigMonate: 12 },
      { name: 'Asbest-Sachkunde TRGS 519', kategorie: 'zertifikat', gueltigMonate: 72 },
      { name: 'Kranführerschein', kategorie: 'zertifikat', gueltigMonate: 12 },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['Steildach', 'Flachdach', 'Dachfenster', 'Dachrinne', 'Blitzschutz'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'PSAgA-Prüfung', 'Leiterprüfung'],
  },
  {
    id: 'tischler',
    label: 'Tischler & Schreiner',
    standardArbeitsweisen: ['werkstatt', 'baustelle'],
    stundensatz: 62,
    leistungen: [
      { name: 'Arbeitsstunde Werkstatt', einheit: 'h', preis: 62, minuten: 60, kategorie: 'Lohn' },
      { name: 'Arbeitsstunde Montage', einheit: 'h', preis: 66, minuten: 60, kategorie: 'Lohn' },
      { name: 'Innentür liefern und einbauen', einheit: 'Stk', preis: 690, minuten: 180, kategorie: 'Türen' },
      { name: 'Einbauschrank nach Maß (je lfm)', einheit: 'm', preis: 1450, minuten: 600, kategorie: 'Möbel' },
      { name: 'Fenster einstellen', einheit: 'Stk', preis: 59, minuten: 30, kategorie: 'Service' },
      { name: 'Treppe renovieren je Stufe', einheit: 'Stk', preis: 185, minuten: 120, kategorie: 'Treppen' },
      { name: 'Haustür liefern und einbauen', einheit: 'Stk', preis: 2900, minuten: 360, kategorie: 'Türen' },
      { name: 'Fensterdichtung erneuern', einheit: 'm', preis: 14, minuten: 8, kategorie: 'Service' },
      { name: 'Küchenmontage', einheit: 'h', preis: 66, minuten: 60, kategorie: 'Montage' },
      { name: 'Insektenschutz nach Maß', einheit: 'Stk', preis: 145, minuten: 40, kategorie: 'Service' },
    ],
    artikel: [
      { name: 'MDF-Platte 19 mm', einheit: 'm²', ek: 12, vk: 22, kategorie: 'Platten' },
      { name: 'Eiche massiv Leimholz 26 mm', einheit: 'm²', ek: 78, vk: 125, kategorie: 'Holz' },
      { name: 'Topfscharnier', einheit: 'Stk', ek: 3.2, vk: 6.5, kategorie: 'Beschläge', mindestbestand: 40 },
      { name: 'Montageschaum', einheit: 'Stk', ek: 6.9, vk: 12.9, kategorie: 'Montage', mindestbestand: 6 },
    ],
    qualifikationen: [
      { name: 'Tischlergeselle', kategorie: 'fachlich' },
      { name: 'CNC-Bedienung', kategorie: 'fachlich' },
      { name: 'Staplerschein', kategorie: 'zertifikat', gueltigMonate: 12 },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['Fenster', 'Haustür', 'Treppe', 'Einbaumöbel'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'DGUV V3', 'Absauganlage'],
  },
  {
    id: 'fliesen',
    label: 'Fliesen & Platten',
    standardArbeitsweisen: ['baustelle'],
    stundensatz: 60,
    leistungen: [
      { name: 'Arbeitsstunde Geselle', einheit: 'h', preis: 60, minuten: 60, kategorie: 'Lohn' },
      { name: 'Bodenfliesen verlegen', einheit: 'm²', preis: 58, minuten: 50, kategorie: 'Verlegung' },
      { name: 'Wandfliesen verlegen', einheit: 'm²', preis: 64, minuten: 55, kategorie: 'Verlegung' },
      { name: 'Abdichtung Nassbereich', einheit: 'm²', preis: 32, minuten: 20, kategorie: 'Abdichtung' },
      { name: 'Altbelag entfernen', einheit: 'm²', preis: 22, minuten: 20, kategorie: 'Rückbau' },
      { name: 'Silikonfuge erneuern', einheit: 'm', preis: 9.5, minuten: 6, kategorie: 'Service' },
      { name: 'Sockelleiste Fliese', einheit: 'm', preis: 16, minuten: 12, kategorie: 'Verlegung' },
      { name: 'Großformat verlegen (ab 60 × 60)', einheit: 'm²', preis: 78, minuten: 65, kategorie: 'Verlegung' },
      { name: 'Fliese tauschen (Einzelschaden)', einheit: 'Stk', preis: 89, minuten: 60, kategorie: 'Service' },
      { name: 'Terrassenplatten verlegen', einheit: 'm²', preis: 69, minuten: 55, kategorie: 'Außen' },
    ],
    artikel: [
      { name: 'Flexkleber 25 kg', einheit: 'Stk', ek: 14, vk: 26, kategorie: 'Kleber', mindestbestand: 10 },
      { name: 'Fugenmörtel grau 5 kg', einheit: 'Stk', ek: 9, vk: 17, kategorie: 'Fuge', mindestbestand: 6 },
      { name: 'Dichtschlämme 2K', einheit: 'Stk', ek: 38, vk: 65, kategorie: 'Abdichtung' },
      { name: 'Fliesenkreuze 3 mm', einheit: 'Stk', ek: 2.5, vk: 4.9, kategorie: 'Kleinmaterial', mindestbestand: 10 },
    ],
    qualifikationen: [{ name: 'Fliesenlegergeselle', kategorie: 'fachlich' }, ...gemeinsamQuali],
    anlagentypen: ['Bad', 'Küche', 'Terrasse', 'Treppenhaus'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'DGUV V3'],
  },
  {
    id: 'garten',
    label: 'Garten- & Landschaftsbau',
    standardArbeitsweisen: ['baustelle', 'wartung'],
    stundensatz: 55,
    leistungen: [
      { name: 'Arbeitsstunde Geselle', einheit: 'h', preis: 55, minuten: 60, kategorie: 'Lohn' },
      { name: 'Rasen mähen inkl. Entsorgung', einheit: 'm²', preis: 0.45, minuten: 1, kategorie: 'Pflege' },
      { name: 'Hecke schneiden', einheit: 'm', preis: 6.5, minuten: 5, kategorie: 'Pflege' },
      { name: 'Pflasterfläche herstellen', einheit: 'm²', preis: 95, minuten: 70, kategorie: 'Bau' },
      { name: 'Baumfällung (klein)', einheit: 'Stk', preis: 390, minuten: 180, kategorie: 'Baum' },
      { name: 'Grünschnitt entsorgen', einheit: 'm³', preis: 48, kategorie: 'Entsorgung' },
      { name: 'Rollrasen verlegen', einheit: 'm²', preis: 14, minuten: 8, kategorie: 'Bau' },
      { name: 'Zaun setzen', einheit: 'm', preis: 85, minuten: 45, kategorie: 'Bau' },
      { name: 'Laub entfernen', einheit: 'h', preis: 55, minuten: 60, kategorie: 'Pflege' },
      { name: 'Bewässerung einwintern', einheit: 'Psch', preis: 120, minuten: 75, kategorie: 'Wartung' },
    ],
    artikel: [
      { name: 'Betonpflaster grau', einheit: 'm²', ek: 14, vk: 24, kategorie: 'Pflaster' },
      { name: 'Splitt 2/5', einheit: 'm³', ek: 38, vk: 62, kategorie: 'Schüttgut' },
      { name: 'Rasensaat 10 kg', einheit: 'Stk', ek: 49, vk: 85, kategorie: 'Pflanzen' },
    ],
    qualifikationen: [
      { name: 'Landschaftsgärtner', kategorie: 'fachlich' },
      { name: 'Motorsägenschein', kategorie: 'zertifikat' },
      { name: 'Sachkunde Pflanzenschutz', kategorie: 'zertifikat', gueltigMonate: 36 },
      { name: 'Führerschein C1E', kategorie: 'fuehrerschein' },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['Garten', 'Bewässerungsanlage', 'Teich', 'Pflasterfläche'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'UVV Maschinen'],
  },
  {
    id: 'metall',
    label: 'Metallbau',
    standardArbeitsweisen: ['werkstatt', 'baustelle'],
    stundensatz: 66,
    leistungen: [
      { name: 'Arbeitsstunde Werkstatt', einheit: 'h', preis: 66, minuten: 60, kategorie: 'Lohn' },
      { name: 'Geländer Stahl verzinkt', einheit: 'm', preis: 290, minuten: 180, kategorie: 'Geländer' },
      { name: 'Schweißarbeiten', einheit: 'h', preis: 74, minuten: 60, kategorie: 'Werkstatt' },
      { name: 'Tor-Wartung', einheit: 'Psch', preis: 159, minuten: 90, kategorie: 'Wartung' },
      { name: 'Arbeitsstunde Montage', einheit: 'h', preis: 70, minuten: 60, kategorie: 'Lohn' },
      { name: 'Treppe Stahl (je Stufe)', einheit: 'Stk', preis: 420, minuten: 240, kategorie: 'Treppen' },
      { name: 'Vordach Stahl/Glas', einheit: 'Stk', preis: 2400, minuten: 600, kategorie: 'Vordach' },
      { name: 'Reparatur Tor/Zaun', einheit: 'h', preis: 70, minuten: 60, kategorie: 'Service' },
      { name: 'Anfahrtspauschale', einheit: 'Psch', preis: 45, kategorie: 'Fahrt' },
    ],
    artikel: [
      { name: 'Flachstahl 40x8', einheit: 'm', ek: 4.2, vk: 7.5, kategorie: 'Stahl' },
      { name: 'Schweißdraht 15 kg', einheit: 'Stk', ek: 39, vk: 0, kategorie: 'Verbrauch', mindestbestand: 2 },
    ],
    qualifikationen: [
      { name: 'Metallbauer', kategorie: 'fachlich' },
      { name: 'Schweißerprüfung EN ISO 9606', kategorie: 'zertifikat', gueltigMonate: 24 },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['Tor', 'Geländer', 'Vordach', 'Treppe'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'DGUV V3', 'Kranprüfung'],
  },
  {
    id: 'bau',
    label: 'Bau & Ausbau',
    standardArbeitsweisen: ['baustelle'],
    stundensatz: 58,
    leistungen: [
      { name: 'Arbeitsstunde Facharbeiter', einheit: 'h', preis: 58, minuten: 60, kategorie: 'Lohn' },
      { name: 'Trockenbauwand einfach beplankt', einheit: 'm²', preis: 48, minuten: 40, kategorie: 'Trockenbau' },
      { name: 'Estrich verlegen', einheit: 'm²', preis: 29, minuten: 15, kategorie: 'Estrich' },
      { name: 'Mauerwerk 17,5 cm', einheit: 'm²', preis: 78, minuten: 60, kategorie: 'Rohbau' },
      { name: 'Container stellen', einheit: 'Psch', preis: 380, kategorie: 'Baustelle' },
      { name: 'Wand verputzen', einheit: 'm²', preis: 34, minuten: 25, kategorie: 'Putz' },
      { name: 'Durchbruch herstellen', einheit: 'Stk', preis: 450, minuten: 240, kategorie: 'Rohbau' },
      { name: 'Abbruch und Entsorgung', einheit: 'm³', preis: 95, minuten: 60, kategorie: 'Rückbau' },
      { name: 'Trockenbaudecke abgehängt', einheit: 'm²', preis: 56, minuten: 45, kategorie: 'Trockenbau' },
    ],
    artikel: [
      { name: 'Gipskartonplatte 12,5 mm', einheit: 'Stk', ek: 4.9, vk: 8.9, kategorie: 'Trockenbau', mindestbestand: 30 },
      { name: 'CW-Profil 50', einheit: 'm', ek: 1.4, vk: 2.6, kategorie: 'Trockenbau', mindestbestand: 60 },
      { name: 'Zementestrich 40 kg', einheit: 'Stk', ek: 4.5, vk: 8.5, kategorie: 'Estrich' },
    ],
    qualifikationen: [
      { name: 'Facharbeiter Bau', kategorie: 'fachlich' },
      { name: 'Baggerführerschein', kategorie: 'zertifikat' },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['Gebäude', 'Raum', 'Bauteil'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'UVV Maschinen', 'DGUV V3'],
  },
  {
    id: 'sonstiges',
    label: 'Anderes Gewerk',
    standardArbeitsweisen: ['kundendienst', 'baustelle'],
    stundensatz: 60,
    leistungen: [
      { name: 'Arbeitsstunde', einheit: 'h', preis: 60, minuten: 60, kategorie: 'Lohn' },
      { name: 'Anfahrtspauschale', einheit: 'Psch', preis: 39, kategorie: 'Fahrt' },
      { name: 'Material nach Aufwand', einheit: 'Psch', preis: 0, kategorie: 'Material' },
      { name: 'Arbeitsstunde Meister', einheit: 'h', preis: 75, minuten: 60, kategorie: 'Lohn' },
      { name: 'Kleinreparatur', einheit: 'Psch', preis: 89, minuten: 60, kategorie: 'Service' },
      { name: 'Beratung vor Ort', einheit: 'h', preis: 60, minuten: 60, kategorie: 'Beratung' },
      { name: 'Entsorgung', einheit: 'Psch', preis: 45, kategorie: 'Entsorgung' },
    ],
    artikel: [],
    qualifikationen: gemeinsamQuali,
    anlagentypen: ['Anlage', 'Gerät'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'DGUV V3'],
  },
];

// ================================================================== Template Engine

/** Feinere Vorlagen, die (noch) kein eigenes Gewerk in `objects.ts` haben */
export type FachrichtungId = 'solar' | 'fensterbau' | 'reinigung';
export type VorlageId = Gewerk | FachrichtungId;

/** Wie der Betrieb Dinge nennt („Baustelle“ oder „Objekt“) */
export interface Begriffe {
  /** Ort der Arbeit: Baustelle, Objekt, Einsatzort, Garten … */
  einsatzort: string;
  einsatzorte: string;
  /** Auftrag oder Projekt */
  auftrag: string;
  /** was beim Kunden betreut wird: Anlage, Objekt, Dach … */
  anlage: string;
  /** ein Termin beim Kunden: Einsatz, Montage, Reinigung … */
  einsatz: string;
}

export interface AuftragsartVorlage {
  art: Auftragsart;
  label: string;
  text?: string;
}

/** Wer kümmert sich um einen Schritt? */
export type SchrittZustaendig = 'verantwortlich' | 'buero' | 'chef' | 'eingeplant';

/** Bedingungen, bei denen ein Schritt von selbst erreicht ist (automatischer Statuswechsel) */
export type SchrittBedingung = 'besichtigung_geplant' | 'angebot_versendet' | 'material_bestellt' | 'material_bereit' | 'termin_geplant' | 'rechnung_versendet';

export interface SchrittVorlage {
  /** stabil innerhalb eines Ablaufs (Regeln nutzen z. B. `vorbereitung`, `rechnung`, `bezahlt`) */
  id: string;
  label: string;
  /** Jeder Schritt gehört zu genau einer Phase – so funktioniert alles, was auf Phasen schaut, weiter */
  phase: Phase;
  zustaendig?: SchrittZustaendig;
  /** Frist ab Beginn des Schritts in Tagen – danach erinnert Macher unter „Braucht dich“ */
  fristTage?: number;
  /** Text der Erinnerung */
  erinnerung?: string;
  /** Schritt ist automatisch erreicht, sobald das zutrifft */
  automatisch?: SchrittBedingung;
}

export interface AblaufVorlage {
  /** stabil, z. B. `projekt`, `kundendienst` */
  id: string;
  name: string;
  /** für welche Auftragsarten dieser Ablauf gilt */
  arten: Auftragsart[];
  schritte: SchrittVorlage[];
}

export interface ChecklisteVorlage {
  name: string;
  arten: Auftragsart[];
  punkte: string[];
}

export type FeldTyp = 'text' | 'zahl' | 'auswahl' | 'ja_nein' | 'datum';

/**
 * Feldvorlage für Formulare und Aufmaß – einfache Daten, die die Felder-Engine (`modules/felder`) anwenden kann.
 * `objekt` ist ein Sammlungsname (`auftraege`, `anlagen`, `orte`, `aufmasse` …).
 */
export interface FeldVorlage {
  objekt: string;
  schluessel: string;
  label: string;
  typ: FeldTyp;
  einheit?: string;
  optionen?: string[];
}

export interface SchulungVorlage {
  name: string;
  /** Wiederholung in Monaten, leer = einmalig */
  intervallMonate?: number;
}

export interface Planungsregeln {
  /** Arbeit draußen – bei schlechtem Wetter verschieben */
  wetterabhaengig: boolean;
  /** Einsätze nie allein einplanen */
  zweiPersonen: boolean;
  /** Einsätze dauern meist ganze Tage (Baustelle) statt kurzer Termine */
  ganzeTage: boolean;
  /** kurze Regeln in Handwerkersprache für die Planung */
  regeln: string[];
}

/** Bausteine der Heute-Seite in der Reihenfolge, die für das Gewerk am meisten zählt */
export type HeuteBaustein = 'einsaetze' | 'braucht-dich' | 'anfragen' | 'wartungen' | 'material' | 'wetter' | 'rechnungen';

export interface GewerkEngine {
  begriffe: Begriffe;
  auftragsarten: AuftragsartVorlage[];
  ablaeufe: AblaufVorlage[];
  artikelgruppen: string[];
  checklisten: ChecklisteVorlage[];
  felder: FeldVorlage[];
  dokumente: string[];
  schulungen: SchulungVorlage[];
  /** Automationen (IDs), die für dieses Gewerk abweichend vom Standard an- oder ausgeschaltet werden */
  automationen: { an: string[]; aus: string[] };
  planung: Planungsregeln;
  heute: HeuteBaustein[];
}

/** Eine vollständige Vorlage (Gewerk oder Fachrichtung) */
export interface Vorlage extends GewerkGrund, GewerkEngine {
  id: VorlageId;
  gewerk: Gewerk;
}

export interface Fachrichtung extends Vorlage {
  id: FachrichtungId;
  /** kurze Beschriftung im Onboarding, z. B. „Solar & Photovoltaik“ */
  schwerpunkt: string;
}

// ------------------------------------------------------------------ Bausteine

const BEGRIFFE: Begriffe = { einsatzort: 'Einsatzort', einsatzorte: 'Einsatzorte', auftrag: 'Auftrag', anlage: 'Anlage', einsatz: 'Einsatz' };
const BAUSTELLE: Begriffe = { ...BEGRIFFE, einsatzort: 'Baustelle', einsatzorte: 'Baustellen' };

const ARTEN: AuftragsartVorlage[] = [
  { art: 'kundendienst', label: 'Kundendienst', text: 'Störung, Reparatur, kleiner Auftrag' },
  { art: 'projekt', label: 'Projekt / Baustelle', text: 'mit Besichtigung und Angebot' },
  { art: 'wartung', label: 'Wartung', text: 'wiederkehrend an einer Anlage' },
  { art: 'reklamation', label: 'Reklamation', text: 'Nachbesserung, Gewährleistung' },
];

const s = (id: string, label: string, phase: Phase, extra: Omit<SchrittVorlage, 'id' | 'label' | 'phase'> = {}): SchrittVorlage => ({ id, label, phase, ...extra });

const VORBEREITUNG = s('vorbereitung', 'Vorbereitung', 'beauftragt', { zustaendig: 'verantwortlich', fristTage: 5, erinnerung: 'Material, Werkzeug und Termin vorbereiten' });

interface ProjektOptionen {
  name?: string;
  arten?: Auftragsart[];
  besichtigung?: string;
  /** Schritte zwischen „Beauftragt“ und „Eingeplant“ (Standard: Vorbereitung) */
  vorbereitung?: SchrittVorlage[];
  ausfuehrung?: string;
  /** Schritte vor der Abnahme in Phase „In Arbeit“ */
  inArbeit?: SchrittVorlage[];
  abnahme?: string;
  /** Schritte nach der Abnahme (Phase „Abnahme“) */
  nachAbnahme?: SchrittVorlage[];
}

/** Standard-Ablauf für Projekte: Neue Anfrage → … → Bezahlt */
export function projektAblauf(o: ProjektOptionen = {}): AblaufVorlage {
  return {
    id: 'projekt',
    name: o.name ?? 'Projekt mit Angebot',
    arten: o.arten ?? ['projekt'],
    schritte: [
      s('anfrage', 'Neue Anfrage', 'anfrage', { zustaendig: 'buero' }),
      s('besichtigung', o.besichtigung ?? 'Besichtigung', 'besichtigung', { zustaendig: 'verantwortlich', automatisch: 'besichtigung_geplant' }),
      s('angebot', 'Angebot', 'angebot', { zustaendig: 'verantwortlich', fristTage: 5, erinnerung: 'Angebot schreiben und verschicken' }),
      s('warten-kunde', 'Warten auf Kunde', 'angebot', { zustaendig: 'verantwortlich', automatisch: 'angebot_versendet' }),
      s('beauftragt', 'Beauftragt', 'beauftragt', { zustaendig: 'buero' }),
      ...(o.vorbereitung ?? [VORBEREITUNG]),
      s('eingeplant', 'Eingeplant', 'beauftragt', { zustaendig: 'eingeplant', automatisch: 'termin_geplant' }),
      ...(o.inArbeit ?? []),
      s('in-arbeit', o.ausfuehrung ?? 'In Arbeit', 'in_arbeit', { zustaendig: 'eingeplant' }),
      s('abnahme', o.abnahme ?? 'Abnahme', 'abnahme', { zustaendig: 'verantwortlich' }),
      ...(o.nachAbnahme ?? []),
      s('rechnung', 'Rechnung', 'abrechnung', { zustaendig: 'buero', fristTage: 3, erinnerung: 'Rechnung schreiben und verschicken' }),
      s('warten-zahlung', 'Warten auf Zahlung', 'abrechnung', { zustaendig: 'buero', automatisch: 'rechnung_versendet' }),
      s('bezahlt', 'Bezahlt', 'erledigt'),
    ],
  };
}

/** Kurzer Ablauf für Kundendienst: ohne Besichtigung und Angebot */
export function kundendienstAblauf(o: { name?: string; vorOrt?: string; fertig?: string } = {}): AblaufVorlage {
  return {
    id: 'kundendienst',
    name: o.name ?? 'Kundendienst',
    arten: ['kundendienst'],
    schritte: [
      s('anfrage', 'Neue Anfrage', 'anfrage', { zustaendig: 'buero' }),
      s('beauftragt', 'Termin vereinbaren', 'beauftragt', { zustaendig: 'buero', fristTage: 2, erinnerung: 'Termin mit dem Kunden vereinbaren' }),
      s('eingeplant', 'Eingeplant', 'beauftragt', { zustaendig: 'eingeplant', automatisch: 'termin_geplant' }),
      s('in-arbeit', o.vorOrt ?? 'Vor Ort', 'in_arbeit', { zustaendig: 'eingeplant' }),
      s('abnahme', o.fertig ?? 'Arbeit fertig', 'abnahme', { zustaendig: 'eingeplant' }),
      s('rechnung', 'Rechnung', 'abrechnung', { zustaendig: 'buero', fristTage: 3, erinnerung: 'Rechnung schreiben und verschicken' }),
      s('warten-zahlung', 'Warten auf Zahlung', 'abrechnung', { zustaendig: 'buero', automatisch: 'rechnung_versendet' }),
      s('bezahlt', 'Bezahlt', 'erledigt'),
    ],
  };
}

/** Wiederkehrende Wartung an einer Anlage */
export function wartungAblauf(o: { name?: string; faellig?: string; ausfuehrung?: string; abnahme?: string } = {}): AblaufVorlage {
  return {
    id: 'wartung',
    name: o.name ?? 'Wartung',
    arten: ['wartung'],
    schritte: [
      s('anfrage', o.faellig ?? 'Wartung fällig', 'anfrage', { zustaendig: 'buero' }),
      s('beauftragt', 'Termin vereinbaren', 'beauftragt', { zustaendig: 'buero', fristTage: 7, erinnerung: 'Wartungstermin mit dem Kunden vereinbaren' }),
      s('eingeplant', 'Eingeplant', 'beauftragt', { zustaendig: 'eingeplant', automatisch: 'termin_geplant' }),
      s('in-arbeit', o.ausfuehrung ?? 'Wartung läuft', 'in_arbeit', { zustaendig: 'eingeplant' }),
      s('abnahme', o.abnahme ?? 'Protokoll & Abnahme', 'abnahme', { zustaendig: 'eingeplant' }),
      s('rechnung', 'Rechnung', 'abrechnung', { zustaendig: 'buero', fristTage: 3, erinnerung: 'Rechnung schreiben und verschicken' }),
      s('warten-zahlung', 'Warten auf Zahlung', 'abrechnung', { zustaendig: 'buero', automatisch: 'rechnung_versendet' }),
      s('bezahlt', 'Bezahlt', 'erledigt'),
    ],
  };
}

/** Reklamation: prüfen, nachbessern, abschließen – meist ohne Rechnung */
export function reklamationAblauf(): AblaufVorlage {
  return {
    id: 'reklamation',
    name: 'Reklamation',
    arten: ['reklamation'],
    schritte: [
      s('anfrage', 'Reklamation eingegangen', 'anfrage', { zustaendig: 'verantwortlich', fristTage: 2, erinnerung: 'Kunden zurückrufen und Termin zur Prüfung machen' }),
      s('besichtigung', 'Vor Ort prüfen', 'besichtigung', { zustaendig: 'verantwortlich', automatisch: 'besichtigung_geplant' }),
      s('beauftragt', 'Nachbesserung planen', 'beauftragt', { zustaendig: 'buero' }),
      s('eingeplant', 'Eingeplant', 'beauftragt', { zustaendig: 'eingeplant', automatisch: 'termin_geplant' }),
      s('in-arbeit', 'Nachbesserung', 'in_arbeit', { zustaendig: 'eingeplant' }),
      s('abnahme', 'Abnahme', 'abnahme', { zustaendig: 'verantwortlich' }),
      s('bezahlt', 'Erledigt', 'erledigt'),
    ],
  };
}

const STANDARD_ABLAEUFE = (projekt: AblaufVorlage = projektAblauf()): AblaufVorlage[] => [projekt, kundendienstAblauf(), wartungAblauf(), reklamationAblauf()];

const DOKUMENTE = ['Angebot', 'Auftragsbestätigung', 'Arbeitsbericht', 'Abnahmeprotokoll', 'Rechnung'];
const SCHULUNGEN: SchulungVorlage[] = [
  { name: 'Arbeitsschutz-Unterweisung', intervallMonate: 12 },
  { name: 'Erste Hilfe', intervallMonate: 24 },
];
const AUTOMATIK = { an: [] as string[], aus: [] as string[] };
const PLANUNG_KUNDENDIENST: Planungsregeln = {
  wetterabhaengig: false,
  zweiPersonen: false,
  ganzeTage: false,
  regeln: ['Notfälle zuerst einplanen', 'Einsätze in der Nähe am selben Tag bündeln'],
};
const PLANUNG_BAUSTELLE: Planungsregeln = {
  wetterabhaengig: false,
  zweiPersonen: false,
  ganzeTage: true,
  regeln: ['Baustellen möglichst mit derselben Kolonne durchziehen', 'Material vor dem ersten Tag bereitstellen'],
};

/** Engine-Teil je Gewerk */
const ENGINE: Record<Gewerk, GewerkEngine> = {
  elektro: {
    begriffe: BEGRIFFE,
    auftragsarten: ARTEN,
    ablaeufe: STANDARD_ABLAEUFE(projektAblauf({ name: 'Installation mit Angebot', ausfuehrung: 'Installation' })),
    artikelgruppen: ['Leitung', 'Schalter & Dosen', 'Verteilung', 'E-Mobilität', 'Kleinmaterial'],
    checklisten: [
      { name: 'Wallbox-Installation', arten: ['projekt', 'kundendienst'], punkte: ['Hausanschluss und Zählerschrank geprüft', 'Anmeldung beim Netzbetreiber erledigt', 'Leitung verlegt und Absicherung eingebaut', 'Wallbox montiert und eingestellt', 'Messung und Prüfprotokoll erstellt', 'Kunden eingewiesen'] },
    ],
    felder: [
      { objekt: 'anlagen', schluessel: 'netzform', label: 'Netzform', typ: 'auswahl', optionen: ['TN-C', 'TN-C-S', 'TN-S', 'TT'] },
      { objekt: 'anlagen', schluessel: 'zaehlernummer', label: 'Zählernummer', typ: 'text' },
      { objekt: 'anlagen', schluessel: 'stromkreise', label: 'Anzahl Stromkreise', typ: 'zahl' },
      { objekt: 'anlagen', schluessel: 'hausanschluss', label: 'Absicherung Hausanschluss', typ: 'zahl', einheit: 'A' },
      { objekt: 'auftraege', schluessel: 'netzbetreiber_angemeldet', label: 'Beim Netzbetreiber angemeldet', typ: 'ja_nein' },
    ],
    dokumente: [...DOKUMENTE, 'Prüfprotokoll', 'Inbetriebsetzungsanzeige'],
    schulungen: [...SCHULUNGEN, { name: 'Elektrotechnische Unterweisung', intervallMonate: 12 }],
    automationen: AUTOMATIK,
    planung: { ...PLANUNG_KUNDENDIENST, regeln: [...PLANUNG_KUNDENDIENST.regeln, 'Arbeiten an Anlagen nur mit Elektrofachkraft einplanen'] },
    heute: ['einsaetze', 'braucht-dich', 'anfragen', 'material', 'wartungen'],
  },
  shk: {
    begriffe: BEGRIFFE,
    auftragsarten: ARTEN,
    ablaeufe: STANDARD_ABLAEUFE(projektAblauf({ name: 'Heizung oder Bad mit Angebot', vorbereitung: [s('vorbereitung', 'Material bestellen', 'beauftragt', { zustaendig: 'buero', fristTage: 3, erinnerung: 'Material beim Großhandel bestellen', automatisch: 'material_bestellt' }), s('material-da', 'Material da', 'beauftragt', { zustaendig: 'buero', automatisch: 'material_bereit' })] })),
    artikelgruppen: ['Rohr', 'Fittings', 'Armaturen', 'Keramik', 'Wartung', 'Kleinmaterial'],
    checklisten: [
      { name: 'Heizungstausch: Übergabe', arten: ['projekt'], punkte: ['Anlage befüllt und entlüftet', 'Dichtheit geprüft', 'Regelung eingestellt', 'Kunden in die Bedienung eingewiesen', 'Unterlagen übergeben', 'Altgerät entsorgt'] },
    ],
    felder: [
      { objekt: 'anlagen', schluessel: 'brennstoff', label: 'Energieträger', typ: 'auswahl', optionen: ['Gas', 'Öl', 'Wärmepumpe', 'Pellets', 'Fernwärme', 'Sonstiges'] },
      { objekt: 'anlagen', schluessel: 'leistung', label: 'Nennleistung', typ: 'zahl', einheit: 'kW' },
      { objekt: 'anlagen', schluessel: 'baujahr_kessel', label: 'Baujahr Wärmeerzeuger', typ: 'zahl' },
      { objekt: 'aufmasse', schluessel: 'raumflaeche', label: 'Raumfläche', typ: 'zahl', einheit: 'm²' },
      { objekt: 'aufmasse', schluessel: 'heizkoerper', label: 'Anzahl Heizkörper', typ: 'zahl' },
    ],
    dokumente: [...DOKUMENTE, 'Wartungsprotokoll', 'Druckprüfprotokoll'],
    schulungen: [...SCHULUNGEN, { name: 'Herstellerschulung Wärmeerzeuger', intervallMonate: 24 }],
    automationen: AUTOMATIK,
    planung: { ...PLANUNG_KUNDENDIENST, regeln: [...PLANUNG_KUNDENDIENST.regeln, 'Heizungsausfall im Winter immer als Notfall behandeln'] },
    heute: ['einsaetze', 'braucht-dich', 'anfragen', 'wartungen', 'material'],
  },
  maler: {
    begriffe: BAUSTELLE,
    auftragsarten: [ARTEN[1], ARTEN[0], ARTEN[3]],
    ablaeufe: STANDARD_ABLAEUFE(projektAblauf({ name: 'Malerarbeiten mit Angebot', vorbereitung: [s('farbtoene', 'Farbtöne abstimmen', 'beauftragt', { zustaendig: 'verantwortlich', fristTage: 5, erinnerung: 'Farbtöne und Oberflächen mit dem Kunden festlegen' }), VORBEREITUNG] })),
    artikelgruppen: ['Farbe', 'Grundierung', 'Tapete', 'Verbrauch'],
    checklisten: [
      { name: 'Fassade: Vorbereitung', arten: ['projekt'], punkte: ['Gerüst abgenommen', 'Fenster und Boden abgedeckt', 'Untergrund geprüft und gereinigt', 'Wetter für die nächsten Tage geprüft', 'Farbton freigegeben'] },
    ],
    felder: [
      { objekt: 'aufmasse', schluessel: 'wandflaeche', label: 'Wandfläche', typ: 'zahl', einheit: 'm²' },
      { objekt: 'aufmasse', schluessel: 'deckenflaeche', label: 'Deckenfläche', typ: 'zahl', einheit: 'm²' },
      { objekt: 'aufmasse', schluessel: 'untergrund', label: 'Untergrund', typ: 'auswahl', optionen: ['Putz', 'Raufaser', 'Gipskarton', 'Beton', 'Holz', 'Sonstiges'] },
      { objekt: 'auftraege', schluessel: 'farbton', label: 'Farbton', typ: 'text' },
      { objekt: 'auftraege', schluessel: 'moebel_raeumen', label: 'Möbel räumen nötig', typ: 'ja_nein' },
    ],
    dokumente: [...DOKUMENTE, 'Aufmaß', 'Farbtonfreigabe'],
    schulungen: SCHULUNGEN,
    automationen: AUTOMATIK,
    planung: { ...PLANUNG_BAUSTELLE, wetterabhaengig: true, regeln: [...PLANUNG_BAUSTELLE.regeln, 'Fassadenarbeiten nur bei trockenem Wetter einplanen'] },
    heute: ['einsaetze', 'braucht-dich', 'wetter', 'material', 'anfragen'],
  },
  dach: {
    begriffe: BAUSTELLE,
    auftragsarten: [ARTEN[1], { art: 'kundendienst', label: 'Reparatur', text: 'Sturmschaden, undichte Stelle' }, { art: 'wartung', label: 'Dachwartung' }, ARTEN[3]],
    ablaeufe: STANDARD_ABLAEUFE(
      projektAblauf({
        name: 'Dacharbeiten mit Angebot',
        besichtigung: 'Dach besichtigen',
        vorbereitung: [s('geruest', 'Gerüst bestellen', 'beauftragt', { zustaendig: 'buero', fristTage: 3, erinnerung: 'Gerüst beim Gerüstbauer bestellen' }), s('vorbereitung', 'Material bestellen', 'beauftragt', { zustaendig: 'buero', fristTage: 3, erinnerung: 'Material bestellen und Lieferung abstimmen' })],
      }),
    ),
    artikelgruppen: ['Eindeckung', 'Folie', 'Klempner', 'Holz'],
    checklisten: [
      { name: 'Sturmschaden-Einsatz', arten: ['kundendienst'], punkte: ['Absturzsicherung angelegt', 'Schaden fotografiert', 'Undichte Stelle provisorisch gesichert', 'Kunden über weitere Arbeiten informiert'] },
    ],
    felder: [
      { objekt: 'aufmasse', schluessel: 'dachform', label: 'Dachform', typ: 'auswahl', optionen: ['Satteldach', 'Walmdach', 'Pultdach', 'Flachdach', 'Mansarddach', 'Sonstiges'] },
      { objekt: 'aufmasse', schluessel: 'dachflaeche', label: 'Dachfläche', typ: 'zahl', einheit: 'm²' },
      { objekt: 'aufmasse', schluessel: 'traufhoehe', label: 'Traufhöhe', typ: 'zahl', einheit: 'm' },
      { objekt: 'aufmasse', schluessel: 'eindeckung', label: 'Eindeckung', typ: 'auswahl', optionen: ['Ziegel', 'Betondachstein', 'Schiefer', 'Blech', 'Bitumen', 'Sonstiges'] },
      { objekt: 'auftraege', schluessel: 'geruest_noetig', label: 'Gerüst nötig', typ: 'ja_nein' },
    ],
    dokumente: [...DOKUMENTE, 'Aufmaß', 'Dachinspektionsbericht'],
    schulungen: [...SCHULUNGEN, { name: 'Unterweisung Absturzsicherung', intervallMonate: 12 }],
    automationen: AUTOMATIK,
    planung: { wetterabhaengig: true, zweiPersonen: true, ganzeTage: true, regeln: ['Dacharbeiten nie allein einplanen', 'Bei Sturm, Regen oder Frost verschieben', 'Gerüst vor dem ersten Tag stellen lassen'] },
    heute: ['einsaetze', 'wetter', 'braucht-dich', 'material', 'anfragen'],
  },
  tischler: {
    begriffe: BEGRIFFE,
    auftragsarten: [ARTEN[1], { art: 'werkstatt', label: 'Werkstattauftrag', text: 'Fertigung im Betrieb' }, ARTEN[0], ARTEN[3]],
    ablaeufe: STANDARD_ABLAEUFE(
      projektAblauf({
        name: 'Anfertigung mit Montage',
        arten: ['projekt', 'werkstatt'],
        besichtigung: 'Aufmaß vor Ort',
        vorbereitung: [s('vorbereitung', 'Material bestellen', 'beauftragt', { zustaendig: 'buero', fristTage: 3, erinnerung: 'Platten, Holz und Beschläge bestellen' }), s('fertigung', 'Fertigung in der Werkstatt', 'beauftragt', { zustaendig: 'verantwortlich' })],
        ausfuehrung: 'Montage',
      }),
    ),
    artikelgruppen: ['Platten', 'Holz', 'Beschläge', 'Montage'],
    checklisten: [
      { name: 'Küchenmontage', arten: ['projekt', 'werkstatt'], punkte: ['Lieferung vollständig geprüft', 'Wände und Anschlüsse geprüft', 'Korpusse ausgerichtet', 'Arbeitsplatte eingepasst', 'Fronten eingestellt', 'Kunden eingewiesen'] },
    ],
    felder: [
      { objekt: 'aufmasse', schluessel: 'breite', label: 'Breite', typ: 'zahl', einheit: 'mm' },
      { objekt: 'aufmasse', schluessel: 'hoehe', label: 'Höhe', typ: 'zahl', einheit: 'mm' },
      { objekt: 'aufmasse', schluessel: 'tiefe', label: 'Tiefe', typ: 'zahl', einheit: 'mm' },
      { objekt: 'auftraege', schluessel: 'holzart', label: 'Holzart / Material', typ: 'text' },
      { objekt: 'auftraege', schluessel: 'oberflaeche', label: 'Oberfläche', typ: 'auswahl', optionen: ['geölt', 'lackiert', 'gebeizt', 'furniert', 'beschichtet', 'roh'] },
    ],
    dokumente: [...DOKUMENTE, 'Aufmaß', 'Werkstattzeichnung'],
    schulungen: [...SCHULUNGEN, { name: 'Unterweisung Holzbearbeitungsmaschinen', intervallMonate: 12 }],
    automationen: AUTOMATIK,
    planung: { ...PLANUNG_BAUSTELLE, regeln: ['Montage erst einplanen, wenn die Fertigung fertig ist', 'Für große Teile zu zweit einplanen'] },
    heute: ['einsaetze', 'braucht-dich', 'material', 'anfragen'],
  },
  fliesen: {
    begriffe: BAUSTELLE,
    auftragsarten: [ARTEN[1], ARTEN[0], ARTEN[3]],
    ablaeufe: STANDARD_ABLAEUFE(projektAblauf({ name: 'Fliesenarbeiten mit Angebot', vorbereitung: [s('auswahl', 'Fliesen auswählen', 'beauftragt', { zustaendig: 'verantwortlich', fristTage: 7, erinnerung: 'Fliesen mit dem Kunden auswählen' }), s('vorbereitung', 'Material bestellen', 'beauftragt', { zustaendig: 'buero', fristTage: 3, erinnerung: 'Fliesen und Kleber bestellen' })] })),
    artikelgruppen: ['Kleber', 'Fuge', 'Abdichtung', 'Kleinmaterial'],
    checklisten: [
      { name: 'Bad-Übergabe', arten: ['projekt'], punkte: ['Fugen sauber und vollständig', 'Silikonfugen gezogen', 'Fliesen gereinigt', 'Restfliesen beim Kunden gelassen', 'Pflegehinweise übergeben'] },
    ],
    felder: [
      { objekt: 'aufmasse', schluessel: 'bodenflaeche', label: 'Bodenfläche', typ: 'zahl', einheit: 'm²' },
      { objekt: 'aufmasse', schluessel: 'wandflaeche', label: 'Wandfläche', typ: 'zahl', einheit: 'm²' },
      { objekt: 'auftraege', schluessel: 'fliesenformat', label: 'Fliesenformat', typ: 'text' },
      { objekt: 'aufmasse', schluessel: 'untergrund', label: 'Untergrund', typ: 'auswahl', optionen: ['Estrich', 'Beton', 'Altfliesen', 'Gipskarton', 'Holz', 'Sonstiges'] },
      { objekt: 'auftraege', schluessel: 'abdichtung', label: 'Abdichtung nötig', typ: 'ja_nein' },
    ],
    dokumente: [...DOKUMENTE, 'Aufmaß'],
    schulungen: SCHULUNGEN,
    automationen: AUTOMATIK,
    planung: PLANUNG_BAUSTELLE,
    heute: ['einsaetze', 'braucht-dich', 'material', 'anfragen'],
  },
  garten: {
    begriffe: { ...BEGRIFFE, einsatzort: 'Grundstück', einsatzorte: 'Grundstücke', anlage: 'Anlage' },
    auftragsarten: [ARTEN[1], { art: 'wartung', label: 'Pflege', text: 'regelmäßige Gartenpflege' }, ARTEN[0], ARTEN[3]],
    ablaeufe: [
      projektAblauf({ name: 'Gartenbau mit Angebot', besichtigung: 'Besichtigung & Aufmaß', vorbereitung: [s('vorbereitung', 'Material & Maschinen planen', 'beauftragt', { zustaendig: 'verantwortlich', fristTage: 5, erinnerung: 'Material bestellen und Maschinen reservieren' })], ausfuehrung: 'Ausführung' }),
      kundendienstAblauf(),
      wartungAblauf({ name: 'Pflege', faellig: 'Pflege fällig', ausfuehrung: 'Pflege läuft', abnahme: 'Pflege erledigt' }),
      reklamationAblauf(),
    ],
    artikelgruppen: ['Pflaster', 'Schüttgut', 'Pflanzen'],
    checklisten: [
      { name: 'Pflasterarbeiten', arten: ['projekt'], punkte: ['Leitungen erfragt und markiert', 'Aushub und Unterbau verdichtet', 'Gefälle geprüft', 'Fugen verfüllt und abgerüttelt', 'Baustelle gereinigt'] },
    ],
    felder: [
      { objekt: 'aufmasse', schluessel: 'flaeche', label: 'Fläche', typ: 'zahl', einheit: 'm²' },
      { objekt: 'orte', schluessel: 'zufahrt', label: 'Zufahrt für Maschinen', typ: 'ja_nein' },
      { objekt: 'aufmasse', schluessel: 'bodenart', label: 'Boden', typ: 'auswahl', optionen: ['Sand', 'Lehm', 'Ton', 'Mutterboden', 'Unbekannt'] },
      { objekt: 'orte', schluessel: 'wasseranschluss', label: 'Wasseranschluss vorhanden', typ: 'ja_nein' },
    ],
    dokumente: [...DOKUMENTE, 'Aufmaß', 'Pflegeplan'],
    schulungen: [...SCHULUNGEN, { name: 'Unterweisung Motorsäge und Freischneider', intervallMonate: 12 }],
    automationen: AUTOMATIK,
    planung: { wetterabhaengig: true, zweiPersonen: false, ganzeTage: true, regeln: ['Bei Dauerregen oder Frost Bauarbeiten verschieben', 'Pflegerunden nach Gegend bündeln'] },
    heute: ['einsaetze', 'wetter', 'braucht-dich', 'wartungen', 'material'],
  },
  metall: {
    begriffe: BAUSTELLE,
    auftragsarten: [ARTEN[1], { art: 'werkstatt', label: 'Werkstattauftrag', text: 'Fertigung im Betrieb' }, ARTEN[0], ARTEN[2]],
    ablaeufe: STANDARD_ABLAEUFE(
      projektAblauf({
        name: 'Fertigung mit Montage',
        arten: ['projekt', 'werkstatt'],
        besichtigung: 'Aufmaß vor Ort',
        vorbereitung: [
          s('zeichnung', 'Zeichnung freigeben', 'beauftragt', { zustaendig: 'verantwortlich', fristTage: 5, erinnerung: 'Werkstattzeichnung vom Kunden freigeben lassen' }),
          s('vorbereitung', 'Material bestellen', 'beauftragt', { zustaendig: 'buero', fristTage: 3, erinnerung: 'Stahl und Zubehör bestellen' }),
          s('fertigung', 'Fertigung in der Werkstatt', 'beauftragt', { zustaendig: 'verantwortlich' }),
        ],
        ausfuehrung: 'Montage',
      }),
    ),
    artikelgruppen: ['Stahl', 'Edelstahl', 'Verbrauch', 'Befestigung'],
    checklisten: [
      { name: 'Werkstatt: Fertigungsfreigabe', arten: ['projekt', 'werkstatt'], punkte: ['Maße am Bau geprüft', 'Zeichnung vom Kunden freigegeben', 'Material und Oberfläche festgelegt', 'Termin für die Montage abgestimmt'] },
    ],
    felder: [
      { objekt: 'aufmasse', schluessel: 'laenge', label: 'Länge', typ: 'zahl', einheit: 'm' },
      { objekt: 'aufmasse', schluessel: 'hoehe', label: 'Höhe', typ: 'zahl', einheit: 'mm' },
      { objekt: 'auftraege', schluessel: 'werkstoff', label: 'Werkstoff', typ: 'auswahl', optionen: ['Stahl', 'Edelstahl', 'Aluminium', 'Sonstiges'] },
      { objekt: 'auftraege', schluessel: 'oberflaeche', label: 'Oberfläche', typ: 'auswahl', optionen: ['feuerverzinkt', 'pulverbeschichtet', 'lackiert', 'roh'] },
    ],
    dokumente: [...DOKUMENTE, 'Aufmaß', 'Werkstattzeichnung'],
    schulungen: [...SCHULUNGEN, { name: 'Unterweisung Schweißen', intervallMonate: 12 }],
    automationen: AUTOMATIK,
    planung: { ...PLANUNG_BAUSTELLE, zweiPersonen: true, regeln: ['Montage erst einplanen, wenn die Fertigung fertig ist', 'Schwere Teile zu zweit montieren'] },
    heute: ['einsaetze', 'braucht-dich', 'material', 'anfragen'],
  },
  bau: {
    begriffe: BAUSTELLE,
    auftragsarten: [ARTEN[1], ARTEN[0], ARTEN[3]],
    ablaeufe: STANDARD_ABLAEUFE(projektAblauf({ name: 'Bauvorhaben mit Angebot', vorbereitung: [s('vorbereitung', 'Baustelle vorbereiten', 'beauftragt', { zustaendig: 'verantwortlich', fristTage: 5, erinnerung: 'Container, Material und Geräte für den Start organisieren' })] })),
    artikelgruppen: ['Trockenbau', 'Estrich', 'Rohbau', 'Putz'],
    checklisten: [
      { name: 'Baustelle: Tagesabschluss', arten: ['projekt'], punkte: ['Baustelle gesichert', 'Geräte verschlossen', 'Fortschritt fotografiert', 'Material für morgen geprüft'] },
    ],
    felder: [
      { objekt: 'aufmasse', schluessel: 'flaeche', label: 'Fläche', typ: 'zahl', einheit: 'm²' },
      { objekt: 'aufmasse', schluessel: 'wandstaerke', label: 'Wandstärke', typ: 'zahl', einheit: 'cm' },
      { objekt: 'orte', schluessel: 'container_platz', label: 'Platz für Container', typ: 'ja_nein' },
    ],
    dokumente: [...DOKUMENTE, 'Aufmaß', 'Bautagebuch'],
    schulungen: SCHULUNGEN,
    automationen: AUTOMATIK,
    planung: { ...PLANUNG_BAUSTELLE, wetterabhaengig: true },
    heute: ['einsaetze', 'braucht-dich', 'wetter', 'material'],
  },
  sonstiges: {
    begriffe: BEGRIFFE,
    auftragsarten: ARTEN,
    ablaeufe: STANDARD_ABLAEUFE(),
    artikelgruppen: ['Material'],
    checklisten: [],
    felder: [{ objekt: 'aufmasse', schluessel: 'flaeche', label: 'Fläche', typ: 'zahl', einheit: 'm²' }],
    dokumente: DOKUMENTE,
    schulungen: SCHULUNGEN,
    automationen: AUTOMATIK,
    planung: PLANUNG_KUNDENDIENST,
    heute: ['einsaetze', 'braucht-dich', 'anfragen', 'material'],
  },
};

/** Alle Gewerke aus `objects.ts` – vollständig mit Engine-Daten */
export const GEWERKE: GewerkVorlage[] = GRUND.map((g) => ({ ...g, gewerk: g.id, ...ENGINE[g.id] }));

export const gewerkVorlage = (g: Gewerk) => GEWERKE.find((x) => x.id === g) ?? GEWERKE[GEWERKE.length - 1];

// ------------------------------------------------------------------ Fachrichtungen

/**
 * Fachrichtungen mit eigener Vorlage. Sie hängen an einem Basis-Gewerk (`gewerk`), damit alles, was den Typ
 * `Gewerk` kennt, weiter funktioniert. Kernwunsch: eigene Werte in `Gewerk` (objects.ts).
 */
export const FACHRICHTUNGEN: Fachrichtung[] = [
  {
    id: 'solar',
    gewerk: 'elektro',
    label: 'Solar & Photovoltaik',
    schwerpunkt: 'Solar & Photovoltaik',
    standardArbeitsweisen: ['baustelle', 'wartung'],
    stundensatz: 68,
    leistungen: [
      { name: 'Arbeitsstunde Monteur', einheit: 'h', preis: 68, minuten: 60, kategorie: 'Lohn' },
      { name: 'Arbeitsstunde Elektrofachkraft', einheit: 'h', preis: 78, minuten: 60, kategorie: 'Lohn' },
      { name: 'Vor-Ort-Termin mit Dachcheck', einheit: 'Psch', preis: 149, minuten: 90, kategorie: 'Beratung' },
      { name: 'PV-Module montieren (je Modul)', einheit: 'Stk', preis: 85, minuten: 30, kategorie: 'Montage' },
      { name: 'Unterkonstruktion Schrägdach (je Modul)', einheit: 'Stk', preis: 55, minuten: 20, kategorie: 'Montage' },
      { name: 'Wechselrichter installieren', einheit: 'Psch', preis: 590, minuten: 240, kategorie: 'Elektro' },
      { name: 'Batteriespeicher installieren', einheit: 'Psch', preis: 790, minuten: 300, kategorie: 'Elektro' },
      { name: 'Zählerschrank anpassen', einheit: 'Psch', preis: 890, minuten: 360, kategorie: 'Elektro' },
      { name: 'Anmeldung beim Netzbetreiber', einheit: 'Psch', preis: 190, minuten: 90, kategorie: 'Büro' },
      { name: 'Inbetriebnahme und Einweisung', einheit: 'Psch', preis: 290, minuten: 120, kategorie: 'Elektro' },
      { name: 'PV-Anlage Wartung', einheit: 'Psch', preis: 249, minuten: 120, kategorie: 'Wartung' },
      { name: 'Gerüst stellen', einheit: 'm²', preis: 11, kategorie: 'Gerüst' },
    ],
    artikel: [
      { name: 'Solarkabel 6 mm²', einheit: 'm', ek: 0.9, vk: 1.7, kategorie: 'Leitung', mindestbestand: 200 },
      { name: 'Steckverbinder-Paar', einheit: 'Stk', ek: 2.2, vk: 4.5, kategorie: 'Kleinmaterial', mindestbestand: 40 },
      { name: 'Dachhaken Ziegeldach', einheit: 'Stk', ek: 6.5, vk: 11.9, kategorie: 'Unterkonstruktion', mindestbestand: 40 },
      { name: 'Montageschiene', einheit: 'm', ek: 6.9, vk: 12.5, kategorie: 'Unterkonstruktion' },
      { name: 'Modulklemme', einheit: 'Stk', ek: 1.6, vk: 3.2, kategorie: 'Unterkonstruktion', mindestbestand: 60 },
    ],
    qualifikationen: [
      { name: 'Elektrofachkraft', kategorie: 'fachlich' },
      { name: 'Eintragung Netzbetreiber (Installateurverzeichnis)', kategorie: 'zertifikat', gueltigMonate: 60 },
      { name: 'Absturzsicherung PSAgA', kategorie: 'pflicht', gueltigMonate: 12 },
      { name: 'Speicher-Herstellerschulung', kategorie: 'zertifikat', gueltigMonate: 24 },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['PV-Anlage', 'Batteriespeicher', 'Wechselrichter', 'Wallbox', 'Zählerschrank'],
    pruefungen: ['DGUV V3', 'TÜV/HU', 'UVV Fahrzeug', 'PSAgA-Prüfung', 'Leiterprüfung'],
    begriffe: { ...BAUSTELLE, anlage: 'Anlage', einsatz: 'Montage' },
    auftragsarten: [{ art: 'projekt', label: 'Neue Anlage', text: 'mit Dachcheck und Angebot' }, { art: 'wartung', label: 'Wartung', text: 'Anlage prüfen und reinigen' }, { art: 'kundendienst', label: 'Störung', text: 'Anlage liefert nicht' }, ARTEN[3]],
    ablaeufe: [
      projektAblauf({
        name: 'PV-Anlage mit Angebot',
        besichtigung: 'Vor-Ort-Termin & Dachcheck',
        vorbereitung: [
          s('netzanmeldung', 'Anmeldung beim Netzbetreiber', 'beauftragt', { zustaendig: 'buero', fristTage: 5, erinnerung: 'Anlage beim Netzbetreiber anmelden' }),
          s('vorbereitung', 'Material & Gerüst organisieren', 'beauftragt', { zustaendig: 'buero', fristTage: 5, erinnerung: 'Module, Wechselrichter und Gerüst bestellen' }),
        ],
        ausfuehrung: 'Montage',
        abnahme: 'Inbetriebnahme & Übergabe',
        nachAbnahme: [s('register', 'Marktstammdatenregister eintragen', 'abnahme', { zustaendig: 'buero', fristTage: 7, erinnerung: 'Anlage im Marktstammdatenregister eintragen oder den Kunden daran erinnern' })],
      }),
      kundendienstAblauf({ name: 'Störung', fertig: 'Störung behoben' }),
      wartungAblauf({ name: 'PV-Wartung' }),
      reklamationAblauf(),
    ],
    artikelgruppen: ['Module', 'Wechselrichter', 'Speicher', 'Unterkonstruktion', 'Leitung', 'Kleinmaterial'],
    checklisten: [
      { name: 'PV-Montage', arten: ['projekt'], punkte: ['Absturzsicherung angelegt', 'Dachhaken gesetzt und Ziegel angepasst', 'Schienen ausgerichtet', 'Module montiert und verkabelt', 'Fotos von Dach und Verkabelung gemacht'] },
      { name: 'PV-Inbetriebnahme', arten: ['projekt'], punkte: ['Messungen durchgeführt und dokumentiert', 'Wechselrichter eingerichtet', 'Überwachung beim Kunden eingerichtet', 'Kunden eingewiesen', 'Unterlagen übergeben'] },
    ],
    felder: [
      { objekt: 'aufmasse', schluessel: 'dachneigung', label: 'Dachneigung', typ: 'zahl', einheit: '°' },
      { objekt: 'aufmasse', schluessel: 'ausrichtung', label: 'Ausrichtung', typ: 'auswahl', optionen: ['Süd', 'Südost', 'Südwest', 'Ost', 'West', 'Ost-West', 'Nord'] },
      { objekt: 'aufmasse', schluessel: 'dachflaeche', label: 'Nutzbare Dachfläche', typ: 'zahl', einheit: 'm²' },
      { objekt: 'aufmasse', schluessel: 'eindeckung', label: 'Eindeckung', typ: 'auswahl', optionen: ['Ziegel', 'Betondachstein', 'Schiefer', 'Blech', 'Flachdach', 'Sonstiges'] },
      { objekt: 'auftraege', schluessel: 'jahresverbrauch', label: 'Stromverbrauch im Jahr', typ: 'zahl', einheit: 'kWh' },
      { objekt: 'auftraege', schluessel: 'speicher', label: 'Speicher gewünscht', typ: 'ja_nein' },
      { objekt: 'auftraege', schluessel: 'wallbox', label: 'Wallbox gewünscht', typ: 'ja_nein' },
      { objekt: 'anlagen', schluessel: 'leistung_kwp', label: 'Anlagenleistung', typ: 'zahl', einheit: 'kWp' },
      { objekt: 'anlagen', schluessel: 'inbetriebnahme', label: 'Inbetriebnahme am', typ: 'datum' },
    ],
    dokumente: [...DOKUMENTE, 'Aufmaß', 'Netzanmeldung', 'Inbetriebnahmeprotokoll', 'Anlagenpass'],
    schulungen: [...SCHULUNGEN, { name: 'Unterweisung Absturzsicherung', intervallMonate: 12 }, { name: 'Herstellerschulung Wechselrichter und Speicher', intervallMonate: 24 }],
    automationen: AUTOMATIK,
    planung: { wetterabhaengig: true, zweiPersonen: true, ganzeTage: true, regeln: ['Montage auf dem Dach nie allein einplanen', 'Bei Regen, Sturm oder Frost verschieben', 'Gerüst und Material vor dem ersten Tag bereit'] },
    heute: ['einsaetze', 'wetter', 'braucht-dich', 'material', 'anfragen'],
  },
  {
    id: 'fensterbau',
    gewerk: 'tischler',
    label: 'Fenster & Türen',
    schwerpunkt: 'Fenster & Türen',
    standardArbeitsweisen: ['baustelle', 'kundendienst'],
    stundensatz: 64,
    leistungen: [
      { name: 'Arbeitsstunde Montage', einheit: 'h', preis: 64, minuten: 60, kategorie: 'Lohn' },
      { name: 'Aufmaß vor Ort', einheit: 'Psch', preis: 89, minuten: 60, kategorie: 'Beratung' },
      { name: 'Altfenster ausbauen und entsorgen', einheit: 'Stk', preis: 85, minuten: 45, kategorie: 'Rückbau' },
      { name: 'Fenster einbauen inkl. Abdichtung', einheit: 'Stk', preis: 260, minuten: 150, kategorie: 'Montage' },
      { name: 'Haustür einbauen', einheit: 'Stk', preis: 590, minuten: 300, kategorie: 'Montage' },
      { name: 'Fensterbank innen montieren', einheit: 'Stk', preis: 69, minuten: 40, kategorie: 'Montage' },
      { name: 'Rollladen nachrüsten', einheit: 'Stk', preis: 390, minuten: 120, kategorie: 'Sonnenschutz' },
      { name: 'Fenster einstellen', einheit: 'Stk', preis: 59, minuten: 30, kategorie: 'Service' },
      { name: 'Fensterdichtung erneuern', einheit: 'm', preis: 14, minuten: 8, kategorie: 'Service' },
      { name: 'Insektenschutz nach Maß', einheit: 'Stk', preis: 145, minuten: 40, kategorie: 'Service' },
    ],
    artikel: [
      { name: 'Montageschaum', einheit: 'Stk', ek: 6.9, vk: 12.9, kategorie: 'Montage', mindestbestand: 12 },
      { name: 'Fensterdichtband (Kompriband)', einheit: 'm', ek: 1.4, vk: 2.9, kategorie: 'Abdichtung', mindestbestand: 50 },
      { name: 'Rahmendübel', einheit: 'Stk', ek: 0.6, vk: 1.3, kategorie: 'Befestigung', mindestbestand: 100 },
      { name: 'Montagekeile', einheit: 'Stk', ek: 4.5, vk: 8.9, kategorie: 'Montage', mindestbestand: 10 },
    ],
    qualifikationen: [
      { name: 'Tischlergeselle', kategorie: 'fachlich' },
      { name: 'Fenstermonteur', kategorie: 'fachlich' },
      { name: 'Herstellerschulung Fenstersysteme', kategorie: 'zertifikat', gueltigMonate: 24 },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['Fenster', 'Haustür', 'Rollladen', 'Dachfenster', 'Insektenschutz'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'DGUV V3', 'Leiterprüfung'],
    begriffe: { ...BAUSTELLE, anlage: 'Element', einsatz: 'Montage' },
    auftragsarten: [{ art: 'projekt', label: 'Neue Fenster/Türen', text: 'mit Aufmaß und Angebot' }, { art: 'kundendienst', label: 'Reparatur & Einstellen' }, { art: 'wartung', label: 'Wartung' }, ARTEN[3]],
    ablaeufe: [
      projektAblauf({
        name: 'Fenster und Türen mit Aufmaß',
        arten: ['projekt', 'werkstatt'],
        besichtigung: 'Aufmaß vor Ort',
        vorbereitung: [
          s('vorbereitung', 'Beim Hersteller bestellen', 'beauftragt', { zustaendig: 'buero', fristTage: 3, erinnerung: 'Elemente nach Aufmaß beim Hersteller bestellen', automatisch: 'material_bestellt' }),
          s('lieferung', 'Lieferung abwarten', 'beauftragt', { zustaendig: 'buero', automatisch: 'material_bereit' }),
        ],
        ausfuehrung: 'Montage',
      }),
      kundendienstAblauf({ name: 'Reparatur' }),
      wartungAblauf({ name: 'Fensterwartung' }),
      reklamationAblauf(),
    ],
    artikelgruppen: ['Elemente', 'Abdichtung', 'Befestigung', 'Montage', 'Sonnenschutz'],
    checklisten: [
      { name: 'Aufmaß Fenster', arten: ['projekt'], punkte: ['Rohbaumaße an drei Stellen gemessen', 'Öffnungsart und Anschlag festgelegt', 'Fensterbank innen und außen aufgenommen', 'Rollladen und Insektenschutz besprochen', 'Fotos von jeder Öffnung'] },
      { name: 'Fenstermontage', arten: ['projekt'], punkte: ['Lieferung auf Schäden geprüft', 'Altfenster ausgebaut', 'Fenster ausgerichtet und befestigt', 'Fugen innen und außen abgedichtet', 'Flügel eingestellt', 'Baustelle gereinigt'] },
    ],
    felder: [
      { objekt: 'aufmasse', schluessel: 'rohbaubreite', label: 'Rohbaubreite', typ: 'zahl', einheit: 'mm' },
      { objekt: 'aufmasse', schluessel: 'rohbauhoehe', label: 'Rohbauhöhe', typ: 'zahl', einheit: 'mm' },
      { objekt: 'aufmasse', schluessel: 'oeffnungsart', label: 'Öffnungsart', typ: 'auswahl', optionen: ['Dreh-Kipp', 'Dreh', 'Kipp', 'Festverglasung', 'Schiebe', 'Sonstiges'] },
      { objekt: 'aufmasse', schluessel: 'anschlag', label: 'Anschlag', typ: 'auswahl', optionen: ['DIN links', 'DIN rechts'] },
      { objekt: 'aufmasse', schluessel: 'rahmen', label: 'Rahmenmaterial', typ: 'auswahl', optionen: ['Kunststoff', 'Holz', 'Aluminium', 'Holz-Alu'] },
      { objekt: 'aufmasse', schluessel: 'verglasung', label: 'Verglasung', typ: 'auswahl', optionen: ['2-fach', '3-fach'] },
      { objekt: 'aufmasse', schluessel: 'rollladen', label: 'Rollladen', typ: 'ja_nein' },
      { objekt: 'aufmasse', schluessel: 'fensterbank', label: 'Fensterbank tauschen', typ: 'ja_nein' },
    ],
    dokumente: [...DOKUMENTE, 'Aufmaß', 'Bestellung beim Hersteller', 'Montageprotokoll'],
    schulungen: [...SCHULUNGEN, { name: 'Herstellerschulung Fenstersysteme', intervallMonate: 24 }],
    automationen: AUTOMATIK,
    planung: { wetterabhaengig: true, zweiPersonen: true, ganzeTage: true, regeln: ['Montage erst einplanen, wenn die Lieferung da ist', 'Große Elemente zu zweit montieren', 'Bei Starkregen keine Fenster ausbauen'] },
    heute: ['einsaetze', 'braucht-dich', 'material', 'wetter', 'anfragen'],
  },
  {
    id: 'reinigung',
    gewerk: 'sonstiges',
    label: 'Gebäudereinigung',
    schwerpunkt: 'Gebäudereinigung',
    standardArbeitsweisen: ['wartung', 'kundendienst'],
    stundensatz: 38,
    leistungen: [
      { name: 'Arbeitsstunde Reinigungskraft', einheit: 'h', preis: 38, minuten: 60, kategorie: 'Lohn' },
      { name: 'Unterhaltsreinigung Büro', einheit: 'm²', preis: 1.2, minuten: 1, kategorie: 'Unterhaltsreinigung' },
      { name: 'Treppenhausreinigung', einheit: 'Psch', preis: 69, minuten: 60, kategorie: 'Unterhaltsreinigung' },
      { name: 'Glasreinigung', einheit: 'm²', preis: 3.5, minuten: 3, kategorie: 'Glas' },
      { name: 'Grundreinigung Hartboden', einheit: 'm²', preis: 4.8, minuten: 5, kategorie: 'Sonderreinigung' },
      { name: 'Teppichreinigung', einheit: 'm²', preis: 3.9, minuten: 4, kategorie: 'Sonderreinigung' },
      { name: 'Bauendreinigung', einheit: 'm²', preis: 3.2, minuten: 4, kategorie: 'Sonderreinigung' },
      { name: 'Objektbesichtigung', einheit: 'Psch', preis: 0, minuten: 60, kategorie: 'Beratung' },
    ],
    artikel: [
      { name: 'Allzweckreiniger 10 l', einheit: 'Stk', ek: 14, vk: 0, kategorie: 'Reinigungsmittel', mindestbestand: 4 },
      { name: 'Sanitärreiniger 10 l', einheit: 'Stk', ek: 18, vk: 0, kategorie: 'Reinigungsmittel', mindestbestand: 4 },
      { name: 'Glasreiniger 10 l', einheit: 'Stk', ek: 12, vk: 0, kategorie: 'Reinigungsmittel', mindestbestand: 2 },
      { name: 'Mikrofasertücher (Pack)', einheit: 'Stk', ek: 9, vk: 0, kategorie: 'Verbrauch', mindestbestand: 10 },
      { name: 'Müllbeutel 120 l (Rolle)', einheit: 'Stk', ek: 4.5, vk: 0, kategorie: 'Verbrauch', mindestbestand: 20 },
    ],
    qualifikationen: [
      { name: 'Gebäudereiniger', kategorie: 'fachlich' },
      { name: 'Unterweisung Reinigungsmittel und Gefahrstoffe', kategorie: 'pflicht', gueltigMonate: 12 },
      { name: 'Hubarbeitsbühne', kategorie: 'zertifikat', gueltigMonate: 12 },
      ...gemeinsamQuali,
    ],
    anlagentypen: ['Büro', 'Treppenhaus', 'Praxis', 'Glasfläche', 'Sanitärbereich'],
    pruefungen: ['TÜV/HU', 'UVV Fahrzeug', 'DGUV V3', 'Leiterprüfung'],
    begriffe: { einsatzort: 'Objekt', einsatzorte: 'Objekte', auftrag: 'Auftrag', anlage: 'Bereich', einsatz: 'Reinigung' },
    auftragsarten: [
      { art: 'wartung', label: 'Unterhaltsreinigung', text: 'regelmäßig im Objekt' },
      { art: 'projekt', label: 'Sonderreinigung', text: 'Grund-, Glas- oder Bauendreinigung mit Angebot' },
      { art: 'kundendienst', label: 'Einzelauftrag', text: 'einmalige Reinigung' },
      { art: 'reklamation', label: 'Beanstandung', text: 'Nachreinigung' },
    ],
    ablaeufe: [
      projektAblauf({
        name: 'Sonderreinigung mit Angebot',
        besichtigung: 'Objektbesichtigung',
        vorbereitung: [s('vorbereitung', 'Objekt-Einweisung & Schlüssel', 'beauftragt', { zustaendig: 'verantwortlich', fristTage: 5, erinnerung: 'Einweisung im Objekt und Schlüsselübergabe klären' })],
        ausfuehrung: 'Reinigung läuft',
        abnahme: 'Qualitätskontrolle',
      }),
      kundendienstAblauf({ name: 'Einzelauftrag', vorOrt: 'Reinigung läuft', fertig: 'Qualitätskontrolle' }),
      wartungAblauf({ name: 'Unterhaltsreinigung', faellig: 'Reinigung fällig', ausfuehrung: 'Reinigung läuft', abnahme: 'Qualitätskontrolle' }),
      reklamationAblauf(),
    ],
    artikelgruppen: ['Reinigungsmittel', 'Verbrauch', 'Hygienepapier'],
    checklisten: [
      { name: 'Unterhaltsreinigung: Rundgang', arten: ['wartung', 'kundendienst'], punkte: ['Papierkörbe geleert', 'Sanitärbereiche gereinigt und aufgefüllt', 'Böden gereinigt', 'Kontaktflächen abgewischt', 'Fenster und Türen verschlossen', 'Licht aus'] },
      { name: 'Qualitätskontrolle', arten: ['wartung', 'projekt'], punkte: ['Sichtprüfung je Bereich', 'Mängel fotografiert', 'Nachreinigung erledigt', 'Kunde informiert'] },
    ],
    felder: [
      { objekt: 'orte', schluessel: 'reinigungsflaeche', label: 'Reinigungsfläche', typ: 'zahl', einheit: 'm²' },
      { objekt: 'orte', schluessel: 'bodenbelag', label: 'Bodenbelag', typ: 'auswahl', optionen: ['Teppich', 'PVC/Linoleum', 'Fliese', 'Parkett/Laminat', 'Naturstein', 'Gemischt'] },
      { objekt: 'orte', schluessel: 'intervall', label: 'Reinigungsintervall', typ: 'auswahl', optionen: ['täglich', 'mehrmals pro Woche', 'wöchentlich', '14-tägig', 'monatlich'] },
      { objekt: 'orte', schluessel: 'schluessel', label: 'Schlüssel beim Betrieb', typ: 'ja_nein' },
      { objekt: 'orte', schluessel: 'zugangszeiten', label: 'Zugangszeiten', typ: 'text' },
      { objekt: 'aufmasse', schluessel: 'glasflaeche', label: 'Glasfläche', typ: 'zahl', einheit: 'm²' },
    ],
    dokumente: [...DOKUMENTE, 'Leistungsverzeichnis', 'Reinigungsplan', 'Schlüsselquittung'],
    schulungen: [...SCHULUNGEN, { name: 'Unterweisung Reinigungsmittel und Gefahrstoffe', intervallMonate: 12 }],
    // Unterhaltsreinigung ist wiederkehrend – nach jeder Reinigung nach einer Bewertung zu fragen, nervt
    automationen: { an: [], aus: ['bewertungen.vorbereiten'] },
    planung: { wetterabhaengig: false, zweiPersonen: false, ganzeTage: false, regeln: ['Feste Touren je Objekt und Wochentag', 'Zugangszeiten des Objekts beachten', 'Bei Ausfall gleich Vertretung einplanen'] },
    heute: ['einsaetze', 'braucht-dich', 'material', 'rechnungen'],
  },
];

/** Alle Vorlagen: Gewerke und Fachrichtungen */
export const VORLAGEN: Vorlage[] = [...GEWERKE, ...FACHRICHTUNGEN];

/** Vorlage zu einer ID (Gewerk oder Fachrichtung); unbekannt → „Anderes Gewerk“ */
export function vorlage(id: VorlageId | string | undefined): Vorlage {
  return VORLAGEN.find((v) => v.id === id) ?? gewerkVorlage('sonstiges');
}

/** Fachrichtungen, die zu einem Basis-Gewerk passen (fürs Onboarding: „Was ist euer Schwerpunkt?“) */
export function fachrichtungenFuer(g: Gewerk | undefined): Fachrichtung[] {
  return FACHRICHTUNGEN.filter((f) => f.gewerk === g);
}

/**
 * Welche Vorlage gilt? Gespeicherte Fachrichtung, wenn sie zum Gewerk des Betriebs passt, sonst das Gewerk.
 * `fachrichtung` liegt in der Einstellung `betrieb.vorlage` (siehe `VORLAGE_KEY`).
 */
export function vorlageFuer(gewerk: Gewerk | undefined, fachrichtung?: string): Vorlage {
  const f = FACHRICHTUNGEN.find((x) => x.id === fachrichtung && x.gewerk === gewerk);
  return f ?? gewerkVorlage(gewerk ?? 'sonstiges');
}

/** Einstellung, in der die gewählte Fachrichtung steht */
export const VORLAGE_KEY = 'betrieb.vorlage';

/** Feldvorlagen einer Vorlage, optional nur für ein Objekt (für die Felder-Engine) */
export function felderFuer(v: Vorlage, objekt?: string): FeldVorlage[] {
  return objekt ? v.felder.filter((f) => f.objekt === objekt) : v.felder;
}

/** Passender Ablauf einer Vorlage für eine Auftragsart (sonst der erste) */
export function ablaufVorlageFuer(v: Vorlage, art: Auftragsart): AblaufVorlage {
  return v.ablaeufe.find((a) => a.arten.includes(art)) ?? v.ablaeufe[0];
}

export const ARBEITSWEISEN: { id: Arbeitsweise; label: string; text: string }[] = [
  { id: 'kundendienst', label: 'Kundendienst', text: 'Viele kurze Einsätze, Störungen, Reparaturen' },
  { id: 'baustelle', label: 'Baustelle', text: 'Projekte über Tage oder Wochen' },
  { id: 'werkstatt', label: 'Werkstatt', text: 'Fertigung im eigenen Betrieb, Montage beim Kunden' },
  { id: 'wartung', label: 'Wartung', text: 'Wiederkehrende Prüfungen und Wartungen' },
];
