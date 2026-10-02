/**
 * Startartikel je Gewerk: echte Abläufe, die im Betrieb sonst nur im Kopf des Meisters stehen.
 * Bewusst allgemein gehalten – Herstellervorgaben und Normen gehen immer vor.
 */
import type { Gewerk } from '@core/objects';
import type { WissensArtikel } from './daten';

export type StartArtikel = Pick<WissensArtikel, 'titel' | 'kategorie' | 'text' | 'gewerk' | 'anlagentypen' | 'links'> & {
  /** Namen aus dem Leistungskatalog, werden beim Einrichten zu IDs */
  leistungNamen?: string[];
};

const ALLGEMEIN: StartArtikel[] = [
  {
    titel: 'Abnahme beim Kunden – so läuft sie',
    kategorie: 'Abläufe im Betrieb',
    text: `Die Abnahme ist der Moment, ab dem die Gewährleistung läuft und du die Schlussrechnung schreiben kannst. Nimm dir dafür Zeit.

## Vorher
- Arbeitsplatz aufräumen, Schutzfolien und Abfall mitnehmen
- Eigene Endkontrolle: Funktion, Optik, Vollständigkeit
- Fotos vom fertigen Zustand machen

## Mit dem Kunden
1. Gemeinsam durchgehen, was gemacht wurde
2. Bedienung erklären, Unterlagen und Garantiekarten übergeben
3. Offene Punkte oder Mängel ehrlich aufschreiben – mit Termin zur Erledigung
4. Abnahme unterschreiben lassen

**Wichtig:** Mängel, die der Kunde bei der Abnahme kennt, müssen im Protokoll stehen.`,
  },
  {
    titel: 'Arbeitsunfall – was jetzt zu tun ist',
    kategorie: 'Sicherheit',
    text: `## Sofort
1. Unfallstelle sichern, eigene Sicherheit zuerst
2. Erste Hilfe leisten
3. Bei schweren Verletzungen: **Notruf 112**
4. Chef bzw. Büro anrufen

## Danach
- Jede Verletzung ins Verbandbuch eintragen – auch kleine Schnitte
- Bei Behandlung beim Arzt: Durchgangsarzt (D-Arzt) aufsuchen
- Ist jemand mehr als drei Tage arbeitsunfähig, meldet das Büro den Unfall an die Berufsgenossenschaft
- Ursache besprechen, damit es nicht wieder passiert`,
  },
];

const JE_GEWERK: Partial<Record<Gewerk, StartArtikel[]>> = {
  elektro: [
    {
      titel: 'Die fünf Sicherheitsregeln',
      kategorie: 'Sicherheit',
      gewerk: 'elektro',
      anlagentypen: ['Zählerschrank', 'Unterverteilung', 'Wallbox', 'PV-Anlage', 'Batteriespeicher'],
      leistungNamen: ['Zählerschrank erneuern', 'FI-Schutzschalter nachrüsten', 'Störungssuche'],
      text: `Vor jeder Arbeit an elektrischen Anlagen – in dieser Reihenfolge:

1. Freischalten
2. Gegen Wiedereinschalten sichern
3. Spannungsfreiheit allpolig feststellen
4. Erden und kurzschließen
5. Benachbarte, unter Spannung stehende Teile abdecken oder abschranken

Nach der Arbeit in umgekehrter Reihenfolge aufheben. **Nie** auf Zuruf wieder einschalten.`,
    },
    {
      titel: 'Ablauf Wallbox-Installation',
      kategorie: 'Ausführung',
      gewerk: 'elektro',
      anlagentypen: ['Wallbox'],
      leistungNamen: ['Wallbox 11 kW installieren'],
      text: `## Vor dem Termin
- Wallbox beim Netzbetreiber anmelden (bis 11 kW anmelden, darüber Genehmigung einholen)
- Fotos vom Zählerschrank und Leitungsweg vom Kunden holen
- Platz im Zählerschrank und Hausanschluss prüfen

## Vor Ort
1. Leitungsweg mit dem Kunden festlegen
2. Leitung verlegen, Schutzeinrichtungen setzen (Fehlerstromschutz nach Herstellerangabe – Typ B oder Typ A mit DC-Fehlerstromerkennung in der Wallbox)
3. Wallbox montieren und anschließen
4. Messen und prüfen, Prüfprotokoll ausfüllen
5. Wallbox in Betrieb nehmen, ggf. App einrichten
6. Kunden einweisen, Fotos machen, Abnahme`,
      links: [
        { titel: 'Hager – Wallboxen und Verteiler', url: 'https://www.hager.de' },
        { titel: 'ABB – E-Mobilität', url: 'https://new.abb.com/de' },
      ],
    },
    {
      titel: 'Störung: Fehlerstromschutzschalter löst aus',
      kategorie: 'Störung',
      gewerk: 'elektro',
      anlagentypen: ['Zählerschrank', 'Unterverteilung'],
      leistungNamen: ['Störungssuche'],
      text: `1. Kunden fragen: Seit wann? Bei welchem Gerät? Bei Regen?
2. Alle Geräte im betroffenen Bereich ausstecken
3. FI wieder einschalten – hält er, Geräte einzeln wieder einstecken
4. Löst er ohne Geräte aus: Stromkreise einzeln abschalten und eingrenzen
5. Isolationswiderstand des betroffenen Stromkreises messen
6. Typische Ursachen prüfen: Feuchtigkeit in Außensteckdosen und Abzweigdosen, defekte Geräte (Waschmaschine, Herd, Wasserkocher), beschädigte Leitungen

Ergebnis und Messwerte im Bericht festhalten.`,
    },
    {
      titel: 'Wartung PV-Anlage',
      kategorie: 'Wartung',
      gewerk: 'elektro',
      anlagentypen: ['PV-Anlage', 'Batteriespeicher'],
      leistungNamen: ['PV-Anlage Wartung'],
      text: `- Ertragsdaten der letzten Monate mit dem Kunden ansehen – fällt etwas ab?
- Fehlerspeicher des Wechselrichters auslesen
- Sichtprüfung Module: Verschmutzung, Glasbruch, Verfärbungen
- Unterkonstruktion und Befestigung prüfen
- Leitungen, Stecker und Durchführungen prüfen
- Isolationswiderstand und Strangwerte messen
- Überspannungsschutz prüfen
- Prüfprotokoll erstellen, Kunden über Auffälligkeiten informieren`,
      links: [
        { titel: 'SMA – Wechselrichter', url: 'https://www.sma.de' },
        { titel: 'Fronius – Wechselrichter', url: 'https://www.fronius.com/de' },
      ],
    },
  ],
  shk: [
    {
      titel: 'Ablauf Wartung Gas-Brennwert',
      kategorie: 'Wartung',
      gewerk: 'shk',
      anlagentypen: ['Gasheizung'],
      leistungNamen: ['Heizungswartung Gas-Brennwert'],
      text: `Immer die Wartungsanleitung des Herstellers beachten – die Reihenfolge hier ist der übliche Ablauf.

## Vorbereitung
1. Kunden nach Auffälligkeiten fragen (Geräusche, Störungen, Druckverlust)
2. Fehlerspeicher auslesen
3. Abgasmessung vor der Wartung

## Wartung
1. Gerät stromlos schalten, Gashahn schließen
2. Brenner ausbauen, Wärmetauscher reinigen
3. Zünd- und Überwachungselektrode prüfen, ggf. tauschen
4. Dichtungen nach Herstellervorgabe tauschen
5. **Siphon reinigen und mit Wasser befüllen** – sonst kann Abgas austreten
6. Wieder zusammenbauen, Gasdichtheit prüfen

## Abschluss
- Anlagendruck und Vordruck Ausdehnungsgefäß prüfen
- Abgasmessung nach der Wartung, Werte ins Protokoll
- Kunden kurz einweisen, nächsten Wartungstermin vorschlagen`,
      links: [
        { titel: 'Vaillant – Fachpartner', url: 'https://www.vaillant.de' },
        { titel: 'Viessmann – Fachpartner', url: 'https://www.viessmann.de' },
        { titel: 'Buderus – Fachpartner', url: 'https://www.buderus.de' },
      ],
    },
    {
      titel: 'Notdienst: Heizung geht nicht – Fragen am Telefon',
      kategorie: 'Störung',
      gewerk: 'shk',
      anlagentypen: ['Gasheizung', 'Ölheizung', 'Wärmepumpe'],
      text: `**Riecht es nach Gas?** Dann sofort: Haus verlassen, kein Licht schalten, kein Handy im Haus, Gasversorger-Notruf anrufen. Erst danach weiter.

Sonst fragen:
- Was zeigt das Display? Störungscode notieren
- Wie hoch ist der Anlagendruck?
- Ist Strom da, ist die Sicherung drin?
- Bei Öl: Ist Öl im Tank?
- Hat jemand am Thermostat oder an der Uhr etwas verstellt?

Oft hilft schon: Wasser nachfüllen oder Störung zurücksetzen. Klappt das nicht, Einsatz planen und Ersatzteil anhand des Codes vorher klären.`,
    },
    {
      titel: 'Wärmepumpe: jährliche Kontrolle',
      kategorie: 'Wartung',
      gewerk: 'shk',
      anlagentypen: ['Wärmepumpe'],
      leistungNamen: ['Wärmepumpe Wartung'],
      text: `- Laufzeiten, Taktung und Fehlerspeicher auslesen
- Außeneinheit: Laub und Schmutz entfernen, Kondensatablauf frei?
- Filter und Schmutzfänger im Heizkreis reinigen
- Anlagendruck und Ausdehnungsgefäß prüfen
- Heizkurve mit dem Kunden besprechen
- Kältekreis: Dichtheitsprüfung, wenn sie nach F-Gase-Verordnung für Kältemittel und Füllmenge vorgeschrieben ist – nur mit Sachkunde`,
    },
  ],
  maler: [
    {
      titel: 'Untergrund prüfen vor dem Streichen',
      kategorie: 'Ausführung',
      gewerk: 'maler',
      anlagentypen: ['Treppenhaus', 'Fassade'],
      leistungNamen: ['Wandflächen streichen, 2 Anstriche', 'Fassade streichen'],
      text: `Vier schnelle Proben, bevor du ein Angebot abschickst oder anfängst:

1. **Wischprobe:** Mit der Hand drüber – kreidet der Altanstrich?
2. **Kratzprobe:** Mit Spachtel kratzen – ist der Untergrund fest?
3. **Benetzungsprobe:** Wasser drauf – zieht es sofort ein, saugt der Untergrund stark
4. **Klebebandprobe:** Klebeband fest andrücken und ruckartig abziehen – hält der Altanstrich?

Ergebnis notieren und mit Fotos dokumentieren. Daraus folgt die Grundierung.`,
      links: [
        { titel: 'Caparol – Technische Infos', url: 'https://www.caparol.de' },
        { titel: 'Brillux – Technische Infos', url: 'https://www.brillux.de' },
      ],
    },
    {
      titel: 'Schimmel an der Wand – richtig vorgehen',
      kategorie: 'Ausführung',
      gewerk: 'maler',
      text: `- **Nicht einfach überstreichen.** Erst die Ursache klären: Lüftung, Wärmebrücke oder Feuchteschaden?
- Bei Verdacht auf Feuchteschaden: Kunden auf Fachfirma oder Gutachter hinweisen
- Schutzausrüstung tragen (Atemschutz, Handschuhe)
- Befall entfernen, Fläche behandeln, trocknen lassen
- Mit geeigneter Farbe nach Herstellerangabe streichen
- Kunden zu Lüften und Heizen beraten – schriftlich im Bericht festhalten`,
    },
  ],
  dach: [
    {
      titel: 'Absturzsicherung vor jedem Einsatz',
      kategorie: 'Sicherheit',
      gewerk: 'dach',
      anlagentypen: ['Steildach', 'Flachdach'],
      leistungNamen: ['Dachziegel neu eindecken', 'Sturmschaden sichern', 'Dachinspektion mit Bericht'],
      text: `Bevor jemand aufs Dach steigt, ist geklärt:

1. Welche Absturzsicherung? Gerüst mit Seitenschutz, Dachfanggerüst, Fangnetz oder persönliche Schutzausrüstung gegen Absturz
2. Wo sind die Anschlagpunkte?
3. Sind Lichtkuppeln und Dachfenster gesichert (durchsturzsicher abgedeckt)?
4. Wetter: kein Einsatz bei Sturm, Gewitter, Eis
5. Wer ist unten und kann im Notfall helfen?

PSA gegen Absturz nur mit Unterweisung und jährlicher Prüfung der Ausrüstung.`,
    },
    {
      titel: 'Dachrinne prüfen und reinigen',
      kategorie: 'Wartung',
      gewerk: 'dach',
      anlagentypen: ['Dachrinne'],
      leistungNamen: ['Dachrinne erneuern', 'Dachinspektion mit Bericht'],
      text: `- Laub und Schmutz entfernen, Fallrohre durchspülen
- Rinnenhalter auf festen Sitz prüfen
- Gefälle prüfen: steht Wasser in der Rinne?
- Stöße und Lötstellen auf Undichtigkeiten prüfen
- Laubfang oder Rinnenschutz anbieten, wenn Bäume in der Nähe stehen
- Fotos vorher/nachher für den Kunden`,
      links: [
        { titel: 'Braas – Technische Infos', url: 'https://www.braas.de' },
        { titel: 'Velux – Dachfenster', url: 'https://www.velux.de' },
      ],
    },
  ],
  tischler: [
    {
      titel: 'Fenstermontage: innen dichter als außen',
      kategorie: 'Ausführung',
      gewerk: 'tischler',
      anlagentypen: ['Fenster', 'Haustür'],
      text: `Grundregel für den Anschluss: **innen dichter als außen.**

- Innen: luftdichte Ebene (Folie oder Dichtband), damit keine feuchte Raumluft in die Fuge zieht
- Mitte: Dämmung der Fuge
- Außen: schlagregendicht, aber dampfdurchlässig

## Ablauf
1. Maße und Lot am Bau prüfen
2. Altes Element ausbauen, Laibung säubern
3. Dichtbänder anbringen, Element ausrichten und befestigen
4. Fuge dämmen, innen und außen abdichten
5. Funktion prüfen, Beschläge einstellen
6. Kunden in Bedienung und Pflege einweisen`,
    },
    {
      titel: 'Wartung Fenster und Haustür',
      kategorie: 'Wartung',
      gewerk: 'tischler',
      anlagentypen: ['Fenster', 'Haustür'],
      leistungNamen: ['Fenster einstellen'],
      text: `- Beschläge reinigen und an allen beweglichen Teilen ölen oder fetten
- Leichtgängigkeit prüfen, Flügel einstellen
- Dichtungen prüfen, bei Bedarf tauschen
- Entwässerungsöffnungen frei machen
- Oberfläche prüfen, Pflegehinweise geben`,
      links: [
        { titel: 'Roto – Beschläge', url: 'https://www.roto-frank.com/de' },
        { titel: 'Siegenia – Beschläge', url: 'https://www.siegenia.com/de' },
      ],
    },
  ],
  fliesen: [
    {
      titel: 'Abdichtung im Bad',
      kategorie: 'Ausführung',
      gewerk: 'fliesen',
      anlagentypen: ['Bad'],
      leistungNamen: ['Abdichtung Nassbereich', 'Wandfliesen verlegen', 'Bodenfliesen verlegen'],
      text: `1. Untergrund prüfen: fest, trocken, sauber
2. Grundieren nach Herstellerangabe
3. **Dichtband** in alle Ecken und Übergänge Wand/Boden
4. **Manschetten** an allen Durchdringungen (Rohre, Abläufe)
5. Abdichtung in zwei Lagen auftragen, Trocknungszeit einhalten
6. Fotos von der fertigen Abdichtung machen – später ist sie unter den Fliesen

Immer nur ein System eines Herstellers verwenden.`,
      links: [
        { titel: 'Schlüter-Systems', url: 'https://www.schlueter.de' },
        { titel: 'PCI – Technische Infos', url: 'https://www.pci-augsburg.de' },
      ],
    },
    {
      titel: 'Silikonfuge erneuern',
      kategorie: 'Wartung',
      gewerk: 'fliesen',
      anlagentypen: ['Bad', 'Küche'],
      leistungNamen: ['Silikonfuge erneuern'],
      text: `1. Alte Fuge komplett herausschneiden, Reste entfernen
2. Fugenflanken reinigen und entfetten, trocknen lassen
3. Bei Bedarf Rundschnur einlegen
4. Sanitärsilikon einbringen, glätten
5. Kunden sagen: Dusche erst nach der Aushärtezeit benutzen

Silikonfugen sind Wartungsfugen – darauf in Angebot und Abnahme hinweisen.`,
    },
  ],
  garten: [
    {
      titel: 'Bewässerung winterfest machen',
      kategorie: 'Wartung',
      gewerk: 'garten',
      anlagentypen: ['Bewässerungsanlage'],
      text: `- Wasserzufuhr absperren
- Leitungen entleeren bzw. mit Druckluft ausblasen
- Steuerung auf Winterbetrieb stellen, Batterien prüfen
- Pumpe und Filter reinigen und frostfrei lagern
- Defekte Regner und Tropfer notieren – Angebot fürs Frühjahr`,
      links: [{ titel: 'Gardena – Bewässerung', url: 'https://www.gardena.com/de' }],
    },
    {
      titel: 'Pflasterfläche herstellen – Ablauf',
      kategorie: 'Ausführung',
      gewerk: 'garten',
      anlagentypen: ['Pflasterfläche'],
      leistungNamen: ['Pflasterfläche herstellen'],
      text: `1. Leitungen klären (Strom, Wasser, Gas) bevor gegraben wird
2. Fläche abstecken, Gefälle vom Haus weg festlegen
3. Aushub, Tragschicht einbauen und verdichten
4. Bettung abziehen
5. Pflaster verlegen, Randsteine setzen
6. Fugen füllen, abrütteln, nachsanden
7. Fläche reinigen, Fotos machen`,
    },
  ],
  metall: [
    {
      titel: 'Tor-Wartung',
      kategorie: 'Wartung',
      gewerk: 'metall',
      anlagentypen: ['Tor'],
      leistungNamen: ['Tor-Wartung'],
      text: `Kraftbetätigte Tore müssen mindestens einmal im Jahr von einer sachkundigen Person geprüft werden.

- Sicherheitseinrichtungen prüfen: Lichtschranke, Schließkantensicherung, Notentriegelung
- Kraftbegrenzung prüfen
- Laufrollen, Führungen, Federn und Seile prüfen
- Bewegliche Teile schmieren
- Prüfbuch ausfüllen, Mängel mit Foto dokumentieren`,
      links: [{ titel: 'Hörmann – Tore', url: 'https://www.hoermann.de' }],
    },
    {
      titel: 'Geländer montieren',
      kategorie: 'Ausführung',
      gewerk: 'metall',
      anlagentypen: ['Geländer', 'Treppe'],
      leistungNamen: ['Geländer Stahl verzinkt'],
      text: `1. Untergrund prüfen: trägt er die Befestigung?
2. Befestigungsmittel passend zum Untergrund und mit Zulassung wählen
3. Ausrichten, befestigen, Lot und Höhe prüfen
4. Verzinkung an Schnitt- und Schweißstellen ausbessern
5. Festen Sitz prüfen, Fotos machen`,
    },
  ],
  bau: [
    {
      titel: 'Bautagebuch – was jeden Tag rein muss',
      kategorie: 'Abläufe im Betrieb',
      gewerk: 'bau',
      anlagentypen: ['Gebäude'],
      text: `- Wer war da (eigene Leute, Subunternehmer)?
- Wetter
- Was wurde gemacht, welche Lieferungen kamen?
- Behinderungen und Wartezeiten – mit Uhrzeit und Grund
- Anweisungen des Bauherrn oder der Bauleitung
- Fotos

Behinderungen schriftlich anzeigen – das Bautagebuch ist dein Nachweis.`,
      links: [{ titel: 'BG BAU – Arbeitsschutz', url: 'https://www.bgbau.de' }],
    },
    {
      titel: 'Mängel richtig dokumentieren',
      kategorie: 'Abläufe im Betrieb',
      gewerk: 'bau',
      text: `- Foto mit Übersicht und Detail
- Ort genau beschreiben (Geschoss, Raum, Achse)
- Was ist falsch, was wäre richtig?
- Wer hat es verursacht, wer beseitigt es bis wann?
- Erledigung ebenfalls mit Foto festhalten`,
    },
  ],
};

export function STARTARTIKEL(gewerk: Gewerk): StartArtikel[] {
  return [...(JE_GEWERK[gewerk] ?? []), ...ALLGEMEIN];
}
