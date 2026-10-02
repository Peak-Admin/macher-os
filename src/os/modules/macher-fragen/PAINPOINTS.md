# Macher fragen – Top 25 Pain Points

Score = Frequenz (1–10) × Intensität (1–10).

| # | Pain Point | Freq. | Int. | Score | Betroffen |
|---|---|---|---|---|---|
| 1 | Monteur am Handy findet Adresse/Hinweise zur Baustelle nicht schnell | 9 | 8 | 72 | Monteur |
| 2 | Info steckt in fünf Listen – „Was steht morgen an?“ braucht drei Klicks pro Bereich | 9 | 8 | 72 | Chef, Büro |
| 3 | „Wer hat nächste Woche Zeit?“ – Kapazität im Kopf des Chefs | 8 | 8 | 64 | Chef, Büro |
| 4 | „Welche Rechnungen sind offen?“ – Überblick nur über Excel/Steuerberater | 7 | 9 | 63 | Chef, Büro |
| 5 | Aufgabe zwischen Tür und Angel vergeben, landet nirgends | 9 | 7 | 63 | Chef, Monteur |
| 6 | Was braucht mich heute? – Prioritäten unklar | 8 | 7 | 56 | Chef |
| 7 | Neue Anfragen bleiben liegen | 7 | 8 | 56 | Büro |
| 8 | Kunde ruft an, Büro muss ihn erst suchen, Auftrag öffnen, Termin prüfen | 8 | 7 | 56 | Büro |
| 9 | KI-Antworten ohne Quelle – man traut ihnen nicht | 6 | 9 | 54 | Chef |
| 10 | Wo ist Kollege X gerade? Ständige Anrufe | 8 | 6 | 48 | Büro, Chef |
| 11 | Tippen mit Handschuhen – lange Formulare | 8 | 6 | 48 | Monteur |
| 12 | Offene Angebote vergessen nachzufassen | 6 | 8 | 48 | Chef |
| 13 | Monteur sieht Daten, die ihn nichts angehen (Preise, Krankheit) | 5 | 9 | 45 | Chef |
| 14 | Meine Aufgaben über mehrere Aufträge verteilt | 7 | 6 | 42 | Monteur |
| 15 | Leere KI-Fläche – man weiß nicht, was man fragen soll | 7 | 6 | 42 | alle |
| 16 | KI führt Dinge aus, ohne zu fragen | 4 | 10 | 40 | Chef, Büro |
| 17 | Suche liefert nichts → Sackgasse | 6 | 6 | 36 | alle |
| 18 | Antworten zu lang, Fachchinesisch | 6 | 6 | 36 | alle |
| 19 | Urlaubsanträge in der Kapazität nicht berücksichtigt | 5 | 7 | 35 | Chef |
| 20 | Kein Rückweg, wenn KI falsch verstanden hat | 5 | 7 | 35 | alle |
| 21 | Datum „bis Freitag“ muss man umständlich im Kalender eintippen | 7 | 5 | 35 | alle |
| 22 | Falscher Kunde bei ähnlichen Namen | 4 | 7 | 28 | Büro |
| 23 | Datenschutz: Kundendaten an Dritte | 3 | 9 | 27 | Chef |
| 24 | Verlauf weg, wenn man das Fenster schließt | 5 | 5 | 25 | Büro |
| 25 | Abhängigkeit von Cloud-KI/API-Kosten | 3 | 7 | 21 | Chef |

## Muss rein

- Feste Absichten: Termine/Agenda, offene Rechnungen, Angebote, Anfragen, Wo ist …, Wer hat Zeit, Braucht mich, Meine Aufgaben, Aufgabe anlegen; sonst Suche.
- Kurze Antwort + Liste mit Quellen-Links (`pfadZu`) + Grundlage/Stand.
- Aufgabe nur als Entwurf, editierbar, erst nach „Aufgabe anlegen“ ausgeführt; Status bleibt im Verlauf.
- Rechte über `darf()` (Geld, Schreiben, Personal).
- Beispielfragen als Einstieg, Folgefragen als Chips; Verlauf in `chat`.

## Macher erledigt automatisch

- Datumsangaben („bis Freitag“, „nächste Woche“, „am 12.10.“) automatisch auflösen.
- Freie Kapazität aus Wochenstunden, Terminen und Abwesenheiten schätzen.
- Keine Treffer in der Suche → Frage direkt an Macher übergeben.

## Bewusst weggelassen (Pareto)

- Freitext-KI/externes Modell (nur Schnittstelle `Sprachmodell` vorbereitet).
- Sprachein-/ausgabe, Ortung von Mitarbeitern (nur Einsatzplan).
- Ausführen weiterer Aktionen (Rechnung schreiben, Termin verschieben) – erst wenn die Besitzer-Module Aktionen anbieten.
