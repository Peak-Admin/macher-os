/**
 * Gewerk-Vorlagen fürs Onboarding: typische Leistungen, Material, Qualifikationen,
 * Anlagentypen und Begriffe. So startet niemand mit einer leeren Software.
 */
import type { Arbeitsweise, Einheit, Gewerk } from './objects';

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

export interface GewerkVorlage {
  id: Gewerk;
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

const gemeinsamQuali = [
  { name: 'Erste Hilfe', kategorie: 'pflicht' as const, gueltigMonate: 24 },
  { name: 'Arbeitsschutz-Unterweisung', kategorie: 'pflicht' as const, gueltigMonate: 12 },
  { name: 'Führerschein B', kategorie: 'fuehrerschein' as const },
  { name: 'Arbeiten auf Leitern und Gerüsten', kategorie: 'pflicht' as const, gueltigMonate: 12 },
];

export const GEWERKE: GewerkVorlage[] = [
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

export const gewerkVorlage = (g: Gewerk) => GEWERKE.find((x) => x.id === g) ?? GEWERKE[GEWERKE.length - 1];

export const ARBEITSWEISEN: { id: Arbeitsweise; label: string; text: string }[] = [
  { id: 'kundendienst', label: 'Kundendienst', text: 'Viele kurze Einsätze, Störungen, Reparaturen' },
  { id: 'baustelle', label: 'Baustelle', text: 'Projekte über Tage oder Wochen' },
  { id: 'werkstatt', label: 'Werkstatt', text: 'Fertigung im eigenen Betrieb, Montage beim Kunden' },
  { id: 'wartung', label: 'Wartung', text: 'Wiederkehrende Prüfungen und Wartungen' },
];
