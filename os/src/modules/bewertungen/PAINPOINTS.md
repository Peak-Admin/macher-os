# Bewertungen & Empfehlungen – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Nach guter Arbeit vergisst jeder, nach einer Bewertung zu fragen | 8 | 7 | 56 | C, B |
| 2 | Wenige Google-Bewertungen, Konkurrenz wird gefunden | 5 | 8 | 40 | C |
| 3 | Unzufriedener Kunde wird versehentlich um eine Bewertung gebeten → schlechte Bewertung | 2 | 10 | 20 | C |
| 4 | Kunde mit laufender Reklamation bekommt Bewertungsanfrage | 2 | 9 | 18 | C |
| 5 | Bewertungslink muss jedes Mal gesucht werden | 6 | 4 | 24 | B |
| 6 | Text für die Anfrage jedes Mal neu formulieren | 6 | 4 | 24 | B |
| 7 | Stammkunde wird nach jedem Kleinauftrag erneut gefragt – nervt | 4 | 6 | 24 | C |
| 8 | Keiner weiß, wer uns empfohlen hat – Dank bleibt aus | 6 | 6 | 36 | C |
| 9 | Beste Empfehler sind unbekannt | 4 | 6 | 24 | C |
| 10 | Wie zufrieden sind unsere Kunden wirklich? Nur Bauchgefühl | 5 | 6 | 30 | C |
| 11 | Rückmeldung am Telefon („war super“) geht verloren | 6 | 4 | 24 | B |
| 12 | Anfrage geht an Kunden ohne E-Mail ins Leere | 3 | 5 | 15 | B |
| 13 | Monteur soll vor Ort fragen – unangenehm, vergessen | 5 | 4 | 20 | M |
| 14 | Wer hat wann gefragt? Doppelte Anfragen aus Büro und Chef | 3 | 5 | 15 | B |
| 15 | Versuchung, Bewertungen zu schönen oder zu erfinden (rechtlich riskant) | 1 | 10 | 10 | C |
| 16 | Ohne Freigabe automatisch an jeden Kunden gesendet – Kontrollverlust | 3 | 7 | 21 | C |
| 17 | Bewertungsanfrage geht raus, bevor die Rechnung bezahlt ist | 3 | 5 | 15 | C |
| 18 | Antworten auf Bewertungen | 3 | 5 | 15 | C (→ später) |
| 19 | Empfehlungsprämie nachhalten | 2 | 5 | 10 | C |
| 20 | Negative Rückmeldung wird nicht an Reklamation weitergegeben | 3 | 7 | 21 | B (→ service) |
| 21 | Mehrere Plattformen (Google, MyHammer, Facebook) | 3 | 4 | 12 | C |
| 22 | Kunde aus Empfehlung wird nicht als solcher markiert | 5 | 5 | 25 | B |
| 23 | Zeitpunkt der Anfrage falsch (zu spät, Kunde hat vergessen) | 5 | 5 | 25 | B |
| 24 | Bewertungsquote unbekannt | 3 | 4 | 12 | C |
| 25 | Unterschiedliche Anrede privat/Firma | 4 | 3 | 12 | B |

## Muss rein
- **Automation:** Auftrag geht auf „erledigt“ → Anfrage wird vorbereitet → Hinweis zur Freigabe in Braucht dich mit Aktion `bewertung.anfragen` (1, 16, 23).
- Regeln: keine Reklamationen, keine doppelten Anfragen pro Auftrag, Kunde höchstens alle 180 Tage, nicht nach geäußerter Unzufriedenheit (3, 4, 7, 14).
- Einstellung **Google-Bewertungslink** + Vorschau des Anfragetexts (Du-Ansprache, Firmen mit Ansprechpartner) (5, 6, 25).
- Versand als ausgehende Nachricht (E-Mail, sonst SMS); fehlt beides, klarer Hinweis (12).
- **Interne Zufriedenheit** (1–5 + Notiz), nur was der Kunde selbst gesagt hat (10, 11).
- **Empfehlungen:** beim Anlegen „Wer hat euch empfohlen?“, Liste „Wer hat empfohlen?“ für Kunden mit Quelle Empfehlung, Rangliste der Empfehler, „Bedankt“ abhaken (8, 9, 22).
- Panels am Auftrag (Bewertung nach Abschluss) und am Kunden (Empfehlung & Zufriedenheit).
- **Keine erfundenen Bewertungen**: es werden keine Sterne/Bewertungen gespeichert oder erzeugt (15).

## Macher erledigt automatisch
- Bewertungsanfrage vorbereiten (Regel `bewertungen.vorbereiten`) → Eintrag in „Erledigt“.
- Hinweis „Wer hat X empfohlen?“ für Kunden mit Quelle Empfehlung ohne Empfehler.
- Bei Kunden-Zusammenführung werden Anfragen und Empfehlungen umgehängt.

## Bewusst weggelassen
- Abruf/Antwort auf Google-Bewertungen (18, 21, 24): braucht Schnittstelle → Paket unternehmen (Schnittstellen).
- Warten auf Zahlungseingang (17): kann als Regel ergänzt werden, sobald `zahlung.eingegangen` zuverlässig gefeuert wird.
- Weitergabe negativer Rückmeldung an Reklamationen (20) → Paket service.
- Prämien (19): selten, Notiz am Kunden reicht.
