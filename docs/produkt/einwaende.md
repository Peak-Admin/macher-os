# Einwände von Handwerkern gegen Software

Woran wir Verkaufsargumente festmachen: Anmeldung (`/os/willkommen`), Vertrauensreihe der Website (`TrustRow`),
Preise, FAQ. Ein Satz kommt nur dorthin, wenn er einen Einwand aus dieser Liste beantwortet **und** heute stimmt.

**Pain Score = Häufigkeit × Schwere (je 1–10, also 1–100).** So wie in der Constitution und im
[PRD Setup → Paid](prd-setup-bis-paid.md).

## Woher die Werte kommen

- **PRD:** Werte aus `prd-setup-bis-paid.md` bzw. `src/os/modules/*/PAINPOINTS.md`. Das sind unsere eigenen Einschätzungen.
- **Bitkom:** Bitkom Research 2025, „Digitalisierung des Handwerks“, 504 Handwerksbetriebe, Mehrfachnennungen
  ([Studienbericht, PDF](https://www.bitkom.org/sites/main/files/2026-01/bitkom-studienbericht-handwerk.pdf), Abb. 19).
  Gefragt wurde nach Hemmnissen der Digitalisierung, nicht nach Gründen gegen eine bestimmte Software.
  Häufigkeit = Anteil in Prozent ÷ 10, gerundet. Die Schwere schätzen wir.
- **Schätzung:** Es gibt noch keine Quelle. Prüfen wir in Gesprächen mit Betrieben und über die Kündigungsgründe in „Dein Plan“.

Alle Werte sind Schätzungen (Evidenzklasse ESTIMATE). Sie werden ersetzt, sobald echte Daten da sind.

## Tabelle

| # | Einwand (so sagt es der Betrieb) | H | S | Score | Quelle | Unsere Antwort heute |
|---|---|---:|---:|---:|---|---|
| 1 | „Ich hab keine Zeit, mich da reinzufuchsen.“ | 9 | 10 | 90 | PRD Setup #1 · Bitkom: 72 % „zu viel zu tun“ | Einrichtung in 5 Schritten, Briefkopf per Foto oder Website, Vorlagen je Gewerk |
| 2 | „Sind meine Daten da sicher? Wo liegen die?“ | 10 | 8 | 80 | Bitkom: 96 % Bedenken bei IT-Sicherheit und Datenschutz | **Offen:** Datenbank ist für Frankfurt (eu-central-1) geplant (`docs/os/BACKEND.md`), Hosting-Angaben in der Datenschutzerklärung sind noch Platzhalter |
| 3 | „Was kostet das am Ende wirklich?“ | 8 | 9 | 72 | PRD Paid #1 · Bitkom: 69 % hohe Investitionskosten | Ein Preis je Betrieb nach Teamgröße, alles drin, 30 Tage kostenlos testen |
| 4 | „Ich muss alles abtippen – Kunden, Preise.“ | 7 | 10 | 70 | PRD Setup #3 und #4 | Import aus Excel/CSV, Lexware, sevDesk, Handy-Kontakten; Preisliste per Foto |
| 5 | „Meine Leute machen da nicht mit.“ | 7 | 10 | 70 | PRD Activation #5 · Bitkom: 58 % fehlende Digitalkompetenz der Mitarbeitenden | Einladung per SMS, kein Passwort, die App zeigt nur den eigenen Einsatz |
| 6 | „Ich will mich nicht lange binden.“ | 7 | 9 | 63 | PRD Paid #2 | Der Test endet von selbst, danach monatlich kündbar |
| 7 | „Meine Kreditkarte geb ich nicht raus.“ | 7 | 8 | 56 | PRD Paid #3 | Test ohne Kreditkarte und ohne Bankverbindung, später SEPA-Lastschrift |
| 8 | „Wenn ich aufhöre, sind meine Daten weg.“ | 6 | 9 | 54 | PRD Paid #4 | Lesemodus statt Sperre, Export immer kostenlos |
| 9 | „Das lohnt sich nur für die Großen.“ | 6 | 8 | 48 | Bitkom: 59 % | Solo-Plan für 1–2 Leute, alles drin |
| 10 | „Ich stell bestimmt was falsch ein.“ | 6 | 8 | 48 | PRD Setup #6 | Alles lässt sich später ändern, Spielwiese getrennt von echten Daten |
| 11 | „Das passt nicht zu meinem Gewerk.“ | 6 | 7 | 42 | Onboarding-Pains #7 | Leistungen, Preise und Begriffe je Gewerk |
| 12 | „Auf der Baustelle hab ich kein Netz.“ | 5 | 8 | 40 | Bitkom: 49 % unzureichende Internetversorgung | Zeiten, Fotos, Material und Unterschrift gehen ohne Empfang |
| 13 | „Wenn's hakt, erreich ich keinen.“ | 5 | 8 | 40 | Schätzung | Support auf Deutsch in jedem Plan, eigenes Thema „Einrichtung“ |
| 14 | „Ich bin kein Computermensch.“ | 4 | 9 | 36 | Bitkom: 42 % Berührungsängste | Eine Frage je Schritt, Handwerkersprache, Hilfe beim Einrichten |
| 15 | „Taugt das im Alltag überhaupt?“ | 6 | 6 | 36 | Bitkom: 57 % mangelnde Praxisreife | Spielwiese mit Beispielbetrieb, Test mit echten Aufträgen |

## Anmeldung: vier Punkte im Markenkopf

`src/os/modules/onboarding/Willkommen.tsx` (`VORTEILE`). Wer hier ankommt, hat schon auf „Kostenlos testen“ geklickt.
Die Punkte nehmen die Einwände, die jetzt noch vom Weitermachen abhalten.

| Punkt | Beantwortet | Belegt durch |
|---|---|---|
| Kostenlos starten | #3 Kosten (72), #6 Bindung (63), #9 nur für Große (48) | 30 Testtage (`abo/plaene.ts`) |
| Ohne Kreditkarte | #7 Kreditkarte (56), #6 Bindung (63) | Test ohne Zahlungsdaten (Preis-FAQ) |
| In wenigen Minuten eingerichtet | #1 keine Zeit (90), #4 abtippen (70) | 5 Schritte, Import, Foto-Briefkopf. Ziel laut PRD: unter 5 Minuten. Eine genaue Zahl („2 Minuten“) erst, wenn `setup.fertig` sie im Median zeigt |
| Kostenlose Hilfe beim Einrichten | #10 falsch einstellen (48), #13 erreich keinen (40), #14 kein Computermensch (36) | Support auf Deutsch in jedem Plan (`preise.ts`), Thema „Einrichtung“ unter `/hilfe/kontakt` |

## Noch offen

- **#2 Datensicherheit (80)** ist der zweitgrößte Einwand. Wir beantworten ihn noch nirgends mit einer festen Zusage.
  Dafür müssen Hosting-Anbieter, Standort und Auftragsverarbeitung (AVV) feststehen und in der Datenschutzerklärung stehen.
- **#5 Leute machen nicht mit (70)** steht nicht im Markenkopf der Anmeldung. Kandidat für die Website und den Schritt „Team“.
- „Kostenlose Hilfe beim Einrichten“ heißt: Wir beantworten Fragen zur Einrichtung ohne Aufpreis. Eine *persönliche Einrichtung*
  (wir richten für dich ein) ist laut `preise-vergleich.ts` und `hilfe/daten-uebernehmen.ts` eine Zusatzleistung auf Anfrage.
