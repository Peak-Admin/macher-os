/**
 * Startvorlagen für Checklisten – passend zum Gewerk aus dem Onboarding.
 * Kurz, praxisnah, Pflichtpunkte nur dort, wo es um Sicherheit, Nachweis oder Geld geht.
 */
import type { Auftragsart, Gewerk } from '@core/objects';

type P = [text: string, pflicht?: boolean, foto?: boolean];

export interface VorlageDef {
  name: string;
  beschreibung: string;
  gewerke?: Gewerk[];
  arten: Auftragsart[];
  automatisch: boolean;
  punkte: P[];
}

export const ALLGEMEIN: VorlageDef[] = [
  {
    name: 'Kundendienst-Einsatz',
    beschreibung: 'Vom Klingeln bis zum sauberen Abgang – damit nichts vergessen wird und die Rechnung stimmt.',
    arten: ['kundendienst', 'reklamation'],
    automatisch: true,
    punkte: [
      ['Anliegen mit dem Kunden vor Ort bestätigt', true],
      ['Arbeitsbereich abgedeckt und geschützt'],
      ['Foto vom Zustand vorher', false, true],
      ['Ursache gefunden und notiert', true],
      ['Arbeit erledigt und Funktion geprüft', true],
      ['Foto vom Zustand nachher', true, true],
      ['Verbrauchtes Material gebucht', true],
      ['Arbeitsplatz sauber hinterlassen', true],
      ['Kunde eingewiesen, offene Punkte besprochen'],
    ],
  },
  {
    name: 'Baustelle: Start',
    beschreibung: 'Vor dem ersten Handgriff: Zugang, Sicherheit und Ausgangszustand klären.',
    arten: ['projekt'],
    automatisch: true,
    punkte: [
      ['Zugang, Strom und Wasser geklärt', true],
      ['Gefährdungen geprüft, Bereich gesichert', true],
      ['Ausgangszustand und Vorschäden fotografiert', true, true],
      ['Material und Werkzeug vollständig'],
      ['Ansprechpartner vor Ort bekannt'],
    ],
  },
  {
    name: 'Baustelle: Abschluss und Übergabe',
    beschreibung: 'Bevor der Kunde abnimmt: Restarbeiten, Fotos, Ordnung, Unterlagen.',
    arten: ['projekt'],
    automatisch: true,
    punkte: [
      ['Restarbeiten erledigt, keine offenen Mängel', true],
      ['Fotos vom fertigen Zustand', true, true],
      ['Baustelle geräumt, Abfall entsorgt', true],
      ['Stunden und Material vollständig erfasst', true],
      ['Bedienungsanleitungen und Unterlagen übergeben'],
      ['Abnahmetermin mit dem Kunden vereinbart'],
    ],
  },
];

export const JE_GEWERK: Partial<Record<Gewerk, VorlageDef[]>> = {
  elektro: [
    {
      name: 'Erstprüfung nach DIN VDE 0100-600',
      beschreibung: 'Prüfung neuer oder geänderter Anlagen vor der Übergabe.',
      arten: ['projekt', 'kundendienst'],
      automatisch: false,
      punkte: [
        ['Besichtigen: Auswahl und Errichtung der Betriebsmittel geprüft', true],
        ['Durchgängigkeit der Schutzleiter gemessen', true],
        ['Isolationswiderstand gemessen', true],
        ['Schleifenimpedanz bzw. Abschaltbedingung geprüft', true],
        ['RCD ausgelöst, Auslösezeit und -strom gemessen', true],
        ['Drehfeld geprüft'],
        ['Verteiler beschriftet', false, true],
        ['Messwerte ins Prüfprotokoll übertragen', true],
      ],
    },
    {
      name: 'Wartung PV-Anlage',
      beschreibung: 'Jährliche Sicht- und Funktionsprüfung.',
      arten: ['wartung'],
      automatisch: true,
      punkte: [
        ['Module und Befestigung auf Schäden geprüft', false, true],
        ['Fehlerspeicher Wechselrichter ausgelesen', true],
        ['Isolationsmessung DC-Seite', true],
        ['Überspannungsschutz geprüft'],
        ['Ertrag mit Vorjahr verglichen'],
        ['Ergebnis mit dem Kunden besprochen'],
      ],
    },
  ],
  shk: [
    {
      name: 'Wartung Gas-Brennwertheizung',
      beschreibung: 'Wartung nach Herstellervorgabe mit Abgasmessung.',
      arten: ['wartung'],
      automatisch: true,
      punkte: [
        ['Typenschild fotografiert', false, true],
        ['Abgasmessung durchgeführt, Werte notiert', true],
        ['Brenner und Wärmetauscher gereinigt', true],
        ['Siphon gereinigt und befüllt', true],
        ['Anlagendruck geprüft, ggf. nachgefüllt', true],
        ['Vordruck Ausdehnungsgefäß geprüft'],
        ['Gasseitige Dichtheit geprüft', true],
        ['Wartungsprotokoll ausgefüllt', true],
      ],
    },
    {
      name: 'Druckprobe Trinkwasser',
      beschreibung: 'Dichtheitsprüfung vor dem Verschließen der Leitungen.',
      arten: ['projekt'],
      automatisch: false,
      punkte: [
        ['Leitungen gespült', true],
        ['Druckprobe nach Merkblatt durchgeführt', true],
        ['Manometer mit Prüfdruck fotografiert', true, true],
        ['Protokoll vom Kunden oder Bauleiter gegengezeichnet'],
      ],
    },
  ],
  maler: [
    {
      name: 'Untergrund und Vorbereitung',
      beschreibung: 'Ohne guten Untergrund keine gute Fläche.',
      arten: ['projekt', 'kundendienst'],
      automatisch: true,
      punkte: [
        ['Untergrund geprüft: tragfähig, trocken, sauber', true],
        ['Möbel und Böden abgedeckt', true],
        ['Fenster, Türen und Steckdosen abgeklebt'],
        ['Farbton mit dem Kunden bestätigt', true],
        ['Ausgangszustand fotografiert', false, true],
        ['Grundierung aufgetragen, wo nötig'],
      ],
    },
  ],
  dach: [
    {
      name: 'Dacharbeiten: Sicherheit',
      beschreibung: 'Vor jedem Einsatz auf dem Dach.',
      arten: ['projekt', 'kundendienst', 'wartung', 'reklamation'],
      automatisch: true,
      punkte: [
        ['Gerüst bzw. Absturzsicherung geprüft', true],
        ['Persönliche Schutzausrüstung vollständig', true],
        ['Wetter geprüft (Wind, Nässe)', true],
        ['Dachfläche vorher fotografiert', false, true],
      ],
    },
    {
      name: 'Dachwartung',
      beschreibung: 'Regelmäßige Kontrolle von Eindeckung und Entwässerung.',
      arten: ['wartung'],
      automatisch: true,
      punkte: [
        ['Eindeckung auf lose oder beschädigte Teile geprüft', true],
        ['Anschlüsse und Durchdringungen kontrolliert', true],
        ['Dachrinnen und Fallrohre gereinigt'],
        ['Mängel fotografiert', false, true],
        ['Ergebnis mit dem Kunden besprochen'],
      ],
    },
  ],
  tischler: [
    {
      name: 'Montage Fenster und Türen',
      beschreibung: 'Einbau nach Montagerichtlinie.',
      arten: ['projekt', 'kundendienst'],
      automatisch: true,
      punkte: [
        ['Maße vor Ort geprüft', true],
        ['Anschlussfuge innen luftdicht, außen schlagregendicht', true],
        ['Einbausituation fotografiert', true, true],
        ['Beschläge eingestellt, Funktion geprüft', true],
        ['Schutzfolien entfernt'],
        ['Pflegehinweise übergeben'],
      ],
    },
  ],
  fliesen: [
    {
      name: 'Fliesenarbeiten Nassbereich',
      beschreibung: 'Abdichtung ist Nachweis – Fotos sichern dich ab.',
      arten: ['projekt'],
      automatisch: true,
      punkte: [
        ['Untergrund eben und trocken', true],
        ['Abdichtung mit Dichtband in den Ecken', true, true],
        ['Fliesen auf gleiche Charge geprüft'],
        ['Fugenbild mit dem Kunden abgestimmt', true],
        ['Silikonfugen gezogen'],
        ['Fertige Fläche fotografiert', false, true],
      ],
    },
  ],
  garten: [
    {
      name: 'Pflege-Einsatz',
      beschreibung: 'Für Pflege- und Wartungseinsätze im Garten.',
      arten: ['wartung', 'kundendienst'],
      automatisch: true,
      punkte: [
        ['Leitungen und Kabel im Boden geklärt', true],
        ['Maschinen vor Einsatz geprüft', true],
        ['Foto vorher', false, true],
        ['Grünschnitt entsorgt'],
        ['Foto nachher', false, true],
      ],
    },
  ],
  metall: [
    {
      name: 'Montage Geländer und Stahlbau',
      beschreibung: 'Sichere Befestigung ist Pflicht.',
      arten: ['projekt'],
      automatisch: true,
      punkte: [
        ['Maße und Befestigungsuntergrund geprüft', true],
        ['Absturzsicherung bis zur Fertigstellung', true],
        ['Befestigungspunkte fotografiert', true, true],
        ['Schweißnähte und Verschraubungen kontrolliert', true],
        ['Korrosionsschutz ausgebessert'],
      ],
    },
  ],
  bau: [
    {
      name: 'Betonage',
      beschreibung: 'Vor und nach dem Betonieren.',
      arten: ['projekt'],
      automatisch: false,
      punkte: [
        ['Schalung geprüft', true],
        ['Bewehrung abgenommen und fotografiert', true, true],
        ['Lieferschein Beton geprüft (Festigkeitsklasse)', true],
        ['Nachbehandlung organisiert'],
      ],
    },
  ],
};

export function vorlagenFuer(gewerk: Gewerk | undefined): VorlageDef[] {
  return [...ALLGEMEIN, ...((gewerk && JE_GEWERK[gewerk]) || []).map((v) => ({ ...v, gewerke: [gewerk!] }))];
}
