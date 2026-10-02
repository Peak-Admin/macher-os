# Einwände von Handwerkern gegen Software

Woran wir Verkaufsargumente festmachen: Startseite (Abschnitt „Bedenken“), Anmeldung (`/os/willkommen`),
Vertrauensreihe (`TrustRow`), Footer, Preise, FAQ. Ein Satz kommt nur dorthin, wenn er einen Einwand aus dieser Liste
beantwortet **und** heute stimmt.

Texte im Code: `src/content/einwaende.ts` (Kernängste, alle Einwände mit Antwort), `src/os/core/vertrauen.ts`
(blauer Vertrauenskasten, gemeinsam für Website und Software).

## Woher die Stärke kommt

Stärke 1–100 ist die Einschätzung des Produktteams (Oktober 2026). Wo eine Zahl aus einer Studie dabei steht, stammt sie aus
Bitkom Research 2025, „Digitalisierung des Handwerks“, 504 Handwerksbetriebe, Mehrfachnennungen
([Studienbericht, PDF](https://www.bitkom.org/sites/main/files/2026-01/bitkom-studienbericht-handwerk.pdf), Abb. 19).
Gefragt wurde dort nach Hemmnissen der Digitalisierung, nicht nach einer bestimmten Software.
Ältere Pain Scores (Häufigkeit × Schwere) stehen in [prd-setup-bis-paid.md](prd-setup-bis-paid.md).

Prüfen und ersetzen, sobald wir echte Daten haben: Gespräche mit Betrieben, Kündigungsgründe in „Dein Plan“, Abbrüche in der Einrichtung (`setup.schritt`).

## Die fünf Kernängste

| Kernangst | Stärke | Was Macher OS vermitteln muss | Wo |
|---|---:|---|---|
| „Das kostet mich Zeit.“ | 100 | In wenigen Minuten startklar. | Startseite, Anmeldung |
| „Das ist kompliziert.“ | 99 | Du musst keine Software lernen. | Startseite, Anmeldung |
| „Das macht zusätzliche Arbeit.“ | 97 | Weniger doppelt eingeben. Weniger Büro. | Startseite |
| „Meine Leute nutzen das nicht.“ | 95 | So einfach wie eine Nachricht aufs Handy. | Startseite, Schritt „Team“ |
| „Ich weiß nicht, ob es mir etwas bringt.“ | 94 | Erst der Nutzen, dann der Rest: erstes echtes Angebot direkt nach dem Start. | Startseite |

„So einfach wie WhatsApp“ nennen wir bewusst nicht beim Namen: fremde Marke, wir wollen nicht mit ihrem Ruf werben.

## Alle Einwände

| Rang | Einwand | Stärke | Unsere Antwort (Kurzform) | Beleg im Produkt |
|---:|---|---:|---|---|
| 1 | „Ich hab keine Zeit, mich da jetzt reinzufuchsen.“ | 100 | Einrichtung in wenigen Minuten, Vorlagen je Gewerk | 5 Schritte, `gewerke.ts`. Bitkom: 72 % „zu viel zu tun“ |
| 2 | „Das ist mir bestimmt wieder zu kompliziert.“ | 98 | Eine Frage pro Schritt, Handwerkersprache | Einrichtung `/willkommen` |
| 3 | „Bis ich das eingerichtet habe, mache ich's lieber wie bisher.“ | 97 | Fünf kurze Schritte, danach direkt das erste Angebot | `zielNachSetup()` |
| 4 | „Meine Leute benutzen das am Ende sowieso nicht.“ | 96 | Link per SMS, kein Passwort, nur der eigene Einsatz | Schritt „Team“, Mitarbeiter-App |
| 5 | „Bei uns funktioniert es doch auch so.“ | 95 | Bis eine Rechnung liegen bleibt – Macher erinnert | Hinweise, Mahnungen |
| 6 | „Ich will nicht noch ein Programm.“ | 95 | Eins statt fünf | Alle Module in einem OS |
| 7 | „Dann muss ich alles doppelt pflegen.“ | 94 | Angebot → Auftrag → Rechnung, nichts zweimal | `angebote`, `rechnungen` |
| 8 | „Was passiert mit meinen Daten?“ | 94 | DSGVO, Server in Frankfurt, Export jederzeit | Siehe „Datensicherheit“ unten. Bitkom: 96 % Bedenken |
| 9 | „Ich will jetzt nicht alle Kunden und Projekte da reinziehen.“ | 93 | Mit dem nächsten Auftrag anfangen, Kunden später holen | Import Excel/CSV, Lexware, sevDesk, Kontakte |
| 10 | „Und wenn ich nach zwei Wochen merke, dass es nichts taugt?“ | 92 | Test endet von selbst, keine Kreditkarte, Daten mitnehmen | `abo`: Lesemodus, Export |
| 11 | „Was bringt mir das konkret?“ | 91 | Angebote vom Handy, Rechnungen am selben Tag, Tagesplan | `start`, `rechnungen`, `mein-tag` |
| 12 | „Das passt bestimmt nicht zu unserem Betrieb.“ | 90 | Gewerk wählen, alles änderbar | Gewerk-Vorlagen |
| 13 | „Wir sind dafür viel zu klein.“ | 89 | Solo-Plan für 1–2 Leute, alles drin | `abo/plaene.ts`. Bitkom: 59 % |
| 14 | „Meine Mitarbeiter verstehen das nicht.“ | 88 | Jeder sieht nur, was er braucht | Rechte und Rollen. Bitkom: 58 % |
| 15 | „Was kostet mich das nachher wirklich?“ | 87 | Fester Preis nach Teamgröße, keine Zusatzmodule | `preise.ts`. Bitkom: 69 % |
| 16 | „Kann das überhaupt das, was wir brauchen?“ | 86 | Mit echtem Auftrag testen oder Spielwiese | Spielwiese |
| 17 | „Funktioniert das mit DATEV / meiner Buchhaltung / meinem Kalender?“ | 85 | DATEV-Export, Termine als Kalenderdatei | Module `datev`, `kalender` |
| 18 | „Ich will nicht alles umstellen.“ | 84 | Mit einem Teil anfangen | – |
| 19 | „Dann bin ich von dem Anbieter abhängig.“ | 80 | Monatlich kündbar, Export immer kostenlos | `abo` |
| 20 | „Ich bin einfach kein Computer-Mensch.“ | 79 | Handy zuerst, große Knöpfe, Hilfe auf Deutsch | UX-Spezifikation. Bitkom: 42 % |
| 21 | „Auf der Baustelle funktioniert sowas doch sowieso nicht richtig.“ | 77 | Zeiten, Fotos, Material, Unterschrift ohne Netz | Offline-Sync |
| 22 | „Ich habe schon mal so eine Software probiert.“ | 76 | Mit dem echten Betrieb testen, ohne Vertrag | Testphase |
| 23 | „Nachher muss ich dafür erst eine Schulung machen.“ | 75 | Nein – Schritt für Schritt, Anleitungen im Hilfe-Center | Hilfe-Center |
| 24 | „Dafür brauche ich wieder irgendeinen ITler.“ | 73 | Browser und Handy, nichts installieren | Web-App |
| 25 | „Das sieht wieder nach Bürosoftware aus.“ | 70 | Gebaut für Baustelle und Büro | UX-Spezifikation |

## Anmeldung: vier Punkte im Markenkopf

`src/os/modules/onboarding/Willkommen.tsx` (`VORTEILE`), darunter der blaue Vertrauenskasten.

| Punkt | Beantwortet |
|---|---|
| Kostenlos starten – ohne Kreditkarte | #10, #15, #19, #22 |
| In wenigen Minuten startklar | #1, #3 |
| Du musst keine Software lernen | #2, #20, #23 |
| Kostenlose Hilfe beim Einrichten | #20, #24 (Fragen zur Einrichtung ohne Aufpreis; die *persönliche Einrichtung* bleibt laut `preise-vergleich.ts` eine Zusatzleistung auf Anfrage) |

Keine Minutenzahl („in 2 Minuten“), solange `setup.fertig` sie nicht im Median belegt. Ziel laut PRD: unter 5 Minuten.

## Datensicherheit: der blaue Kasten

EU-Blau (`--color-eu` / `--mm-eu`, `#003399`) gibt es nur hier: im Website-Footer und im Markenkopf der Anmeldung.
Bewusst ohne EU-Sternenkranz – der würde wie ein offizielles Siegel wirken.

| Aussage | Stand |
|---|---|
| Server in Frankfurt | Datenbank: Supabase `eu-central-1` laut `docs/os/BACKEND.md` – im Supabase-Dashboard bestätigen. Server-Funktionen: `vercel.json` → `regions: ["fra1"]` (vorher `iad1`, USA). |
| DSGVO-konform | Vertrag zur Auftragsverarbeitung liegt als Text vor (`/auftragsverarbeitung`). **Vor dem Livegang:** Platzhalter in Datenschutzerklärung und AVV füllen (Hosting-Anbieter, Speicherdauer, Anlage TOM, Aufsichtsbehörde) und die Unterauftragsverarbeiter nennen. |
| KI nach EU AI Act | KI-Vorschläge sind gekennzeichnet („Vorschlag von Macher“), kritische Aktionen brauchen eine Bestätigung, alles steht im Protokoll (`docs/os/KI-GATEWAY.md`). Kein Zertifikat. Die KI-Anfragen gehen an Anthropic (USA) – das muss in der Datenschutzerklärung stehen. |

Bevor die Aussagen öffentlich laufen: einmal juristisch prüfen lassen.
