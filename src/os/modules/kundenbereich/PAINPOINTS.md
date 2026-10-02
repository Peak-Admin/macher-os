# Kundenbereich – Pain Points

Score = Frequenz (1–10) × Intensität (1–10). Betroffen: C = Chef, B = Büro, M = Monteur, K = Kunde.

| # | Pain Point | F | I | Score | Wer |
|---|---|---|---|---|---|
| 1 | Kunde ruft an: „Wann kommt ihr?“ – Büro wird ständig unterbrochen | 9 | 7 | 63 | B, K |
| 2 | Angebot liegt beim Kunden, Annahme kommt per Telefon, ohne Nachweis | 7 | 8 | 56 | C, B |
| 3 | Angebot geht in der E-Mail unter, Kunde findet es nicht wieder | 6 | 7 | 42 | K, B |
| 4 | „Haben Sie meine Rechnung bekommen? Ist die bezahlt?“ | 6 | 5 | 30 | B, K |
| 5 | Fotos/Protokolle per WhatsApp verschickt, unsortiert | 6 | 6 | 36 | M, K |
| 6 | Kundennachrichten kommen über 5 Kanäle, gehen verloren | 7 | 7 | 49 | B |
| 7 | Kunde braucht Login/Passwort – macht er nicht | 8 | 6 | 48 | K |
| 8 | Link landet bei Falschen, keine Möglichkeit zu sperren | 2 | 9 | 18 | C |
| 9 | Kunde sieht interne Dinge (Entwürfe, interne Termine, Kalkulation) | 2 | 10 | 20 | C |
| 10 | Annahme eines abgelaufenen Angebots zu altem Preis | 3 | 7 | 21 | C |
| 11 | Wer hat angenommen? Mitarbeiter der Hausverwaltung ohne Namen | 4 | 7 | 28 | C, B |
| 12 | Büro weiß nicht, ob der Kunde den Link überhaupt geöffnet hat | 5 | 4 | 20 | B |
| 13 | Link für jeden Kunden manuell erzeugen und raussuchen | 6 | 4 | 24 | B |
| 14 | Kunde ist auf dem Handy, Seite unbedienbar | 8 | 6 | 48 | K |
| 15 | Abgelaufener/gesperrter Link zeigt Fehlerseite ohne Ausweg | 3 | 5 | 15 | K |
| 16 | Annahme kommt an, aber niemand im Büro merkt es | 5 | 8 | 40 | B |
| 17 | Kunde will kurz etwas sagen („Hund ist eingesperrt“), ruft dafür an | 6 | 4 | 24 | B, K |
| 18 | Nachricht des Kunden nicht dem richtigen Auftrag zugeordnet | 5 | 5 | 25 | B |
| 19 | Ablehnung ohne Rückmeldung – Angebot bleibt ewig offen | 5 | 5 | 25 | C |
| 20 | Kunde zahlt doppelt oder falschen Betrag (Betrag unklar) | 2 | 6 | 12 | B |
| 21 | Termin selbst buchen | 5 | 5 | 25 | K (→ plan/terminbuchung) |
| 22 | Online bezahlen | 4 | 5 | 20 | K (→ geld) |
| 23 | Abnahme/Unterschrift online | 3 | 6 | 18 | K (→ doku/abnahme) |
| 24 | Kunde wird von Mitarbeiter-Account aus „vertreten“ (Audit falsch) | 2 | 6 | 12 | C |
| 25 | Links laufen nie ab – Sicherheitsrisiko | 3 | 6 | 18 | C |

## Muss rein
- Vollbild-Route **`/k/:token`** ohne App-Navigation, mobil zuerst, gleiche Bausteine (7, 14).
- Termine (ohne interne), Angebote (ohne Entwürfe), Rechnungen mit Status als Text, Unterlagen nur mit `fuerKunde` (1, 3, 4, 5, 9).
- **Angebot annehmen/ablehnen mit Namensbestätigung** (Vor- + Nachname) → Status, Verlauf am Auftrag und Kunden, Event `angebot.angenommen`/`angebot.abgelehnt`, wichtige Benachrichtigung (2, 11, 16, 19). Abgelaufene Angebote nicht annehmbar (10).
- Nachricht schicken → `nachrichten` mit `kanal: 'portal'`, optional einem Auftrag zugeordnet (6, 17, 18).
- Token je Kunde, 90 Tage gültig, sperrbar, verlängerbar; letzter Zugriff sichtbar (8, 12, 25).
- Freundliche Fehlerseiten für unbekannte, gesperrte, abgelaufene Links mit Anruf-Knopf (15).
- Büro: Panel am Kunden „Link erzeugen und kopieren“, Übersicht aller Links (13).

## Macher erledigt automatisch
- Beim Versand eines Angebots (`angebot.versendet`) legt Macher einen Link an, falls keiner aktiv ist → Eintrag in „Erledigt“ (13).
- Ereignisse im Portal laufen ohne Mitarbeiter-Kennung (Audit zeigt den Kunden) (24).
- Bei Kunden-Zusammenführung werden Zugänge mitgenommen.

## Bewusst weggelassen
- Terminbuchung (21) → Paket plan; Online-Zahlung (22) → Paket geld; Abnahme/Unterschrift (23) → Paket doku.
- Login/Passwort: bewusst nicht – der geheime Link ist für Handwerkskunden der richtige Kompromiss.
