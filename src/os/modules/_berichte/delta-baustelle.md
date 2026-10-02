# Delta „baustelle“ – Mobile Field Experience (Delta 4) und Sprach-Baustellenbericht (Delta 5)

## Was gebaut/erweitert wurde

**Kein neues Modul.** Alles hängt an `naechster-einsatz`, dem Modul für den Einsatz. Deshalb gibt es keine Änderung an `struktur.ts`.

### Delta 4 – Einsatz vor Ort (Monteur, Handy, Handschuhe)
- **Heute-Block `EinsatzKurz`** (`naechster-einsatz/Einsatz.tsx`): Nächster Einsatz · Kunde · Straße, Ort · Uhrzeit · Arbeit · Zugang,
  darunter **[Navigation] [Arbeit starten]**, beide ≥ 56 px hoch.
  - „Navigation“ öffnet die Karte. Vor dem Start gilt das gleichzeitig als Losfahren: Der Status wird „unterwegs“, und der Kunde bekommt wie bisher „Wir sind unterwegs“.
  - Der eigene Knopf „Losfahren“ entfällt (eine Entscheidung weniger).
  - Wenn die Arbeit läuft, steht dort „Einsatz abschließen“, und Kamera und Sprache sind direkt daneben.
- **`hauptaktion()`**: Arbeit starten → Einsatz abschließen. „Einsatz abschließen“ führt zum Sprachbericht. Die Auftragsakte nutzt die Funktion und führt jetzt automatisch auch dorthin.
- **Einsatzseite vor Ort (`Feld.tsx` → `FeldAktionen`)**: eine Hauptaktion „Einsatz abschließen“. Darunter große Kacheln (≥ 72 px):
  Fotos · Sprache · Material · Checkliste (mit Stand, z. B. 2/5; startet bei Bedarf die passende Vorlage) · Problem melden · Kunde unterschreiben (über `bericht.erstellen`).
  Selteneres steht unter „Mehr“ (Zeit, Notiz, Zusatzleistung, Mangel). Bevor die Arbeit läuft, gibt es nur Navigation und Arbeit starten.
- **Problem melden** (Dialog): zwei Tipps (Material fehlt / Kunde nicht da / Mehr Arbeit / Etwas anderes) und optional diktierter Text.
  Daraus wird ein Hinweis an Chef und Büro (dedupliziert) mit einem Vermerk im Zeitstrahl von Termin und Auftrag.
- **Monteur-Tab „Erfassen“**: Foto als großer Knopf, darunter Kacheln. Läuft ein Einsatz, gibt es dort auch „Einsatz abschließen“.
- **Mein Tag** (Rolle Monteur/Azubi, heute): Der aktuelle Einsatz steht oben (Abschnitt 8: Monteur sieht primär seinen Tag).
- **Schlechte Verbindung:** Alles wird sofort lokal gespeichert (IndexedDB). Mit Konto lädt `core/sync` es automatisch hoch, sobald wieder Netz da ist (Warteschlange, `online`-Event).
  `SyncStand` zeigt dazu einen ruhigen Hinweis: „Auf dem Handy gespeichert. Wird gesendet, sobald Netz da ist.“, „Wird gesendet …“ oder nach dem Abschluss „Ist im Büro angekommen.“
  Ohne Konto zeigt `SyncStand` nichts. Den Offline-Hinweis zeigt die Shell bereits.
  `sw.ts` musste nicht geändert werden: Die App-Shell und die Assets sind offline vorgehalten.

### Delta 5 – Sprach-Baustellenbericht
- **Parser `naechster-einsatz/sprachbericht.ts`**: offline und regelbasiert, ohne KI.
  - Deutsche Zahlwörter: 0–99, Hunderter, „anderthalb“, „zweieinhalb“, „eine halbe“, „drei viertel“, „zwei komma fünf“.
  - Zeit: „+1 Std“, „eine Stunde länger“, „30 Minuten kürzer“, „3 Stunden gearbeitet“, „von 7:30 bis 12:15“.
  - Material: Menge + Einheit (m/Meter/Stück/Stk./kg/Liter/qm/Packung) + Artikel. Ohne Einheit nur, wenn im Satz von Material die Rede ist.
  - Status: abgeschlossen / offen / Problem, einschließlich Verneinungen wie „nicht fertig“ und „kein Problem“.
  - Ausgeführt vs. Zusatzarbeit: erkannt an „zusätzlich“, „außerdem“, „Nachtrag“ usw.
  - Funktioniert auch mit Text ohne Satzzeichen, wie ihn die Spracherkennung liefert.
- **`abschluss.ts`**: `planen()` erzeugt aus dem Text und dem Datenstand einen Plan. `uebernehmen()` schreibt ihn **einmal** (Schutz über einen Zeitstrahl-Vermerk, kein zweites Buchen):
  - **Zeit**: Die laufende Stempeluhr wird zum genannten Ende gestoppt (`stoppen` aus arbeitszeiten). Ohne Stempeluhr wird ein Zeiteintrag nach Plan bzw. nach der Ansage angelegt.
  - **Material**: Geplantes Material am Auftrag wird auf „verbraucht“ gesetzt. Sonst entsteht eine neue Buchung, mit Artikel und EK, wenn Name und Einheit passen.
  - **Zusatzleistung** (Nachtrag, wartet auf Freigabe): Preis aus dem Leistungskatalog, sonst Stunden. „Eine Stunde länger“ wird als Dauer genommen, wenn es genau eine Zusatzarbeit gibt. Fehlen die Stunden, fragt die Vorschau danach.
  - **Bericht** (`berichte`, Rapport/Tagesbericht des Termins): Tätigkeiten, Bemerkung, Zeit- und Material-IDs. Ein vorhandener Entwurf wird weiterverwendet.
  - **Baustellendokumentation**: Dokument `notiz` mit dem ganzen Text, `auftragId`, Bezug auf den Bericht und Tag „Baustellenbericht“.
  - **Status**: „offen“ legt die Aufgabe „Restarbeiten“ an, „Problem“ erzeugt einen Hinweis an Chef und Büro.
  - **Zeitstrahl**: `vermerken` am Auftrag und am Termin.
  - Zuletzt `einsatzBeenden` → Termin erledigt, Event `einsatz.beendet`.
- **Oberfläche `Abschluss.tsx`** (`/heute/naechster-einsatz/:id/abschliessen`):
  - Großes Mikrofon (Web Speech API, `de-DE`, Zwischenstand live).
  - Ohne Spracherkennung: Textfeld mit dem Hinweis, über das Tastatur-Mikrofon zu diktieren.
  - Dann „Passt das so?“ mit Ausgeführt, Zusatzarbeit, Zeit, Material, Status (änderbar), Doku und **[Übernehmen] [Ändern]**. „Ändern“ führt zurück zum Text.
  - Danach der Erfolgszustand mit „Kunde unterschreiben lassen“.
  - „Ohne Bericht abschließen“ ist weiterhin möglich.

## Wiederverwendet
`arbeitszeiten/daten.stoppen` und `einsatz.beenden` (über `logik.einsatzBeenden`) · `berichte/daten.berichtErstellen` · `zusatzleistungen`-Sammlung ·
`db.material` · `db.dokumente` · `db.aufgaben` · `hinweis()` · `vermerken`/`zeitstrahl` · `checklisten/daten` · `erfassen()`-Formulare (Foto, Sprachnotiz, Material …) ·
`useSyncStatus` (core/sync).

## Events
- Gesendet: `einsatz.beendet` (über die bestehenden Funktionen), `einsatz.gestartet` (unverändert).
- Neue Zeitstrahl-Typen: `einsatz.sprachbericht` und `einsatz.problem_gemeldet`. Beides sind nur Vermerke, keine Bus-Events.
- Abonniert: keine neuen. Die Berichte-Automation erkennt den schon angelegten Bericht und legt keinen zweiten an.

## Neue Sammlungen / Automationen
Keine.

## Kernwünsche (nicht selbst lösbar)
1. **Shell, Monteur am Desktop:** Die Seitenleiste zeigt dem Monteur alle vier Bereiche einschließlich Planen und Betrieb. Gewünscht ist dieselbe schlanke Auswahl wie in der mobilen Monteur-App (Heute · Erfassen · Aufträge).
2. **Shell, Monteur-Heute:** Der Spielwiesen-Hinweis und die untere Navigation liegen auf dem Handy über den Kacheln. Mehr Abstand unten (`padding-bottom` für den Inhalt) wäre gut.
3. **Ereigniskatalog** (`core/ereignisse.ts`): `einsatz.problem_gemeldet` als fachliches Event aufnehmen, falls Automationen darauf reagieren sollen.
4. **Ort-Panel am Termin** (Modul `orte`) zeigt „Navigation starten“ zusätzlich zur Einsatzkarte, also doppelt. Am Termin ausblenden?

## Offene Punkte
- Die Web Speech API braucht in Chrome auf Android in der Regel Netz. Offline greift das Diktieren über die Tastatur; der Text wird trotzdem offline zerlegt und gespeichert.
- Material ohne Treffer im Artikelstamm wird mit EK 0 gebucht. Das Büro sieht den Freitext am Auftrag.

## Testergebnis
- `sprachbericht.test.ts`: 38 Tests (Zahlwörter, Zeiten, Einheiten, Status, Segmentierung, Abgleich).
- `abschluss.test.ts`: 12 Tests (einmaliges Schreiben, Stempeluhr, Plan, Problem, offen, fehlende Stunden).
- Gesamt: `npm run typecheck`, `npm run lint` (0 Fehler), `npm test` (114 Dateien, 841 Tests) und `npm run build` grün.
- Im Browser (Spielwiese, Rolle Monteur) bei 390 px und 1440 px durchgespielt: Heute → Arbeit starten → Einsatz → Problem melden → Einsatz abschließen → Prüfen → Übernehmen. Keine Konsolenfehler, kein horizontales Scrollen.
