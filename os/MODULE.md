# Module bauen – Leitfaden

Verbindlich für jedes Modul in `os/src/modules/<id>/`.

## 1. Grundregeln

1. **Jedes Objekt existiert genau einmal.** Kernobjekte (Kunde, Ort, Anlage, Auftrag, Aufgabe, Termin, Mitarbeiter,
   Leistung, Artikel, Angebot, Rechnung, Zahlung, Beleg, Zeit, Material, Dokument, Nachricht, Betriebsmittel, Hinweis …)
   stehen in `src/core/objects.ts` und werden **nur** über `db.<sammlung>` gelesen/geschrieben.
   - Eine Anfrage ist ein `Auftrag` in Phase `anfrage`. Eine Besichtigung ist ein `Termin` mit `art: 'besichtigung'`.
     Ein Foto ist ein `Dokument`. Eine Wartung ist ein `Auftrag` mit `art: 'wartung'` + `Termin`. Usw.
   - **Niemals Daten kopieren** (kein `kundenName` im eigenen Objekt) – immer per ID verweisen und beim Anzeigen auflösen.
   - Neue Objekttypen nur, wenn es den Typ fachlich wirklich noch nicht gibt (z. B. Servicevertrag, Bewerber,
     Checklisten-Vorlage). Dann im eigenen Modul: `export const vertraege = defineCollection<Vertrag>('vertraege')`
     in `src/modules/<id>/daten.ts`. Der Name ist global eindeutig; doppelte Namen werfen einen Fehler.
     Vorher prüfen, ob ein anderes Modul diese Sammlung schon anbietet – dann deren Export importieren.
2. **Module sind Sichten.** Sie hängen sich über `defineModul` in die App: Routen, Tabs in fremden
   Detailansichten, Hinweise, Automationen, Suche, Erfassungsformulare, Beispieldaten.
   **Wo** ein Modul in der Oberfläche erscheint, entscheidet allein `src/shell/struktur.ts` (siehe Abschnitt 7).
3. **Keine Kerndateien ändern** (`src/core/*`, `src/ui/*`, `src/shell/*`). Fehlt dort etwas, im eigenen Modul lösen
   und im Abschlussbericht vermerken („Kernwunsch: …“).
4. **Pareto: 20 % Oberfläche, 80 % Ergebnis.** Höchstens 3–4 Hauptansichten je Modul. Was automatisch gehen kann,
   macht Macher (Automation) – der Mensch entscheidet nur, gibt frei oder macht Facharbeit.
5. **Exception-First.** Probleme, Fristen, Entscheidungen gehören als `hinweise` nach „Braucht dich“ – mit Gewicht
   (Pain-Score 1–100 = Frequenz × Intensität) und einer konkreten Aktion.

## 2. Anatomie

```
src/modules/<id>/
  index.tsx        export default defineModul({...})
  daten.ts         (optional) eigene Sammlungen + reine Logik
  *.tsx            Ansichten
  *.test.ts        Tests für Logik (vitest)
  PAINPOINTS.md    Top-25-Pain-Points und daraus abgeleitete Pflichtfunktionen
```

Siehe `src/modules/kunden/` als Referenz.

## 3. defineModul – die wichtigsten Felder

| Feld | Zweck |
|---|---|
| `bereich`, `gruppe` | Bestimmt nur noch den URL-Präfix (`/<bereich>/<id>`). Der sichtbare Ort steht in `src/shell/struktur.ts`. |
| `gewicht` | Pain-Score 1–100 → Reihenfolge von Tabs, Hinweisen, Suche |
| `navigation` | ohne Wirkung auf die Navigation (Altfeld) |
| `routen` | relativ zu `/<bereich>/<id>`; `''` = Startansicht, `':id'` = Detail |
| `vollbildRouten` | ohne App-Rahmen (z. B. Kundenbereich `/k/:token`, Onboarding `/willkommen`) |
| `hubWidget` | Altfeld, wird nicht mehr angezeigt (Heute und Betrieb sind fest gestaltet) |
| `kurzinfo` | 1 Statuszeile; ein Text mit `ton: 'achtung'` kann als einziger Hinweis auf der Betrieb-Kachel erscheinen |
| `detail` | dieses Modul besitzt die Detailansicht von Objekttyp X → `pfadZu(bezug)` findet sie |
| `tabs` / `panels` | in Detailansichten anderer Objekte einhängen (z. B. Tab „Fotos“ am Auftrag). Tabs werden in höchstens vier Bereiche gebündelt (`OBJEKT_BEREICHE` in `@ui/objekt`) – ein neuer Tab erzeugt nie einen fünften Bereich. |
| `hinweise` | live berechnete Punkte für „Braucht dich“ |
| `aktionen` | Funktionen für Hinweis-Buttons (`{ 'rechnung.mahnen': (payload) => ... }`) |
| `automationen` | Regeln, die automatisch laufen (`start()` registriert Event-Handler über `on()`) |
| `suche` | Treffer für die globale Suche |
| `schnell` | Erfassungsformular (Foto, Zeit, Material …), das ein **beschrifteter Knopf im Kontext** direkt öffnet: `<ErfassenKnopf aktion="foto" auftragId={id} />` oder `erfassenAktion(...)` für „Weitere Aktionen“. Es gibt keine Auswahl „Was möchtest du erfassen?“. |
| `erstellen` | Verzeichnis der Erstellungsabläufe (kein Menü mehr). Der Knopf gehört als Hauptaktion auf die passende Liste. |
| `global` | global gerenderte Komponente (Overlays) |
| `seed` | Startdaten für eigene Sammlungen nach dem Onboarding (`beispiel: true` setzen) |

## 4. Kern-APIs

- `db.<sammlung>.all() / get(id) / where(fn) / create / update / remove (Papierkorb) / restore`
- React: `db.x.use(filter?, deps?)`, `db.x.useOne(id)`, `useDatenstand()` für abgeleitete Werte
- `on('auftraege.updated', e => …)` – Events; `emit({ typ: 'angebot.versendet', … })` für fachliche Ereignisse
- `vermerken(bezug, typ, text)` – eigener Eintrag im Zeitstrahl eines Objekts
- `erledigt(regelId, titel, { bezug, minuten })` – „Macher hat erledigt“-Protokoll
- `hinweis({...})` – gespeicherter Hinweis (Freigabe/Entscheidung), dedupliziert über `schluessel`
- `benachrichtigen(titel, {...})`
- `einstellung(key, standard)` / `useEinstellung`
- `useIch()`, `darf('geld')`, `useDarf('geld')`, `istBuero()`
- `naechsteNummer('rechnung')`; eigene Nummernkreise: `naechsteNummerFuer('BR', sammlung.allMitGeloeschten().map((x) => x.nummer))`
- `summen(positionen, ust, rabatt)`, `euro(cent)`, `datum()`, `relativ()`, `passt(q, …)`
- Fremde Modul-Sammlungen direkt importieren (`import { kalkulationen } from '@modules/kalkulation/daten'`) oder
  generisch über `sammlung(name)` / `alleSammlungen()` – nie über `exportieren()` lesen
- `aktionVorhanden('rechnung.erstellen')` – nur Knöpfe zeigen, deren Aktion ein Modul anbietet
- Datum/Uhrzeit nur aus `@core/format`: `plusTage`, `plusMonate`, `tageZwischen`, `wochentag` (1 = Mo), `wochenStart`,
  `kalenderwoche`, `tage(von, bis)`, `minutenAus('07:30')`, `uhrAus(450)`, `minutenVon(iso)`, `lokal(datum, minuten)`
- Feiertage & Arbeitstage nur aus `@core/kalender`: `feiertage(jahr, bundesland?)`, `istFeiertag`, `istArbeitstag(datum, arbeitstage?)`
  (Einstellungen `plan.arbeitstage`, `plan.bundesland`)
- Verfügbarkeit (wer ist wann frei, freie Slots/Fenster, Abwesenheit am Tag, Stunden) nur aus `@modules/verfuegbarkeit/daten`
- `oeffne('suche' | 'macher' | 'benachrichtigungen')`, `useOverlay(name)`; Erfassen nur mit konkreter Aktion: `erfassen('foto', auftragId)`
- Geld immer in **Cent** (ganzzahlig). Datum `YYYY-MM-DD`, Zeitpunkte ISO.

## 5. UI

Nur Bausteine aus `@ui/index` und `@ui/objekt` verwenden (Seite, Karte, Liste, ListenZeile, Tabelle, Status, Button,
Eingabe, Auswahl, Dialog, Tabs, Filter, Leer, Meldung, Kennzahl, AktionsMenue, ErfassenKnopf …). Gemeinsame Eingaben (`@ui/eingaben`): `ZahlEingabe`,
`GeldEingabe`, `zahlAus`, `DateiKnopf`, `DateiFeld`, `bildVerkleinern`, `dateiLesen`, `UnterschriftFeld`. Druck/PDF
(`@ui/druck`): `Briefbogen`, `Druckrahmen`, `DruckNichtGefunden`, `briefkopf()`. Kein eigenes CSS außer minimalem Layout
(Inline-Styles oder eine kleine `<modul>.css` mit `--mm-*`-Tokens). Das finale Design passiert zentral.

Pflicht je Ansicht: Leerzustand (mit konkreter Handlung), Fehler/Validierung, Erfolgsmeldung (`useToast`),
funktioniert bei 390 px Breite. Texte: Deutsch, Du-Ansprache („du“, „dein“ klein), konkrete Verben, keine erfundenen Zahlen.
Status immer als Text (`<Status ton="achtung">Überfällig</Status>`), nie nur Farbe.

## 6. Prüfen

```
cd os && npx tsc -b && npx vitest run && npx vite build
```

## 7. Navigation und Wachstum (verbindlich)

Leitsatz: **Viele Fähigkeiten im Produkt. Wenige Entscheidungen auf jedem Screen.**

- Globale Navigation ist fest: **Heute · Aufträge · Planen · Betrieb**. Kein globales „+ Neu“, kein „Erfassen“-Menü,
  kein Plus in der unteren Navigation, kein Hamburger-Menü.
- Jedes Modul steht in `src/shell/struktur.ts` genau einmal – als **Ansicht** eines Ziels (höchstens vier je Ziel) oder
  als **Kontext** (geöffnet am Objekt, per Suche oder Link). `src/shell/struktur.test.ts` schlägt fehl, wenn ein Modul
  fehlt oder eine Ebene mehr als vier Ziele hat.
- Eine neue Funktion erzeugt **nie automatisch einen Menüpunkt**. Vor dem Einhängen beantworten: Welche Aufgabe löst sie?
  Zu welchem Bereich gehört sie? Gehört sie eigentlich an ein Objekt (meist den Auftrag)? Wie ist sie innerhalb der
  Vier-Punkte-Struktur erreichbar? Welche Rolle braucht sie wann? Welche bestehende Oberfläche lässt sich nutzen?
- Budgets je Screen: höchstens eine dominante Hauptaktion (`Seite aktion`), höchstens zwei zurückhaltende Aktionen,
  weitere über `AktionsMenue` (höchstens vier Einträge). Listenvorschauen höchstens drei Einträge plus „Alle …“.
- Erstellen passiert im Kontext mit konkretem Verb („Foto hinzufügen“, „Auftrag anlegen“), nie mit „Neu“ oder „+“ allein.
- Suchbegriffe für Funktionen (`stichworte` in `struktur.ts`) pflegen, damit Seltenes über die Suche auffindbar bleibt.
