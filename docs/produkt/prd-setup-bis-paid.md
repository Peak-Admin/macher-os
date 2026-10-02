# PRD: Setup → First Value → Activation → Habit → Paid

**Ziel:** Jede dieser fünf Phasen erreicht 100/100. Ein Handwerksbetrieb richtet Macher OS in wenigen Minuten ein, hat am ersten Tag ein echtes Ergebnis beim Kunden, arbeitet ab der ersten Woche mit dem ganzen Team darin, öffnet es jeden Tag – und zahlt, weil es selbstverständlich geworden ist.

**Stand heute (Bewertung 02.10.2026):** Setup 70 · First Value 50 · Activation 28 · Habit 28 · Paid 5.
**Ursache in einem Satz:** Die Oberfläche und die Abläufe sind da, aber ohne Backend gibt es kein Konto, kein Team auf mehreren Geräten, keinen echten Versand, keine Erinnerung außerhalb der App und keine Bezahlung.

Grundlagen: `docs/produkt/module.md`, Peak Atlas Software Constitution (§10–15 Pain Score & Exception-First, §31 Multi-Tenant, §33 Opinionated Defaults, §36 80/20), Brand Playbook + `docs/design/festlegungen.md`.

---

## 0. Leitplanken für alle Phasen

1. **Pareto-Oberfläche.** Jeder Screen: höchstens 3 Blöcke, genau 1 Hauptaktion. Was Macher automatisch kann, bekommt keinen Knopf.
2. **Die Rolle bestimmt die Oberfläche.** Chef sieht Entscheidungen und Geld, Büro sieht Eingang und Planung, Monteur sieht nur seinen Tag, Erfassen und seine Aufträge (3 Tabs am Handy).
3. **Nichts tippen, was das System schon weiß oder erkennen kann.** Foto, Sprache, Kontakte vom Handy, Vorlagen aus dem Gewerk.
4. **Ein Handwerker darf nie vor einer leeren Fläche stehen** und nie vor erfundenen Daten, wenn er mit echten Daten arbeitet.
5. **Ehrlich:** keine erfundenen Zahlen. Geschätzte Werte (z. B. „gespart“) sind als Schätzung gekennzeichnet.
6. **Daten gehören dem Betrieb:** Export immer kostenlos, auch nach Ablauf der Testphase. Kein Datenverlust, nie.

---

## 0.1 Fundament (Voraussetzung für Activation, Habit, Paid)

Ohne dieses Fundament bleiben Activation/Habit/Paid unter 30. Es wird einmal gebaut und von allen Phasen genutzt.

| Baustein | Inhalt | Hinweis |
|---|---|---|
| **Konto ohne Passwort** | Anmeldung per E-Mail-Link oder 6-stelligem Code per SMS. Gerät bleibt angemeldet. | Handwerker vergessen Passwörter. |
| **Mandanten** | Organisation (Betrieb) → Mitarbeiter mit Rolle. Row Level Security je Betrieb. | Constitution §31. Supabase, Region Frankfurt. |
| **Sync local-first** | Bestehende Datenschicht (`os/src/core/db.ts`) bleibt API-gleich; IndexedDB wird Cache, Supabase die Quelle. Offline erfassen, später abgleichen. Konflikte: letzte Änderung je Feld, Zeitstrahl zeigt beide. | „Jedes Objekt genau einmal“ gilt jetzt über Geräte hinweg. |
| **Dateien** | Fotos, PDFs, Unterschriften in Storage statt im Browser. | Löst die Speichergrenze. |
| **Versand** | Echte E-Mails (Absendername = Betrieb, Antwort an Betrieb), SMS, später WhatsApp Business. Öffnen-/Gelesen-Status. | Ersetzt `mailto:`. |
| **Server-Takt** | Automationen laufen serverseitig (Cron), nicht nur bei offenem Tab. | Mahnungen, Wartungen, Erinnerungen. |
| **Push** | Web-Push über PWA (Android + iOS ab 16.4), Fallback E-Mail. | Habit. |
| **Öffentliche Links** | Kundenbereich `/k/:token` und Terminbuchung `/buchen/:token` lesen serverseitig. | Funktioniert dann für echte Endkunden. |
| **Messung** | Datensparsame Ereignis-Messung ohne Cookies (z. B. `setup.fertig`, `angebot.versendet`), Auswertung je Phase. | Ohne Messung kein 100er-Nachweis. |
| **Abrechnung** | Stripe oder Mollie mit SEPA-Lastschrift, Rechnung als E-Rechnung. | Paid. |

**Übergang ohne Bruch:** Wer heute ohne Konto startet, behält seine Browser-Daten. Mit „Sichern & Team einladen“ werden sie einmalig in sein Konto übernommen.

---

## 1. Setup — Ziel 100

> **Abgelöst am 02.10.2026 durch das Magic Setup** ([`docs/os/ONBOARDING.md`](../os/ONBOARDING.md)): eine einzige Frage („Welcher Betrieb bist du?“), Website → Betrieb eingerichtet, sonst ein Tipp aufs Gewerk. Briefkopf, Kunden & Preise und Team sind kein Teil des Setups mehr, sondern Just-in-Time-Setup. Wo dieser Abschnitt etwas anderes sagt, gilt `ONBOARDING.md`.

**Definition 100:** Ein Betrieb ist in **unter 5 Minuten** mit **eigenen** Daten startklar: Briefkopf vollständig (Name, Anschrift, Logo, Steuernummer, Bank), Leistungen mit Preisen, Kunden übernommen, mindestens ein Mitarbeiter eingeladen. Danach landet er direkt in seiner ersten Aufgabe, nicht auf einem Dashboard.

### Pains (Pain Score = Frequenz × Intensität)

| # | Pain | Score |
|---|---|---:|
| 1 | „Ich hab keine Zeit, eine Software einzurichten.“ | 90 |
| 2 | Briefkopf, Bank, Steuernummer abtippen, damit das erste Angebot ordentlich aussieht | 72 |
| 3 | Kunden stecken im alten Programm, in Excel oder im Handy | 70 |
| 4 | Preise/Leistungen stehen nur im Kopf oder in einer alten PDF-Preisliste | 64 |
| 5 | Mitarbeiter müssen „irgendwie“ reinkommen | 60 |
| 6 | Angst, etwas falsch einzustellen | 48 |

### Muss rein

1. **Gewerk mit einem Tipp** (heute vorhanden, bleibt; von der Website vorausgewählt).
2. **„Foto von einer alten Rechnung“** → Macher liest Briefkopf, Anschrift, Steuernummer, Bankverbindung, Zahlungsziel, typischen Stundensatz und Logo aus. Der Handwerker bestätigt nur. Alternative: Website-Adresse eingeben → Impressum wird gelesen. Fallback: 4 Felder von Hand.
3. **Kunden übernehmen in einem Schritt:** Excel/CSV mit Vorlagen für gängige Exporte (Lexware, sevDesk, Excel), Kontakte vom Handy (Contact Picker), Foto einer Kundenliste. Dubletten werden automatisch zusammengeführt.
4. **Preisliste übernehmen:** Foto/PDF der eigenen Preisliste → Leistungen mit Preis und Einheit. Sonst gelten die Gewerk-Vorlagen (heute vorhanden), Preise mit einem Schieberegler „+/– %“ an die Region anpassen.
5. **Team einladen per Handynummer:** Name + Nummer → SMS mit Link → Monteur ist sofort drin, ohne Passwort, ohne eigene Einrichtung. Rolle wird aus der Teamgröße vorgeschlagen.
6. **Ende des Setups = erste Aufgabe** (siehe First Value), nicht „Zu Heute“.

### Macher erledigt automatisch

Qualifikationen, Checklisten, Prüfintervalle, Vorlagen, Nummernkreise, Feiertage (aus der PLZ das Bundesland), Arbeitszeiten, Zahlungsziel, Mahnstufen – alles mit vernünftigen Voreinstellungen (Constitution §33). Nichts davon wird im Setup gefragt.

### Interface

Unverändert das geführte Muster (eine Frage je Bildschirm, Auswahlkarten). **Höchstens 5 Schritte:** Gewerk → Betrieb (Foto/Website) → Kunden & Preise (überspringbar) → Team (überspringbar) → Konto sichern (E-Mail oder Handynummer). Beispieldaten nur noch als getrennte **„Spielwiese“**, nie gemischt mit echten Daten.

### Messung & Abnahme

| Kennzahl | Ziel |
|---|---|
| Setup abgeschlossen / Setup begonnen | ≥ 85 % |
| Median-Dauer Setup | ≤ 5 Min. |
| Briefkopf vollständig nach Setup | ≥ 80 % |
| Mind. 1 Mitarbeiter eingeladen in 24 h (Betriebe > 1 Person) | ≥ 60 % |
| Kunden übernommen (Betriebe mit Bestand) | ≥ 50 % |

**Nicht-Ziele:** Artikelstamm-Import (Datanorm) im Setup, Rechte-Feineinstellung, Logo-Gestaltung.

---

## 2. First Value — Ziel 100

**Definition 100:** Innerhalb von **10 Minuten nach dem Setup** geht ein **echtes Dokument an einen echten Kunden** (Angebot oder Rechnung) – professionell, mit Briefkopf, aus Macher OS versendet. Der Handwerker erlebt den Aha-Moment: **„Der Kunde hat dein Angebot geöffnet.“**

### Pains

| # | Pain | Score |
|---|---|---:|
| 1 | Angebote schreiben abends am Küchentisch | 90 |
| 2 | Rechnungen gehen zu spät raus → Geld kommt zu spät | 81 |
| 3 | „Ich weiß nicht, wo ich anfangen soll.“ | 64 |
| 4 | Selbstgebastelte Word-Angebote sehen unprofessionell aus | 56 |
| 5 | Keine Ahnung, ob der Kunde das Angebot überhaupt gelesen hat | 54 |

### Muss rein

1. **„Was willst du als Erstes erledigen?“** – drei Karten, nach Arbeitsweise sortiert: *Angebot schreiben* · *Rechnung schreiben* · *Woche planen*.
2. **Angebot in 3 Minuten:**
   - Kunde aus Kontakten, aus übernommenen Kunden oder neu (Name + Telefon reicht).
   - Positionen per Suche **oder per Sprache**: „Zwei Steckdosen setzen, zehn Meter Leitung, Anfahrt“ → Macher baut Positionen aus dem Katalog mit Preisen (Katalogpreis gilt, Marge sichtbar – heute vorhanden).
   - Vorschau als echter Briefbogen (heute vorhanden), **echter Versand** per E-Mail/SMS mit Link zum Kundenbereich.
   - Kunde nimmt online an (Name bestätigen) → Auftrag steht auf „beauftragt“, nächster Schritt „einplanen“.
3. **Rechnung in 1 Minute** aus einem Auftrag oder frei (heute vorhanden), XRechnung automatisch dabei.
4. **„Dein Start“-Karte auf Heute:** 3 Haken – *Erstes Angebot raus* · *Team eingeladen* · *Erster Termin geplant*. Verschwindet, sobald erledigt. Kein Tutorial, keine Tour.
5. **Live-Rückmeldung:** „Familie Hoffmann hat dein Angebot geöffnet (vor 2 Min.)“ als Benachrichtigung – der emotionale Moment.

### Macher erledigt automatisch

Nummer vergeben, Gültigkeit setzen, Nachfassen nach 7 Tagen vorbereiten, Annahme → Auftrag, Auftrag → Termin-Vorschlag (Autoplanung vorhanden).

### Interface

Ein einziger Ablauf auf einem Bildschirm (Kunde · Positionen · Senden). Keine Kalkulation, kein Aufmaß, keine Optionen im ersten Durchlauf – das kommt erst, wenn der Nutzer es aufklappt.

### Messung & Abnahme

| Kennzahl | Ziel |
|---|---|
| Zeit bis zum ersten versendeten Dokument (Median) | ≤ 10 Min. nach Setup |
| Betriebe mit erstem versendeten Dokument am Tag 1 | ≥ 60 % |
| Kunde öffnet das Dokument | ≥ 70 % der versendeten |
| Abbruchquote im Angebots-Ablauf | ≤ 15 % |

**Nicht-Ziele:** Aufmaß, Kalkulation mit Zuschlägen, Alternativpositionen im ersten Angebot.

---

## 3. Activation — Ziel 100

**Definition 100 („aktivierter Betrieb“) innerhalb von 14 Tagen:**
≥ 3 Aufträge angelegt · ≥ 1 Auftrag von Anfrage bis Rechnung durchgelaufen · ≥ 1 Monteur hat am Handy Zeit **oder** Foto am Auftrag erfasst · ≥ 1 Rechnung versendet.

### Pains

| # | Pain | Score |
|---|---|---:|
| 1 | Büro weiß nicht, was auf der Baustelle passiert | 90 |
| 2 | Zettel, WhatsApp, Zurufe – Infos gehen verloren | 88 |
| 3 | Stunden werden am Freitag aus dem Gedächtnis aufgeschrieben | 80 |
| 4 | Anfragen kommen über 5 Kanäle | 72 |
| 5 | Monteure wollen „keine neue App“ | 70 |
| 6 | Kunden rufen an: „Wann kommt ihr?“ | 64 |

### Muss rein

1. **Ein Betrieb auf allen Geräten** (Fundament: Konto, Sync, Mandanten). Büro-PC und Monteur-Handy sehen dieselben Objekte in Echtzeit.
2. **Monteur-App = installierbare PWA**, offline-fähig, **3 Tabs: Heute · Erfassen · Aufträge**. Start-Knopf am Einsatz startet Zeit, zeigt Adresse, Zugang, Aufgaben (heute vorhanden, nur Desktop-Shell). Fotos/Sprachnotiz/Unterschrift ohne Netz, Abgleich später.
3. **Anfragen landen automatisch:**
   - eigene Weiterleitungs-Adresse `anfragen@<betrieb>.macher-os.de` → E-Mail wird Anfrage mit Kunde,
   - Terminbuchung als Link/Widget für die eigene Website (vorhanden, braucht Fundament),
   - Anruf notieren in 20 Sekunden (vorhanden).
4. **Kundenbereich und Terminbuchung funktionieren für echte Kunden** (Fundament: öffentliche Links). Automatische Terminbestätigung und „Wir sind unterwegs“-Nachricht an den Kunden.
5. **„Nächster Schritt“ am Auftrag** (vorhanden) bleibt das Rückgrat; neu: Macher zeigt dem Chef, wo ein Auftrag hängt („seit 6 Tagen beauftragt, kein Termin“ – vorhanden als Hinweis).

### Macher erledigt automatisch

Zeiten aus Einsatz-Start/Ende, Terminstatus, Material vom Einsatz an den Auftrag, Bericht vorbefüllen, Rechnung aus Auftrag vorbereiten (alles vorhanden, läuft dann serverseitig).

### Interface

Rollen-Oberflächen schärfen: Monteur sieht **nie** Geld, Planung anderer oder Betrieb-Einstellungen. Büro bekommt einen **Eingang** (Anfragen, Kundennachrichten, Freigaben) als einzigen Ort für Neues.

### Messung & Abnahme

| Kennzahl | Ziel |
|---|---|
| Aktivierte Betriebe (Definition oben) / gestartete Betriebe | ≥ 50 % |
| Betriebe mit ≥ 2 aktiven Nutzern in Woche 1 | ≥ 60 % (Betriebe > 1 Person) |
| Monteure mit Erfassung am Handy in Woche 1 | ≥ 70 % der eingeladenen |
| Anfragen, die automatisch statt per Hand entstehen | ≥ 40 % |

**Nicht-Ziele:** Plantafel per Drag & Drop am Handy, Mehrsprachigkeit, eigene Native-App (PWA reicht zuerst).

---

## 4. Habit — Ziel 100

**Definition 100:** Macher OS ist **morgens die erste und abends die letzte App** im Betrieb. Büro/Chef an ≥ 5 von 5 Werktagen, Monteure an jedem Einsatztag. Der Betrieb merkt, dass Macher Arbeit abnimmt.

### Pains

| # | Pain | Score |
|---|---|---:|
| 1 | Morgens Chaos: Wer fährt wohin, was fehlt? | 81 |
| 2 | Rechnungen/Mahnungen werden vergessen | 72 |
| 3 | Fristen (TÜV, DGUV, Gewährleistung, Unterweisungen) laufen ab | 63 |
| 4 | Zeiten werden nicht täglich erfasst | 63 |
| 5 | Chef weiß nicht, wo der Betrieb steht | 56 |

### Muss rein

1. **Feste Takte statt Dauerbeschallung** (Push, Fallback E-Mail; je Nutzer abschaltbar):

   | Wann | Wer | Inhalt |
   |---|---|---|
   | 6:30 | Monteur | Dein Tag: erster Einsatz, Adresse, Material, Hinweise |
   | 7:00 | Chef/Büro | Tagesbrief: höchstens 3 Entscheidungen + Geld (Eingänge, Überfälliges) |
   | 16:30 | Monteur | „Zeiten von heute bestätigen?“ – ein Tipp |
   | Freitag 15:00 | Chef | Wochenbilanz: Umsatz, offene Posten, Aufträge, „Macher hat erledigt“ (Schätzung gekennzeichnet) |

2. **Entscheiden direkt aus der Benachrichtigung:** Urlaub genehmigen, Mahnung senden, Termin bestätigen – ohne die App zu öffnen.
3. **Automationen laufen serverseitig** (Fundament): Wartungen, Mahnungen, Prüffristen, Nachfassen passieren auch, wenn niemand die App offen hat. „Erledigt“ zeigt es (vorhanden).
4. **Heute bleibt ruhig:** höchstens 3 Blöcke, gebündelte Hinweise (vorhanden), „Nichts brennt.“ ist ein guter Zustand.
5. **Favoriten** je Nutzer, höchstens 3 (vorhanden).

### Macher erledigt automatisch

Alles, was eine Regel ist, wird erledigt und protokolliert; der Mensch bekommt nur Entscheidungen. Neu: **Ruhezeiten** (keine Benachrichtigung nach 18 Uhr und am Wochenende, außer Notdienst).

### Interface

Keine neue Fläche. Habit entsteht über Takte und Benachrichtigungen, nicht über mehr Screens. Kein Gamification-Kram (keine Abzeichen, keine Streaks).

### Messung & Abnahme

| Kennzahl | Ziel |
|---|---|
| Aktive Tage je Woche, Chef/Büro (Median) | ≥ 4,5 |
| Monteure aktiv an Einsatztagen | ≥ 90 % |
| Zeiten am selben Tag erfasst | ≥ 85 % |
| Push abbestellt nach 30 Tagen | ≤ 10 % |
| Woche-4-Retention (Betriebe) | ≥ 80 % |

**Nicht-Ziele:** Chat zwischen Mitarbeitern als WhatsApp-Ersatz (Nachrichten am Auftrag reichen), Social-Funktionen.

---

## 5. Paid — Ziel 100

**Definition 100:** Bezahlen ist eine Formalität, keine Entscheidung. **Testphase → zahlend ≥ 40 %** bei aktivierten Betrieben, **Abwanderung < 2 % pro Monat**, null Überraschungen bei der Rechnung.

### Pains

| # | Pain | Score |
|---|---|---:|
| 1 | „Was kostet das am Ende wirklich?“ | 72 |
| 2 | Angst vor langer Bindung | 63 |
| 3 | Kreditkarte hat der Betrieb nicht oder will sie nicht nutzen | 56 |
| 4 | Angst, Daten zu verlieren, wenn man nicht zahlt | 54 |
| 5 | Software-Rechnung muss zum Steuerberater | 42 |

### Muss rein

1. **Ein einfaches Modell:** Preis **je Betrieb nach Teamgröße, alles drin** (alle Module, alle Funktionen). Keine Funktions-Pakete, keine Zusatzmodule zum Freischalten – das widerspricht „ein OS“ und kostet Vertrauen. Preise auf der Website = Preise in der App.
2. **30 Tage Testphase ohne Zahlungsdaten**, danach monatlich kündbar; Jahrespreis mit Rabatt optional.
3. **SEPA-Lastschrift zuerst**, Karte als Alternative. Rechnung kommt automatisch als E-Rechnung und optional direkt an die Steuerberater-Adresse (DATEV-Modul vorhanden).
4. **Bezahlen an einer Stelle, in einem Schritt:** Betrieb › Einstellungen › „Macher OS bezahlen“ – Plan ist aus der Teamgröße vorgewählt.
5. **Der richtige Moment:** Hinweise nur an Wertspitzen und mit echten Zahlen aus den eigenen Daten: „Seit dem Start: 14 Angebote, 9 Rechnungen, 23.400 € bezahlt.“ (Tag 21, 27, 30). Kein Countdown-Banner auf jedem Screen.
6. **Weiche Grenze statt Sperre:** Nach Ablauf ist Macher OS **lesbar**, Export immer möglich, Kundenbereich und offene Rechnungen funktionieren weiter. Neues Anlegen ist gesperrt. Nie Datenverlust.
7. **Selbstbedienung:** Teamgröße ändern (anteilig), Zahlungsart ändern, Rechnungen herunterladen, kündigen in 2 Klicks (mit ehrlicher Frage nach dem Grund).
8. **Zahlungsausfall:** freundliche Erinnerungen (3 Stufen), 14 Tage Kulanz, dann lesbar.

### Macher erledigt automatisch

Platzzahl aus aktiven Mitarbeitern berechnen und vor einer Preisänderung fragen, Rechnungen erstellen und zustellen, Lastschrift einziehen, bei Fehlschlag erinnern.

### Interface

Eine Seite „Dein Plan“: aktueller Plan, nächste Abbuchung, Zahlungsart, Rechnungen – fertig. Keine Vergleichstabelle in der App (die steht auf der Website).

### Messung & Abnahme

| Kennzahl | Ziel |
|---|---|
| Testphase → zahlend (aktivierte Betriebe) | ≥ 40 % |
| Testphase → zahlend (alle Betriebe) | ≥ 20 % |
| Bezahlvorgang abgeschlossen / begonnen | ≥ 90 % |
| Abwanderung pro Monat | < 2 % |
| Supportanfragen zur Abrechnung je 100 Kunden/Monat | < 2 |

**Nicht-Ziele:** Gutscheine, Rabattaktionen, Funktions-Freischaltungen, Kauf über App-Stores.

---

## 6. Reihenfolge (Peak Build Sequence)

Jede Stufe ist für sich nutzbar und messbar.

| Release | Inhalt | Hebt |
|---|---|---|
| **R1 Fundament + Setup + First Value** | Konto ohne Passwort, Mandanten, Sync local-first, Dateien, echter E-Mail-Versand, Messung · Setup mit Foto-Briefkopf, Kunden/Preise übernehmen, Team per SMS · „Was willst du als Erstes erledigen?“, Angebot per Sprache, „Dein Start“-Karte, „Angebot geöffnet“ | Setup 70→90, First Value 50→90 |
| **R2 Activation** | PWA Monteur (3 Tabs, offline), öffentliche Links für Kundenbereich/Terminbuchung, Anfrage-Postfach, Eingang fürs Büro | Activation 28→85 |
| **R3 Habit** | Server-Takt für Automationen, Push, Tagesbrief/Wochenbilanz, Entscheiden aus der Benachrichtigung, Ruhezeiten | Habit 28→85 |
| **R4 Paid** | Pläne nach Teamgröße, 30 Tage Test, SEPA/Stripe, weiche Grenze, Selbstbedienung, Wertspitzen-Hinweise | Paid 5→80 |
| **R5 Feinschliff auf 100** | Messwerte je Phase gegen die Ziele oben prüfen, die größte Lücke je Phase schließen, wiederholen | alle → 100 |

**Abhängigkeit vor R1 (nicht Teil dieses PRD, aber Blocker für den öffentlichen Start):** Impressum, Datenschutz, AGB und AVV mit echten Firmendaten, Hosting-Angabe (EU/Deutschland).

## 7. Offene Entscheidungen

1. **Backend-Anbieter:** Supabase in Frankfurt (Empfehlung, laut Constitution vorgesehen).
2. **E-Mail/SMS-Dienst:** z. B. Postmark/Resend + ein deutscher SMS-Anbieter.
3. **Zahlungsanbieter:** Stripe (breit) oder Mollie (stark bei SEPA/DE).
4. **KI für Foto-Briefkopf, Preisliste, Sprache → Positionen:** Claude über das Backend (nie direkt aus dem Browser), mit Bestätigung durch den Menschen (Entwurf ≠ ausgeführt).
5. **Preise:** Die heutigen Website-Preise sind Platzhalter – endgültige Preise nach Teamgröße festlegen.
