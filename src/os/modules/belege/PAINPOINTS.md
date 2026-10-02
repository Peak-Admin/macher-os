# Eingangsrechnungen & Belege – Pain Points

| # | Pain Point | Wer | F | I | Score |
|---|---|---|---|---|---|
| 1 | Quittungen gehen im Fahrzeug verloren | Monteur, Büro | 9 | 8 | 72 |
| 2 | Skonto verpasst, weil Frist übersehen | Büro, Chef | 7 | 8 | 56 |
| 3 | Beleg keinem Auftrag zugeordnet → Nachkalkulation falsch | Büro, Chef | 8 | 8 | 64 |
| 4 | Lieferantenrechnung zu spät bezahlt, Mahngebühr | Büro | 5 | 7 | 35 |
| 5 | Abtippen von Betrag, Datum, Lieferant | Büro | 9 | 5 | 45 |
| 6 | Belege monatlich für den Steuerberater zusammensuchen | Büro | 8 | 6 | 48 |
| 7 | Foto zu groß, Speicher voll | Monteur | 6 | 4 | 24 |
| 8 | Unklar, welche Belege schon geprüft sind | Büro | 7 | 5 | 35 |
| 9 | Netto/USt-Aufteilung von Hand rechnen | Büro | 8 | 4 | 32 |
| 10 | Konditionen des Lieferanten stehen nur im Kopf | Büro | 6 | 5 | 30 |
| 11 | Monteur mit dreckigen Händen – Erfassung muss in Sekunden gehen | Monteur | 9 | 6 | 54 |
| 12 | Gleicher Lieferant, viele Baustellen → Zuordnung raten | Büro | 6 | 6 | 36 |
| 13 | Bezahlt-Status nicht gepflegt, doppelt überwiesen | Büro | 3 | 9 | 27 |
| 14 | PDF-Rechnungen aus dem Postfach landen nirgends | Büro | 7 | 5 | 35 |
| 15 | Tankbelege ohne Fahrzeugbezug | Büro | 6 | 3 | 18 |
| 16 | Kategorie (Material/Fahrzeug/…) fehlt für Auswertung | Chef | 6 | 4 | 24 |
| 17 | Belege ohne Rechnungsnummer | Büro | 5 | 3 | 15 |
| 18 | Unleserliche Fotos | Büro | 4 | 5 | 20 |
| 19 | Monteur sieht Einkaufspreise | Chef | 3 | 5 | 15 |
| 20 | Gelöschter Beleg nicht wiederherstellbar | Büro | 2 | 7 | 14 |
| 21 | Belege am Auftrag nicht sichtbar | Chef | 6 | 4 | 24 |
| 22 | Fälligkeiten nur im Ordner | Büro | 6 | 5 | 30 |
| 23 | Belege liegen wochenlang ungeprüft | Büro | 5 | 5 | 25 |
| 24 | Texterkennung (OCR) fehlt | Büro | 8 | 4 | 32 |
| 25 | Lieferant falsch geschrieben → doppelte Lieferanten | Büro | 5 | 3 | 15 |

| 26 | Unklar, wer eine Rechnung prüft und wer sie zur Zahlung freigibt | Büro, Chef | 7 | 6 | 42 |
| 27 | PDF liegt auf dem Rechner – erst ausdrucken oder abfotografieren | Büro | 8 | 4 | 32 |

## Muss rein
Schnell-Aktion „Beleg fotografieren“ (Foto wird verkleinert), wenige Felder (Lieferant, Datum, Brutto + Satz → Netto/USt),
Auftrag mit Vorschlag, Fristen, Tab „Belege“ am Auftrag.

**Arbeits-Inbox (10/2026, Vergleich Plancraft):** klarer Ablauf **Neu → Prüfen → Zuordnen → Freigeben → Bezahlt**
(#3, #8, #13, #23, #26). Der Kern-Status bleibt `neu` | `geprueft` | `bezahlt`; Zuordnen und Freigeben stehen in eigenen
Feldern (`geprueftAm`, `ohneAuftrag`, `freigegebenAm`, `bezahltAm`), Abbildung in `belegSchritt()`. Alte „geprüft“-Belege
ohne Prüfstempel gelten als zahlbereit – keine Migration nötig. Liste mit hellem Umschalter **Zu prüfen** (Standard) ·
**Freizugeben** · **Offen zu zahlen** · **Alle** (mit Zählern), Detail mit Schrittanzeige (Text je Schritt) und genau einer
grünen Hauptaktion für den nächsten Schritt; „Wer prüft?“ (Zuweisung) und Zahlstatus sichtbar. Jeder Schritt landet über
`belegAendern` im Verlauf. Freigeben und Bezahlt brauchen das Recht „Geld“.

**Ablage (#27, #14):** große Fläche „PDF hier ablegen oder fotografieren“ – Drag & Drop **und** Knöpfe „Datei wählen“ /
„Beleg fotografieren“ (Drag & Drop ist nie der einzige Weg). Jede Datei wird ein Beleg „Neu“ mit Dokument.

**E-Mail-Eingang (#14):** eigene Adresse `belege@<betrieb>.macher-os.de`, in der Ablage sichtbar und kopierbar.
Server-Eingang mit Tests (`src/os/server/belege-*.ts`): Anhänge PDF/JPG/PNG → Beleg „Neu“, Quelle E-Mail, Lieferant-Vorschlag
aus dem Absender (auch bei weitergeleiteten Mails). Die App sagt ehrlich „Noch nicht aktiv“, bis Mail-Dienst, DNS und
Schalter eingerichtet sind (`docs/os/BELEGE-EMAIL.md`).

## Macher erledigt automatisch
Eindeutige Belege dem Auftrag zuordnen (rückgängig machbar) · Zahlungsziel/Skonto aus den Lieferanten-Konditionen ·
neue Belege der einzigen Büro-Person zum Prüfen zuweisen · Hinweise „Skonto sichern“, „Lieferantenrechnung fällig“,
„Eingangsrechnungen freigeben“, „N Belege warten auf deine Prüfung“ · Sammelhinweis für ungeprüfte Belege.

## Bewusst weggelassen
- **OCR / Texterkennung** (#24): Betrag und Datum aus dem PDF lesen – erst mit dem KI-Gateway und echter Genauigkeit;
  bis dahin tippt das Büro beim Prüfen zwei Felder.
- **Mehrstufige Freigabe** (Betragsgrenzen, Vier-Augen-Prinzip): eine Freigabe durch Chef oder Büro reicht im Handwerk.
- **Zahlungsausgang / Überweisung** aus Macher und **DATEV-Export** (Paket zahlen).
- **Eigenes Postfach abrufen** (IMAP/Outlook-Anbindung): Weiterleiten an die Belege-Adresse genügt.
- **Resend-Anhänge nachladen**: Der Server nimmt Anhänge mit Inhalt (Postmark) oder Download-Link; reine Metadaten nicht.
