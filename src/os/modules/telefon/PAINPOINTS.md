# Telefon & Empfang – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Anruf während der Arbeit – Notiz auf Zettel, Zettel weg | 9 | 9 | 81 | C, M |
| 2 | Rückruf vergessen | 8 | 9 | 72 | C, B |
| 3 | Anrufer nicht erkannt, Kunde muss alles neu erzählen | 8 | 7 | 56 | B |
| 4 | Anrufnotiz erreicht den Zuständigen nicht | 7 | 8 | 56 | B |
| 5 | Erfassen dauert länger als das Gespräch | 8 | 7 | 56 | B |
| 6 | Notfall geht im Tagesgeschäft unter | 5 | 10 | 50 | B |
| 7 | Keine Ahnung, worum es beim letzten Anruf ging | 7 | 7 | 49 | B, C |
| 8 | Kein Überblick über offene Rückrufe | 7 | 7 | 49 | B |
| 9 | Aus einem Anruf wird nicht sauber eine Anfrage | 7 | 7 | 49 | B |
| 10 | Nummer des Anrufers nicht notiert | 6 | 8 | 48 | B, M |
| 11 | Rückruf überfällig, niemand merkt es | 6 | 8 | 48 | B |
| 12 | Am Handy umständlich zu erfassen | 8 | 6 | 48 | C, M |
| 13 | Gesprächsnotizen hängen nicht am Auftrag | 7 | 6 | 42 | B |
| 14 | Chef wird für jede Kleinigkeit ans Telefon geholt | 7 | 6 | 42 | C |
| 15 | Verpasste Anrufe (Mailbox) werden nicht nachgehalten | 6 | 7 | 42 | B |
| 16 | Wer ruft zurück, ist unklar | 6 | 7 | 42 | B |
| 17 | Kein Wissen, welche Aufträge der Anrufer gerade offen hat | 7 | 6 | 42 | B |
| 18 | Mehrfache Anrufe zum selben Thema ohne Verlauf | 6 | 6 | 36 | B |
| 19 | Dringlichkeit nicht einschätzbar für den Kollegen | 6 | 6 | 36 | B |
| 20 | Keine Telefonnummer zum Zurückrufen bei Aufgaben | 6 | 6 | 36 | B |
| 21 | Hausmeister/Mieter ruft an – keinem Kunden zuzuordnen | 5 | 6 | 30 | B |
| 22 | Neuer Anrufer wird nicht als Kunde angelegt | 6 | 5 | 30 | B |
| 23 | Anrufe zählen nicht in Auftragsverlauf | 5 | 5 | 25 | C |
| 24 | Sprachbarriere / unklare Anliegen | 3 | 5 | 15 | B |
| 25 | Mehrere Personen notieren denselben Anruf | 3 | 5 | 15 | B |

## Muss rein
- Gesprächsnotiz in Sekunden: Nummer → Anrufer erkannt (auch über Telefon vor Ort), Anliegen, Dringlichkeit, nächster Schritt
- Aus dem Anruf: neue Anfrage (Kunde automatisch), Rückruf-Aufgabe (mit Zuständigem) oder nur Notiz – gespeichert als `nachrichten` mit `kanal: 'telefon'`
- Offene Rückrufe mit Anrufen-Knopf und „Erledigt“ (rückgängig machbar)
- Schnell-Aktion „Anruf notieren“ im Schnell-erfassen-Blatt
- Hinweise: Rückruf überfällig (64) / dringender Rückruf heute (70)

## Macher erledigt automatisch
- Anruf wird automatisch an den einzigen offenen Auftrag des Anrufers gehängt (`telefon.zuordnen`)
- Erkennung offener Aufträge des Anrufers beim Tippen der Nummer

## Bewusst weggelassen (Pareto)
- Telefonanlagen-Anbindung/CTI und Anrufprotokoll (Schnittstellen)
- Sprachaufnahme/Transkription (Paket doku/macher)
- Callcenter-Funktionen (Warteschlangen)

---

# Telefonassistent (Macher nimmt Anrufe an) – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur, K = Kunde am Telefon.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Handy klingelt auf der Baustelle ins Leere, Anrufer legt auf und ruft den nächsten Betrieb an | 9 | 9 | 81 | C, M |
| 2 | Notfall (Rohrbruch, Gasgeruch, Heizung aus) erreicht niemanden oder zu spät | 4 | 10 | 40 | C, K |
| 3 | Mailbox ohne Nachricht: nur eine Nummer, kein Anliegen | 8 | 7 | 56 | C, B |
| 4 | Zurückrufen ins Blaue – erst Adresse und Anliegen klären | 8 | 6 | 48 | C, B |
| 5 | Abends aus dem Gedächtnis abtippen, was am Telefon besprochen wurde | 7 | 7 | 49 | C |
| 6 | Bereitschaft bekommt jeden Anruf, auch die Frage nach dem Angebot | 5 | 8 | 40 | M |
| 7 | Angst, dass ein Roboter Kunden vergrault oder etwas Falsches zusagt | 6 | 8 | 48 | C |
| 8 | Unklar, wann die KI rangeht und wann man selbst | 6 | 6 | 36 | C, B |
| 9 | Anrufer nicht als bestehender Kunde erkannt, Doppelanlage | 6 | 6 | 36 | B |
| 10 | Rechtliche Unsicherheit: KI-Hinweis, Aufzeichnung, Datenschutz | 5 | 7 | 35 | C |

Pain 2 ist niedrig in der Frequenz, aber der teuerste Fehler (Personen- und Sachschaden). Darum steht die
Notfall-Logik vor allem anderen und läuft zuerst über feste Regeln (Stichworte), nicht über ein Modell.

## Muss rein
- Annahmeregel: immer / wenn keiner rangeht (nach X Sekunden) / außerhalb der Geschäftszeiten / beides – Geschäftszeiten aus den Betriebsdaten, Feiertage frei (1, 8)
- Ansage nennt immer „digitaler Assistent“ – auch wenn die Begrüßung geändert wird (7, 10)
- Fragenliste (Anliegen, Name, Adresse, Dringlichkeit, Rückrufnummer, Erreichbarkeit), Reihenfolge per Knopf, Pflichtfragen fest (3, 4)
- Notfall-Stichworte editierbar; Notfall → Bereitschaft (Person + Weiterleitungsnummer) mit wichtiger Mitteilung (2, 6)
- Ergebnis als Anfrage, Rückruf oder Notiz in Telefon & Empfang, mit erkanntem Kunden und offenem Auftrag (3, 4, 5, 9)
- Keine Zusagen zu Preisen und Terminen, keine Kundendaten am Telefon, Sicherheitsanweisung bei Gas/Brand (2, 7)
- Probeanruf ohne Telefon: sehen, was im Eingang landen würde (7, 8)

## Macher erledigt automatisch
- Gesprächsergebnis → Anfrage/Rückruf/Notiz über den Macher AI Gateway (Automation `telefon.ki-anrufe`)
- Kunde an der Nummer erkennen, Anruf an den einzigen offenen Auftrag hängen, neuen Kunden mit Adresse anlegen
- Notfall per Stichwort erkennen (Regel vor KI), Bereitschaft benachrichtigen, Ereignis `anruf.notfall_weitergeleitet`
- Doppelt zugestellte Anrufe erkennen (Gesprächs-ID)

## Bewusst weggelassen (Pareto)
- Eigene Ansicht für KI-Anrufe – sie stehen in der vorhandenen Anrufliste
- Termine am Telefon vergeben, Preise nennen, Rechnungsauskünfte (Risiko, Pain 7)
- Mehrere Bereitschaftspläne/Schichten – eine Person + eine Nummer reicht für den Start
- Eigene Stimmen-/Sprachauswahl, mehrsprachige Ansage
