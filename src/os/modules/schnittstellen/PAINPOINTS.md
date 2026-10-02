# Pain Points – Schnittstellen

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Termine nicht im eigenen Handykalender | 8 | 6 | 48 | M,C |
| 2 | Steuerberater bekommt Daten im Schuhkarton | 6 | 8 | 48 | C,B |
| 3 | Großhandelspreise von Hand abtippen | 6 | 7 | 42 | B |
| 4 | Zahlungseingänge von Hand abgleichen | 7 | 6 | 42 | B |
| 5 | E-Mails zum Auftrag im Postfach verstreut | 8 | 5 | 40 | B |
| 6 | Bestellung im Shop des Großhändlers, dann nochmal im Programm | 5 | 5 | 25 | B |
| 7 | Adresse fehlt im Kalendertermin | 5 | 5 | 25 | M |
| 8 | Kundentelefon fehlt im Kalendertermin | 5 | 5 | 25 | M |
| 9 | Angst, Daten nicht mehr rauszubekommen (Lock-in) | 3 | 8 | 24 | C |
| 10 | Software verspricht Schnittstellen, die nicht gehen | 3 | 8 | 24 | C |
| 11 | Nicht klar, welche Schnittstelle geht | 4 | 5 | 20 | C |
| 12 | Kalenderexport mit kaputten Umlauten | 3 | 5 | 15 | B |
| 13 | Monteur soll nicht alle Termine exportieren | 3 | 5 | 15 | C |
| 14 | Abgesagte Termine tauchen auf | 3 | 5 | 15 | M |
| 15 | Datanorm-Dateien liegen ungenutzt rum | 3 | 5 | 15 | B |
| 16 | Export nur für Admin, sonst Datenleck | 2 | 7 | 14 | C |
| 17 | Ganztägige Termine falsch im Kalender | 3 | 4 | 12 | M |
| 18 | UGL-Lieferscheine von Hand | 3 | 4 | 12 | B |
| 19 | Doppelte Termine nach erneutem Import | 3 | 4 | 12 | M |
| 20 | Export enthält Gelöschtes und Interna | 2 | 5 | 10 | B |
| 21 | IT-Dienstleister braucht Daten für Auswertung | 2 | 5 | 10 | C |
| 22 | FinTS-Einrichtung zu kompliziert | 2 | 5 | 10 | B |
| 23 | Kein Wissen, wann zuletzt exportiert | 3 | 3 | 9 | B |
| 24 | Dateinamen ohne Datum | 3 | 2 | 6 | B |
| 25 | JSON unverständlich (Cent, IDs) | 2 | 3 | 6 | B |

## Muss rein
- Ehrliche Übersicht DATEV, Großhandel (IDS/Datanorm/UGL), Bank (CSV/FinTS), Kalender, E-Mail – „verfügbar“ oder „geplant“
- ICS-Export (RFC 5545: Escaping, Zeilenfaltung UTF-8-sicher, Ganztag, Status) für alle/einzelne Mitarbeiter, ab heute oder alle – mit Kunde, Telefon, Ort, Team, Zugangshinweis
- JSON-Datenexport ohne Papierkorb und Interna, nur mit Recht „Einstellungen“
- DATEV verlinkt auf das Modul Steuerberater & DATEV, sobald es existiert

## Macher erledigt automatisch
- Stabile UIDs je Termin → erneuter Import aktualisiert statt doppelt
- Protokoll „zuletzt exportiert“

## Bewusst weggelassen (Pareto)
- Kalender-Abo-URL (braucht Server)
- Echte DATEV-/IDS-/FinTS-Anbindung
- E-Mail-Postfach-Anbindung

## Integration Hub (Delta 8)
- Connector-Registry (`connectoren.ts`): Bank, Buchhaltung (DATEV, Lexware), Großhandel (DATANORM, IDS Connect, OCI, UGL,
  SHK Connect), Ausschreibungen (GAEB), Kalender (Datei, Google, Microsoft), E-Mail & Telefon, Plattform (Datenexport,
  Webhooks, API). Je Connector: Verbindungsart (Datei / über Integrationspartner per OAuth / Zugangsschlüssel / eingebaut),
  Fähigkeiten, Status als Text (verbunden / nicht verbunden / Fehler / geplant). Zustand je Connector in `anbindungen`.
- Ruhige Kartenliste „Verbinden“; Technisches (Formate, Versionen, Adressen) hinter „Weitere Optionen“.
- DATANORM 4/5 (Satzarten A/B, CP850) → Artikel über `artikelImportieren` (kein Doppeln).
- GAEB DA XML X83/X84 → Positionen in den Angebotsentwurf des Auftrags (Titel als Text, Bedarf/Wahl optional).
- Webhooks gegen die lokale Schnittstelle `WebhookQuelle` (`webhooks.ts`), anschließbar an den Kern-Katalog.
