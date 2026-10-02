# Nachrichten – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: M = Monteur, B = Büro, C = Chef, K = Kunde.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Kundenkommunikation verstreut über WhatsApp, SMS, E-Mail, Telefon | 10 | 8 | 80 | B, C |
| 2 | Kunde wartet tagelang auf Antwort, weil Nachricht untergeht | 8 | 9 | 72 | C, K |
| 3 | Infos vom Monteur ans Büro gehen verloren („hab ich doch gesagt“) | 9 | 7 | 63 | B, M |
| 4 | Niemand weiß, was dem Kunden schon geschrieben wurde | 8 | 7 | 56 | B |
| 5 | Kollege im Urlaub – Verlauf auf seinem Privathandy | 6 | 8 | 48 | C |
| 6 | Immer gleiche Antworten neu tippen | 8 | 4 | 32 | B |
| 7 | Interne Kommentare landen versehentlich beim Kunden | 3 | 9 | 27 | B |
| 8 | Nachricht keinem Auftrag zugeordnet | 7 | 6 | 42 | B |
| 9 | Ungelesen/gelesen nicht erkennbar | 7 | 5 | 35 | B |
| 10 | Telefonate nicht dokumentiert | 7 | 6 | 42 | B |
| 11 | Kunde schreibt an mehrere Mitarbeiter gleichzeitig | 5 | 5 | 25 | B |
| 12 | Kein Überblick: welche Kunden warten gerade? | 7 | 7 | 49 | C |
| 13 | Datenschutz: Kundendaten in privaten Messengern | 5 | 6 | 30 | C |
| 14 | Monteur braucht Material, schreibt in Gruppenchat, keiner reagiert | 6 | 6 | 36 | M |
| 15 | Nachricht an Kunden muss raus, aber Nummer nicht zur Hand | 6 | 5 | 30 | B, M |
| 16 | Anhänge (Fotos) vom Kunden nicht am Auftrag | 5 | 5 | 25 | B |
| 17 | Kunde fragt nach Termin, Antwort steckt im Kalender | 6 | 5 | 30 | B |
| 18 | Zu viele Benachrichtigungen | 5 | 4 | 20 | alle |
| 19 | Verlauf je Kunde über mehrere Aufträge | 4 | 5 | 20 | B |
| 20 | Unklar, über welchen Kanal der Kunde erreichbar ist | 5 | 4 | 20 | B |
| 21 | Antwortzeiten nicht messbar | 2 | 4 | 8 | C |
| 22 | Automatische Abwesenheitsnotiz | 2 | 3 | 6 | B |
| 23 | Rechtssichere Zustellung | 2 | 6 | 12 | C |
| 24 | Sprachnachrichten vom Kunden | 4 | 4 | 16 | B |
| 25 | Gruppenchats je Baustelle mit Subunternehmern | 3 | 5 | 15 | C |

## Muss rein
- Verlauf je Auftrag (und je Kunde ohne Auftrag), Posteingang `/auftraege/nachrichten` (1, 4, 5, 19).
- Intern und Kunde klar getrennt (Kennzeichnung je Nachricht, getrennte Auswahl beim Schreiben) (3, 7).
- Ungelesen-Zustand, Filter „Ungelesen“, Zähler im Tab (9, 11).
- Schnellantworten als Vorlage (6).
- Versand an Kunden als `mailto:`/`sms:`/WhatsApp-Link mit Kontaktdaten aus dem Kunden – ehrlich beschriftet, kein eigener Versanddienst (13, 15, 20).
- „Kunde hat geschrieben“: eingehende Nachrichten aus anderen Kanälen eintragen (1, 10).
- Tabs am Auftrag und am Kunden, Widget auf der Seite Aufträge nur bei Ungelesenem.

## Macher erledigt automatisch
- Hinweis „Kunde wartet auf Antwort“ (nach 4 Stunden dringender) (2, 12).
- Kundennachrichten ohne Auftrag werden dem einzigen offenen Auftrag des Kunden zugeordnet (Automation `nachrichten.zuordnen`) (8).
- Beim Öffnen eines Verlaufs werden neue Nachrichten als gelesen markiert.

## Bewusst weggelassen
- Echter Versand/Empfang (E-Mail-/SMS-/WhatsApp-Schnittstelle), Anhänge, Antwortzeit-Statistik, Gruppenchats mit Externen (16, 21–25).
