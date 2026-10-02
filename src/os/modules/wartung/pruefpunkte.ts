/**
 * Kurze Prüfpunkte je Anlagentyp. Werden beim Anlegen eines Wartungsauftrags
 * als Aufgaben am Auftrag angelegt (Quelle „wartung“) – abhakbar am Handy.
 * Bewusst knapp: das vollständige Prüfprotokoll gehört in Checklisten/Berichte.
 */
const PUNKTE: Record<string, string[]> = {
  // Elektro
  zählerschrank: ['Sichtprüfung auf Schäden und Verfärbungen', 'Klemmstellen nachziehen', 'RCD/FI auslösen (Prüftaste)', 'Isolationswiderstand messen', 'Beschriftung prüfen'],
  unterverteilung: ['Sichtprüfung auf Schäden und Verfärbungen', 'Klemmstellen nachziehen', 'RCD/FI auslösen (Prüftaste)', 'Schleifenimpedanz messen', 'Beschriftung prüfen'],
  wallbox: ['Gehäuse und Ladekabel auf Schäden prüfen', 'Schutzleiter und RCD prüfen', 'Testladung durchführen', 'Firmware-Stand prüfen'],
  'pv-anlage': ['Module und Befestigung sichtprüfen', 'Wechselrichter-Fehlerspeicher auslesen', 'Stringspannungen messen', 'DC-Steckverbinder prüfen', 'Ertrag mit Vorjahr vergleichen'],
  batteriespeicher: ['Fehlerspeicher auslesen', 'Lüftung und Umgebungstemperatur prüfen', 'Firmware-Stand prüfen', 'Ladezustand und Zyklen notieren'],
  sprechanlage: ['Alle Sprechstellen testen', 'Türöffner testen', 'Netzteil prüfen'],
  rauchmelder: ['Prüftaste an jedem Melder auslösen', 'Raucheindringöffnungen frei?', 'Batterie-/Lebensdauer prüfen', 'Ergebnis je Raum notieren'],
  // SHK
  gasheizung: ['Abgasmessung durchführen', 'Brenner und Wärmetauscher reinigen', 'Gasdichtheit prüfen', 'Anlagendruck prüfen und Wasser nachfüllen', 'Sicherheitsventil prüfen'],
  ölheizung: ['Abgasmessung durchführen', 'Düse und Ölfilter tauschen', 'Brenner reinigen und einstellen', 'Tank und Leitungen sichtprüfen', 'Anlagendruck prüfen'],
  wärmepumpe: ['Fehlerspeicher auslesen', 'Außeneinheit und Verdampfer reinigen', 'Kondensatablauf prüfen', 'Anlagendruck prüfen', 'Heizkurve mit Kunde abstimmen'],
  klimaanlage: ['Filter reinigen oder tauschen', 'Kondensatablauf prüfen', 'Kältemittel-Dichtheit prüfen', 'Ausblastemperatur messen'],
  warmwasserspeicher: ['Schutzanode prüfen', 'Speicher entkalken', 'Sicherheitsventil prüfen', 'Temperatur Legionellenschutz prüfen'],
  enthärtungsanlage: ['Salzvorrat auffüllen', 'Resthärte messen', 'Regeneration auslösen', 'Filter spülen'],
  solarthermie: ['Frostschutz messen', 'Anlagendruck prüfen', 'Pumpe und Regelung testen', 'Kollektoren sichtprüfen'],
  // Dach
  steildach: ['Eindeckung auf lose/gebrochene Ziegel prüfen', 'Anschlüsse und Kehlen prüfen', 'Schneefang prüfen'],
  flachdach: ['Abdichtung auf Blasen und Risse prüfen', 'Abläufe und Notüberläufe reinigen', 'Attika und Anschlüsse prüfen'],
  dachfenster: ['Dichtungen prüfen', 'Beschläge schmieren', 'Eindeckrahmen prüfen'],
  dachrinne: ['Rinne und Fallrohre reinigen', 'Halter und Gefälle prüfen', 'Laubfang prüfen'],
  blitzschutz: ['Fangleitungen sichtprüfen', 'Verbindungen prüfen', 'Erdungswiderstand messen'],
  // Maler, Tischler, Metall, Garten …
  fassade: ['Risse und Abplatzungen dokumentieren', 'Algen-/Pilzbefall prüfen', 'Fotos von Schadstellen'],
  fenster: ['Beschläge schmieren und einstellen', 'Dichtungen prüfen', 'Entwässerung frei machen'],
  haustür: ['Beschläge und Schloss schmieren', 'Dichtungen prüfen', 'Schließfunktion einstellen'],
  tor: ['Antrieb und Endlagen prüfen', 'Sicherheitseinrichtungen (Lichtschranke) testen', 'Federn und Seile prüfen', 'Lager schmieren'],
  bewässerungsanlage: ['Leitungen auf Lecks prüfen', 'Düsen reinigen', 'Steuerung programmieren', 'Winterfest machen / in Betrieb nehmen'],
  teich: ['Pumpe und Filter reinigen', 'Wasserstand prüfen', 'Pflanzen zurückschneiden'],
};

const ALLGEMEIN = ['Sichtprüfung auf Schäden', 'Funktion prüfen', 'Mängel mit Foto dokumentieren'];

export function pruefpunkte(anlagentyp: string): string[] {
  return PUNKTE[anlagentyp.trim().toLowerCase()] ?? ALLGEMEIN;
}
