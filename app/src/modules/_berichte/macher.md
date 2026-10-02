# Abschlussbericht Paket `macher`

Branch: `claude/fervent-pascal-joztaz-macher`

## Gebaute Module und Ansichten

| Modul | Ansichten | Einstieg |
|---|---|---|
| `onboarding` Onboarding | Vollbild `/willkommen`: 6 Schritte (Gewerk → Leistungen → Arbeitsweise → Team → Daten → Betrieb), Erfolgsseite „Dein Betrieb ist eingerichtet“, Hinweis bei schon eingerichtetem Betrieb | ersetzt den Notfall-Einstieg der Shell; Schnellstart „Beispielbetrieb einrichten“ bleibt für Tests erhalten |
| `suche` Suche | Overlay `suche` (Strg+K / Topbar), Seite `/macher/suche` | Pfeiltasten, Enter, Esc, Gruppen nach Typ, letzte Suchen |
| `macher-fragen` Macher fragen | Overlay `macher`, Seite `/macher/macher-fragen` | Beispielfragen statt leerer Fläche |
| `automatisch` Automatisch erledigen | `/macher/automatisch` | Link aus dem Glocken-Overlay („Regeln verwalten“) |
| `hinweise` Hinweise & Freigaben | `/macher/hinweise` | Link aus Glocke und aus „Was braucht mich gerade?“ |
| `benachrichtigungen` Benachrichtigungen | Overlay `benachrichtigungen` (Glocke), Seite `/macher/benachrichtigungen` | Topbar |

## Wichtigste Pain Points (Top 5 je Modul)

- **Macher fragen:** Info verteilt über viele Listen (72) · Monteur findet Adresse/Hinweise nicht schnell (72) · „Wer hat Zeit?“ nur im Kopf des Chefs (64) · Aufgaben zwischen Tür und Angel gehen verloren (63) · offene Rechnungen ohne Überblick (63).
- **Suche:** Kunde am Telefon schnell finden (72) · am Handy zum Auftrag (63) · Rechnungsnummer vom Kontoauszug (56) · keine globale Suche (56) · Treffer ohne Kontext (49).
- **Automatisch erledigen:** Fristen nur geprüft, wenn jemand reinschaut (72) · Misstrauen, was die Software tut (56) · Prüfung nur einmal am Tag (42) · Automatik nicht abschaltbar (40) · Technikbegriffe (42).
- **Hinweise & Freigaben:** Entscheidungen in Mails/Zetteln (72) · Wichtiges geht unter (64) · Fristen verpasst (63) · Problem ohne nächste Aktion (56) · Hinweise, die einen nicht betreffen (42).
- **Benachrichtigungen:** Flut → alles wird ignoriert (72) · neue Anfrage bleibt liegen (63) · zugewiesene Aufgabe unbemerkt (56) · Kundennachricht zu spät gesehen (56) · Meldung bei jeder Feldänderung (42).
- **Onboarding:** leere Software nach dem Kauf (81) · Leistungen/Preise selbst anlegen (56) · Kundendaten abtippen (54) · Einrichtung dauert Tage (54) · zu viele Fragen auf einmal (49).

Vollständige Listen: `PAINPOINTS.md` in jedem Modulordner.

## Automationen

| ID | Modul | Standard | Was passiert |
|---|---|---|---|
| `macher.pruefung` | automatisch | an | Alle eingeschalteten `pruefen()` beim Start (Kern) und alle 30 Minuten, solange die App offen ist. Fehler einzelner Regeln isoliert. Erledigt-Eintrag einmal pro Tag (Schätzung 10 Min.). |
| `macher.benachrichtigen` | benachrichtigungen | an | Benachrichtigt nur bei: neue Anfrage, Kundennachricht (nicht intern), Abwesenheitsantrag, Krankmeldung, Entscheidung zum Antrag (an den Mitarbeiter), Angebot angenommen, Zahlung eingegangen (nur Leute mit Geld-Recht), neue Aufgabe für dich. Nie an den Auslöser, Dedup 10 Min. (z. B. `angebote.updated` + `angebot.angenommen`), Beispieldaten ignoriert. |

## Eigene Sammlungen

- `chat` (macher-fragen): Verlauf je Mitarbeiter (`rolle: frage | antwort | fehler`, strukturierte `antwort` inkl. Vorschläge und deren Status Entwurf/Ausgeführt/Verworfen).

Kern-Sammlungen genutzt: `benachrichtigungen` (+ Beispiel-Seed), `hinweise`, `erledigungen`, `aufgaben` (Anlage nach Bestätigung), lesend alle übrigen.

## Macher fragen – Architektur

- `interface Sprachmodell { name; antworte(frage, kontext): Promise<Antwort> }`, aktives Modell über `setzeSprachmodell()` austauschbar. Heute: `regelModell` (lokal, regelbasiert, kein API-Key).
- `Antwort` = kurzer Text + Einträge mit Quelle (`pfadZu`) + Grundlage/Stand + Vorschläge (`aufgabe` als Entwurf, `oeffnen`) + Folgefragen.
- Absichten: Agenda (heute/morgen/Wochentag/Datum/Woche; Monteure sehen nur eigene), offene Rechnungen (Teilzahlungen, überfällig; nur mit `geld`), offene Angebote, Anfragen, Wo ist Kunde/Mitarbeiter (laut Plan, keine Ortung), Wer hat Zeit (Wochenstunden − Termine − Abwesenheiten, Schätzung), Braucht mich, Meine Aufgaben, Aufgabe anlegen, Fallback Suche, sonst Hilfe.
- Ausführung nur nach Klick „Aufgabe anlegen“ mit Rechteprüfung `darf('schreiben')`; Entwurf ist vorher bearbeitbar.

## Kernänderung

- `src/core/gewerke.ts` (erlaubt): zusätzliche typische Leistungen für Dachdecker, Tischler, Fliesen, Garten, Metallbau, Bau und „Anderes Gewerk“. Neue Gewerk-IDs gehen nicht, weil der Typ `Gewerk` in `objects.ts` liegt.

## Kernwünsche

1. **`Gewerk`-Typ erweitern** (z. B. Zimmerer, Gebäudereinigung, Kälte/Klima, Schornsteinfeger) – dann kann `gewerke.ts` mehr Gewerke liefern.
2. **Einstellung zurücksetzen:** `setzeEinstellung(key, undefined)` speichert `undefined`; ein `entferneEinstellung()` wäre sauberer (genutzt beim Rückgängig von „Ausblenden“).
3. **Ausgeblendete Hinweise auflisten:** API für `hinweis.aus.*`, damit „Ausgeblendet“ eine eigene Liste bekommen kann.
4. **`Treffer.bezug`** optional ergänzen – dann kann die Suche Duplikate über das Objekt statt über den Pfad erkennen.
5. **Ereignis-Auslöser** in `DbEvent` (`vonMitarbeiterId`), statt `erstelltVon` des Objekts zu lesen (bei `updated` ist der Bearbeiter sonst unbekannt).
6. **Shell:** Ein Weg zu `/macher/hinweise` und `/macher/automatisch` in der Navigation (z. B. unter Betrieb › Unternehmen oder im Nutzer-Menü); aktuell nur über Glocke/Macher fragen erreichbar.
7. `index.html` ohne Favicon → 404 in der Konsole (`/favicon.ico`).
8. `beispieleEntfernen()` sollte auch Modul-Sammlungen (z. B. `chat`, Checklisten) erfassen, nicht nur `db.*`.

## Offene Punkte

- Unscharfe Suche (Tippfehler, „Meier/Maier“) – aktuell Wortanfang/Teilstring über `passt()` der Module.
- Macher fragen versteht feste Formulierungen; komplexe Sätze landen in der Suche. Echte KI über `Sprachmodell` anbinden, sobald gewünscht.
- Weitere ausführbare Aktionen (Termin verschieben, Rechnung erstellen) über `aktionAusfuehren`, sobald die Besitzer-Module sie registrieren.
- Links auf Rechnungen/Termine/Mitarbeiter funktionieren erst mit den jeweiligen Besitzer-Modulen (`pfadZu`); bis dahin sind die Einträge nicht klickbar bzw. Termine verlinken auf den Auftrag.

## Testergebnis

```
cd app && npm ci && npx tsc -b && npx vitest run && npx vite build
```
- `tsc -b`: ohne Fehler
- `vitest run`: 7 Dateien, 34 Tests grün (davon 29 in diesem Paket)
- `vite build`: erfolgreich
- Browser (Playwright, Chromium, 1440 px und 390 px): Onboarding komplett durchlaufen (inkl. Validierung, Erfolgsseite, „Zu Heute“), Schnellstart „Beispielbetrieb einrichten“, Suche per Strg+K mit Pfeiltaste/Enter, letzte Suchen, Macher fragen mit allen Beispielfragen, Aufgabe erst nach Bestätigung angelegt, Glocke mit Beispiel-Benachrichtigungen, alle Seiten unter `/macher/*` und `/willkommen` bei eingerichtetem Betrieb. Einzige Konsolenmeldung: 404 für `/favicon.ico` (Kern, siehe Kernwünsche).
