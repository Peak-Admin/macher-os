# Onboarding – Magic Setup, First Value, Just-in-Time Setup

Stand: 02.10.2026. Verbindlich für alles, was ein neuer Betrieb in Handwerk OS vor seinem ersten Nutzen sieht.
Code: `src/os/modules/onboarding/` (Magic Setup, `/willkommen`), `src/os/modules/start/` (First Value, `/start`,
„Macher fertig machen“, Briefkopf just in time), `src/lib/ki/briefkopf.ts` (Website lesen).

## Onboarding Constitution

> **Ein neuer Nutzer darf vor seinem ersten sichtbaren Nutzen höchstens eine verpflichtende Eingabeentscheidung treffen.**

Alles andere ist **Just-in-Time Setup**: Macher fragt erst, wenn die Angabe gebraucht wird – und sagt dann, wofür.

Zielbild (60-Sekunden-Regel):

| Zeit | Was passiert |
|---|---|
| 0 s | Konto erstellt (nur wenn Konten verbunden sind, sonst entfällt der Schritt) |
| 5 s | Website eingeben |
| 15 s | Betrieb erkannt |
| 25 s | Gewerk-Vorlage, Leistungen und Firmendaten erzeugt |
| 30 s | Handwerk OS öffnet sich fertig eingerichtet |
| 35 s | „Was möchtest du als Erstes erledigen?“ |
| 60 s | erstes Angebot / erster Auftrag / Datenübernahme begonnen |

## Ablauf

```
Signup → Magic Setup → First Value → Betrieb vervollständigen → Habit
```

1. **Eine Frage: „Welcher Betrieb bist du?“** – Feld „Website“, Hauptaktion „Betrieb übernehmen“.
   Darunter klein: „Keine Website? Gewerk auswählen“ (ein Tipp, fertig). Daneben die Spielwiese zum Umsehen.
2. **„Wir haben deinen Betrieb gefunden.“** – Name · Gewerk · Ort, Logo, ✓ Firmendaten, ✓ Leistungen von der Website,
   ✓ Leistungen mit Richtpreisen und Auftragsabläufe des Gewerks. Nur Erkanntes, nichts erfunden.
   Gewerk nicht eindeutig → Gewerk-Karten auf derselben Seite (das ist dann die eine Entscheidung).
   Hauptaktion „Sieht gut aus – los geht’s“.
3. **„Was möchtest du als Erstes erledigen?“** (`/start`) – Angebot erstellen (Hauptaktion) · Kunden übernehmen ·
   Auftrag anlegen. Daneben „Erstmal umsehen“.
4. **Home: „Macher fertig machen“** – vier optionale Haken im nächsten Schritt, wegklappbar („Ausblenden“),
   Priorität unter echter Arbeit: ✓ Betrieb eingerichtet · ✓ Gewerk eingerichtet · ○ Kunden & Preise übernehmen ·
   ○ Team hinzufügen → „Weiter einrichten“.

Erkennung: Server-Funktion `/api/ki/briefkopf` liest Startseite und Impressum (SSRF-geschützt) und liefert Briefkopf,
Logo, Gewerk und genannte Leistungen. Regeln vor KI: Liefert die KI kein Gewerk, leitet `vorlageErkennen` es aus
Stichworten in Name und Leistungen ab (auch die Fachrichtung, z. B. Solar bei Elektro). Ist die Erkennung nicht
verbunden oder die Website nicht lesbar, geht es ehrlich zum Gewerk-Tipp – der Betrieb startet trotzdem.

## Wo die früheren Fragen jetzt sind

| Früher im Setup | Jetzt | Warum |
|---|---|---|
| Gewerk auswählen | aus der Website, sonst 1 Tipp | Grundlage des Magic Setup |
| Unternehmensdaten | automatisch aus Website/Impressum | keine Tipparbeit |
| Briefkopf | **raus aus dem Onboarding** – Dialog „Kurz prüfen, bevor wir das Angebot verschicken“ beim ersten Senden (Angebot und Rechnung), fragt nur, was fehlt (Name, Anschrift, Steuernummer/USt-IdNr.) | erst beim ersten Dokument relevant |
| Leistungen | aus Website/Gewerk-Vorlage | später editierbar |
| Preise | „Kunden & Preise übernehmen“ (Datenübernahme `/betrieb/import`) | kein Blocker |
| Kunden | „Kunden übernehmen“ auf `/start` und als Haken | wertvoll, nicht zwingend |
| „Wer arbeitet mit dir?“ | Haken „Team hinzufügen“ nach First Value | erst bei Planung/Zuweisung relevant |
| Betriebsgröße | entfällt | bringt dem Nutzer nichts |
| Arbeitsweise | aus der Gewerk-Vorlage | Macher macht den Vorschlag |
| Konto sichern | Signup vor der Frage (nur mit verbundenen Konten), „Später sichern“ möglich | Signup ist Schritt 0 |
| Integrationen | kontextuell später | blockieren nie den Start |

Der Hinweis „Betriebsdaten für Rechnungen vervollständigen“ erscheint erst, wenn es echte Angebote oder Rechnungen gibt.

## First Value: drei Pfade statt eines Aktivierungsereignisses

| Pfad | First Value | Ereignis | Messpunkt |
|---|---|---|---|
| Angebot | erstes echtes Angebot ist vorbereitet | `angebot.erstellt` | `erstwert.erreicht { pfad: 'angebot' }` |
| Auftrag | erster echter Auftrag ist angelegt | `auftrag.angelegt` (keine Anfrage) | `erstwert.erreicht { pfad: 'auftrag' }` |
| Wechsel | erste Kunden/Leistungen übernommen | `import.abgeschlossen` | `erstwert.erreicht { pfad: 'wechsel' }` |

Gemessen wird genau einmal je Betrieb (Einstellung `start.erstwert`), nie auf der Spielwiese, nie mit Beispieldaten,
mit `sekundenNachSetup`. Weitere Messpunkte: `setup.gestartet`, `setup.schritt`, `setup.fertig { gewerkQuelle:
website | regel | tipp }`, `erstwert.gewaehlt`, `briefkopf.vor_senden`, `briefkopf.ergaenzt`, `home_next_action_hidden`.

## Rangfolge der Methoden (Handwerk-OS-Wert)

| Rang | Methode | Wert | Einsatz |
|---|---|---|---|
| 1 | Website → Magic Setup | 100 | Betrieb automatisch erkennen und einrichten |
| 2 | Guided First Action | 100 | direkt Angebot/Auftrag/Kunden |
| 3 | Gewerk-Vorlagen | 99 | Abläufe, Felder, Dokumente, Leistungen automatisch |
| 4 | Next Best Action | 98 | genau eine sinnvolle nächste Aktion |
| 5 | Daten übernehmen | 97 | Kunden, Leistungen, Preise aus Altsoftware/Excel |
| 6 | Smart Empty States | 96 | überall eine verständliche Aktion statt leerer Screens |
| 7 | Progressive Setup | 96 | Daten erst fragen, wenn sie gebraucht werden |
| 8 | Value Checklist | 90 | nach First Value, nicht davor |
| 9 | Contextual Coachmarks | 87 | nur, wenn jemand an einer Stelle Hilfe braucht |
| 10 | Integrationen | 84 | kontextuell später |
| 11 | Beispieldaten | 78 | nur als getrennte Spielwiese |
| 12 | KI-Setup-Assistent | 75 | Website-Magic-Setup ist zunächst einfacher |
| 13 | klassischer Mini-Wizard | 62 | nur Rückfall |
| 14 | Produkttour | 35 | vermeiden |
| 15 | Video | 25 | Hilfe, nie Onboarding |
| 16 | großer Fragebogen | 5 | weg |
| 17 | Navigation erklären | 3 | weg |

Die Werte sind eine Einschätzung (Schätzung), keine gemessenen Zahlen.

## Offen

- Anmeldung mit Google: das Cloud-Konto kennt bisher E-Mail-Link und SMS-Code.
- Leistungen von der Website werden angezeigt, aber nicht als Katalogeinträge angelegt (ohne Preis wären es leere Positionen).
  Der Katalog kommt aus der Gewerk-Vorlage; eigene Preise über „Kunden & Preise übernehmen“.
- „Wer soll den Auftrag bekommen? + Mitarbeiter hinzufügen“ beim Zuweisen ist noch nicht als Just-in-Time-Schritt gebaut.
