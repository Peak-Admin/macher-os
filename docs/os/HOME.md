# Home („Heute“)

Ruhiges, persönliches Home statt Kennzahlen-Wand. Code: `src/os/shell/home/`.

## Aufbau

- Begrüßung („Servus, {Vorname}“), höchstens **eine** Ankündigung (Banner, schließbar, je Nutzer gemerkt).
- Standard: **vier Widgets in zwei Spalten** – Dein nächster Schritt · Dein Ansprechpartner · Deine Arbeit · Neu für dich
  (Monteur/Azubi: Dein Tag statt Ansprechpartner). Festgelegt in `STANDARD_HOME` (`layout.ts`).
- Raster aus Bändern: kleine Widgets teilen sich zwei Spalten (links 3/5, rechts 2/5), große gehen über die volle Breite.
  Handy: eine Spalte, Band für Band erst links, dann rechts.

## Home anpassen

Visueller Editor direkt auf dem Home (`Editor.tsx`): Ziehen am Griff (Maus, Finger, Stift) mit Live-Vorschau,
Widgets aus der Bibliothek ins Raster ziehen oder „Hinzufügen“, Größe Klein/Groß, Ausblenden, Menü „Nach oben/unten,
andere Spalte“. Tastatur: Griff fokussieren, Pfeiltasten. Gespeichert je Mitarbeiter in der Einstellung
`home.layout.<mitarbeiterId>` (`HomeLayout`), sofort bei jeder Änderung.

## Datenquellen

| Widget | Quelle |
|---|---|
| Dein nächster Schritt | `quellen/naechsterSchritt.ts`: Start-Haken (`modules/start`), offene Anfragen, Angebotsentwürfe, nachzufassende Angebote, abzurechnende Aufträge, überfällige Rechnungen, eigener Einsatz, Macher-Hinweise, überfällige Aufgaben |
| Deine Arbeit | `quellen/arbeit.ts`: eigene Aufgaben, Aufgaben abwesender Kollegen (Urlaubsaufgaben), Freigaben/Entscheidungen von Macher, Angebotsentwürfe |
| Ansprechpartner, Neu für dich, Banner | Schnittstelle `HomeInhalte` (`quellen/inhalte.ts`). **Noch Beispielinhalte** (`quellen/beispiel-inhalte.ts`, als „Beispiel“ markiert), bis ein Backend per `setzeHomeInhalte()` angehängt wird |
| Bibliothek (18 weitere) | bestehende Module: Mein Tag, Einsatz, Kalender, Offen, Abwesenheiten, Braucht dich, Anfragen, Nachrichten, Angebote, Rechnungen, Auswertung, Auslastung, Wartung, Erledigt, Favoriten, Einstellungen (Merkzettel) |

Keine neuen Tabellen nötig. Für das Backend später: Ansprechpartner je Betrieb, Neuigkeiten/Ankündigungen
(mit Zielgruppe `targetAudience`) als Inhalte von Mission Mittelstand.

## Neues Widget registrieren

1. Komponente `({ groesse, ich }: WidgetProps) => …` schreiben – nur den Inhalt; Titel, Rahmen, Fehlergrenze und
   „Alle ansehen“ kommen vom `WidgetRahmen`. Leerzustand mit konkretem nächsten Schritt; `groesse === 'gross'` darf mehr zeigen.
2. Eintrag in `WIDGETS` (`registry.ts`) – oder aus einem Modul `registriereWidget({...})` in `init` aufrufen.
   Felder: `id`, `name`, `description`, `icon`, `kategorie`, `availableSizes`, `defaultSize`, optional `roles`,
   `permissions`, `modul`, `alle`.
3. Neue Widgets erscheinen automatisch verborgen in der Bibliothek. Aufs Standard-Home nur über `STANDARD_HOME` – höchstens vier.

## Messpunkte

`home_viewed`, `home_widget_clicked`, `home_next_action_clicked`, `home_work_item_clicked`, `home_contact_clicked`,
`home_news_clicked`, `home_announcement_clicked`, `home_announcement_dismissed`, `home_customize_opened`,
`home_widget_hidden`, `home_widget_shown`, `home_widget_reordered`, `home_widget_resized`, `home_layout_reset` –
über `@core/messung` (datensparsam; PostHog gibt es im Projekt nicht).
