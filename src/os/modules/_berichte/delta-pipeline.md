# Delta `pipeline` – Auftrags-Pipeline & Workflow Engine (DELTA 1) · Gewerk Template Engine (DELTA 13)

Basis: `3b35be5` (Stand `claude/tender-euler-87ikzl`). Reines Delta – die Phase am Auftrag bleibt die Quelle der Wahrheit.

## Gebaut / erweitert

**DELTA 1 – Ablauf-Engine (neues Modul `src/os/modules/ablauf/`)**
- Schritte sind eine feinere Schicht über der Phase: jeder Schritt gehört zu genau einer Phase. Der aktuelle Schritt wird
  live aus Phase + gespeichertem Schritt + Fakten berechnet (`logik.ts: aktuellerSchritt`). Phasen-Logik, Board, Automationen
  anderer Module funktionieren unverändert.
- Abläufe je Gewerk und Auftragsart (Projekt, Kundendienst, Wartung, Reklamation; Werkstatt bei Tischler/Metall/Fensterbau),
  z. B. Neue Anfrage → Besichtigung → Angebot → Warten auf Kunde → Beauftragt → Vorbereitung → Eingeplant → In Arbeit →
  Abnahme → Rechnung → Warten auf Zahlung → Bezahlt. Gewerk-Varianten: Solar (Netzanmeldung, Marktstammdatenregister),
  Fensterbau (Bestellen, Lieferung abwarten), Dach (Gerüst), Maler (Farbtöne), Tischler/Metall (Fertigung) …
- Verantwortliche je Schritt (`verantwortlich` · `buero` · `chef` · `eingeplant`), Fristen und Erinnerungstext.
- Automatische Statuswechsel über Bedingungen: Besichtigung geplant, Angebot verschickt, Material bestellt/bereit,
  Einsatz geplant, Rechnung verschickt.
- Erinnerungen als live berechnete `hinweise` („Braucht dich“), an die zuständige Person: Frist überschritten,
  Materialbedarf prüfen (nach Zusage), Rechnung vorbereiten (abgenommen, noch keine Rechnung).
- UX am Auftrag (`WoSteht.tsx` in `AuftragAkte`): Karte „Wo steht der Auftrag?“ (ruhige Schrittleiste, Schritt x von y,
  seit wann, zuständig, Frist) + „Als Nächstes: …“; die EINE Hauptaktion bleibt im Seitenkopf. „Weiter zu …“ nur für
  Büro/Chef und nur, wenn der nächste Schritt in derselben Phase liegt und nicht von selbst kommt.
- Hauptaktionen (`auftraege/logik.ts`) nach Vorgabe: Anfrage → „Anfrage bearbeiten“ (wenn `anfrage.qualifizieren` da),
  Angebotsentwurf → „Angebot senden“, Beauftragt → „Einsatz planen“, fertig → „Rechnung erstellen“, Entwurf → „Rechnung
  senden“, überfällige Rechnung → „Zahlung erinnern“.
- Auftragsliste: Status zeigt den Schritt statt der Phase; Board (nach Phasen) zeigt den Schritt in der Karte.
- „Einsatzort“-Karte der Akte nutzt den Begriff der Vorlage (Baustelle, Objekt, Grundstück …).
- Konfiguration nur unter Betrieb › Einstellungen (Kontext): `/betrieb/ablauf` (Übersicht, Schwerpunkt wechseln,
  „Auf Vorlage zurücksetzen“) und `/betrieb/ablauf/:id` (Name, Auftragsarten, Schritte; Schritt-Dialog mit Phase,
  Zuständig, Frist, Erinnerung, Früher/Später/Entfernen). Nur Recht `admin` darf ändern; Modul nur für Chef/Büro.

**DELTA 13 – Template Engine (`src/os/core/gewerke.ts`, rückwärtskompatibel)**
- `GEWERKE` enthält wie bisher genau die zehn `Gewerk`-Werte (gleiche IDs, Felder, Reihenfolge) – jetzt zusätzlich mit
  Begriffe, Auftragsarten, Abläufe, Artikelgruppen, Checklisten, Feldvorlagen, Dokumente, Schulungen, Automationen
  (an/aus), Planungsregeln, Heute-Inhalte.
- Neue Fachrichtungen `FACHRICHTUNGEN`: Solar & Photovoltaik (Basis Elektro), Fenster & Türen (Basis Tischler),
  Gebäudereinigung (Basis Anderes Gewerk) – je mit eigenen Leistungen, Material, Qualifikationen, Abläufen.
- Feldvorlagen für die Felder-Engine als einfache Daten `{ objekt, schluessel, label, typ, einheit?, optionen? }[]`
  (`v.felder`, `felderFuer(v, objekt)`), z. B. Solar: Dachneigung, Ausrichtung; Fensterbau: Rohbaumaße, Öffnungsart.
- Helfer: `VORLAGEN`, `vorlage(id)`, `vorlageFuer(gewerk, fachrichtung)`, `fachrichtungenFuer(gewerk)`,
  `ablaufVorlageFuer(v, art)`, `projektAblauf/kundendienstAblauf/wartungAblauf/reklamationAblauf`, `VORLAGE_KEY`.
- Onboarding: im Schritt „Kunden & Preise“ erscheint bei passenden Gewerken „Euer Schwerpunkt“ (z. B. Elektro → Solar).
  `setupEinrichten` übernimmt Fachrichtungs-Leistungen/Stundensatz, merkt die Fachrichtung (`betrieb.vorlage`),
  ergänzt fehlendes Material, Qualifikationen und Checklisten-Vorlagen (ohne Dubletten) und setzt abweichende
  Automationen (Gebäudereinigung: Bewertungsanfrage nach jeder Unterhaltsreinigung aus). Abläufe und Begriffe folgen
  live aus der Vorlage – nichts wird kopiert, solange der Betrieb sie nicht anpasst.
- Keine erfundenen Normen oder Zahlen: Fristen sind veränderbare Standardwerte, Preise wie bisher Richtpreise.

## Wiederverwendete Systeme
`db.*`, `defineCollection`, `vermerken` (Verlauf), `emit/on`, `erledigt`, `benachrichtigen`, `einstellung`,
`setzeAutomation`, `aktionVorhanden`, Hinweis-Bündelung je Auftrag, `setzePhase`/`beiZahlung`/`auftragIdAus`/`schrittFuer`
aus `auftraege`, `kommendeEinsaetze`, `checklistenVorlagen` (Modul checklisten), UI-Bausteine aus `@ui/*`.

## Events
- Gesendet: `auftrag.schritt_gewechselt` (`daten: { auftragId, ablaufId, von, nach }`) – nur bei echtem Wechsel,
  der erste Stand eines Auftrags wird still angelegt.
- Abonniert (Mitführen, immer an via `init`): `auftraege.created|updated|restored`, `termine.*`, `angebote.*`,
  `rechnungen.*`, `material.*`, `zahlungen.*`.
- Abonniert (Regeln): `angebot.angenommen`, `angebote.updated` (→ angenommen), `abnahme.unterschrieben`,
  `rechnung.bezahlt`, `zahlung.eingegangen`, `rechnungen.updated` (→ bezahlt).

## Automationen (alle standardmäßig an)
- `ablauf.zusage` – Zusage → Schritt „Vorbereitung“ (Phase „Beauftragt“), Planung (Büro, sonst Chef) benachrichtigt,
  Hinweis „Materialbedarf prüfen“ (Aktionen: Bedarf ansehen / Material ist geklärt).
- `ablauf.abnahme` – Abnahme → Schritt „Rechnung“; fehlt die Rechnung, Vorschlag „Rechnung erstellen“.
- `ablauf.bezahlt` – Bezahlt → Auftrag abschließen (über `beiZahlung`, nur wenn nichts mehr offen), Schritt „Bezahlt“;
  „Bewertung anfragen“ bleibt nächster Schritt in der Akte, sofern `bewertung.anfragen` existiert
  (die Anfrage selbst bereitet weiter das Modul bewertungen vor – keine Doppelung).

Aktionen: `ablauf.weiter`, `ablauf.material-geklaert`, `ablauf.oeffnen`.

## Neue Sammlungen
- `ablaeufe` – angepasste Abläufe (leer = Vorlage gilt; IDs der Vorlage bleiben erhalten).
- `schrittstaende` – je Auftrag (ID = Auftrags-ID): `ablaufId`, `schrittId`, `seit`. Keine Kopie der Phase.

## Geänderte Dateien
- Neu: `src/os/modules/ablauf/*` (index, daten, logik, regeln, hinweise, WoSteht, Ablaeufe, ablauf.css, Tests, PAINPOINTS).
- `src/os/modules/auftraege/`: `logik.ts` (Hauptaktionen), `AuftragAkte.tsx` (Karte, Begriff), `AuftraegeSeite.tsx`,
  `Pipeline.tsx` (Schritt statt Phase), `auftraege.test.ts`.
- `src/os/core/gewerke.ts` (erlaubte Kerndatei, rückwärtskompatibel).
- `src/os/modules/onboarding/Schritte.tsx` (Schwerpunkt-Wahl), `onboarding/daten.ts` (`vorlageAnwenden`, Schwerpunkt).
- `src/os/shell/struktur.ts`: eine Zeile `kontext: ['ablauf']` am Ziel Einstellungen.
- `src/os/modules/anfragen/` blieb unverändert (die Anfrage-Hauptaktion nutzt dessen Aktion `anfrage.qualifizieren`).

## Kernwünsche
1. `Gewerk` in `objects.ts` um `solar`, `fensterbau`, `reinigung` erweitern (heute als Fachrichtung mit Basis-Gewerk
   gelöst) – dann können sie auch als eigene Kacheln in `Willkommen.tsx` (inkl. `GEWERK_BILD`) erscheinen.
2. Einstieg „Auftragsabläufe“ als Link auf der Einstellungsseite (Modul einstellungen) und Suchwort „Ablauf“ in den
   `stichworte` des Ziels Einstellungen – heute nur über die Funktionssuche nach Titel/Beschreibung erreichbar.
3. `ereignisse.ts`-Katalog: `auftrag.schritt_gewechselt` mit Datenform `{ auftragId, ablaufId, von, nach }` aufnehmen.
4. Heute-Seite könnte `vorlage.heute` (Reihenfolge der Bausteine) und die Planung `vorlage.planung`
   (wetterabhängig, zu zweit, ganze Tage) nutzen – liegen als Daten bereit.
5. Felder-Agent: `felderFuer(aktiveVorlage, objekt)` beim Onboarding/„Vorlage anwenden“ übernehmen.

## Offene Punkte
- Das Board bleibt nach Phasen gruppiert (bewusst); die Schritte stehen in den Karten.
- „Zahlung erinnern“ führt zur Rechnung; ein direkter Versand der Zahlungserinnerung aus der Akte wäre eine Aktion
  des Mahnungen-Moduls (`mahnung.senden` braucht heute eine `mahnungId`).
- Pipeline-Konfiguration erlaubt keine frei definierbaren Bedingungen (bewusst – feste, verständliche Bedingungen).

## Testergebnis
- `npm run typecheck` grün, `npm run lint` 0 Fehler (nur bestehende Warnungen), `npm test` 113 Dateien / alle Tests grün
  (neu: `ablauf/ablauf.test.ts` mit Vorlagen-, Logik-, Engine-, Regel- und Onboarding-Tests), `npm run build` grün.
- Browser (Playwright, Spielwiese): Akte, Auftragsliste, `/betrieb/ablauf`, `/betrieb/ablauf/projekt` (Schritt-Dialog,
  verschieben, speichern) bei 1440 px und 390 px ohne Konsolenfehler, kein horizontales Scrollen.
