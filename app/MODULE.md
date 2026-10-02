# Module bauen – Leitfaden

Verbindlich für jedes Modul in `app/src/modules/<id>/`.

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
2. **Module sind Sichten.** Sie hängen sich über `defineModul` in die App: Routen, Hub-Widget, Tabs in fremden
   Detailansichten, Hinweise, Automationen, Suche, Schnellerfassung, „Neu“-Einträge, Beispieldaten.
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
| `bereich`, `gruppe` | Heute · Aufträge · Plan · Betrieb (+ Gruppe im Betrieb) oder `macher` (global) |
| `gewicht` | Pain-Score 1–100 → Reihenfolge in Navigation und Hub |
| `navigation` | `haupt` (in Unternavigation), `hub` (nur Kachel), `versteckt` |
| `routen` | relativ zu `/<bereich>/<id>`; `''` = Startansicht, `':id'` = Detail |
| `vollbildRouten` | ohne App-Rahmen (z. B. Kundenbereich `/k/:token`, Onboarding `/willkommen`) |
| `hubWidget` | kompakter Block auf der Bereichsseite (nur wenn wirklich wichtig) |
| `kurzinfo` | 1 Statuszeile für die Kachel in „Betrieb“ |
| `detail` | dieses Modul besitzt die Detailansicht von Objekttyp X → `pfadZu(bezug)` findet sie |
| `tabs` / `panels` | in Detailansichten anderer Objekte einhängen (z. B. Tab „Fotos“ am Auftrag) |
| `hinweise` | live berechnete Punkte für „Braucht dich“ |
| `aktionen` | Funktionen für Hinweis-Buttons (`{ 'rechnung.mahnen': (payload) => ... }`) |
| `automationen` | Regeln, die automatisch laufen (`start()` registriert Event-Handler über `on()`) |
| `suche` | Treffer für die globale Suche |
| `schnell` | Formulare im „Schnell erfassen“-Blatt (Foto, Zeit, Material …) |
| `erstellen` | Einträge im globalen „Neu“-Menü |
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
- `naechsteNummer('rechnung')`, `summen(positionen, ust, rabatt)`, `euro(cent)`, `datum()`, `relativ()`, `passt(q, …)`
- `oeffne('suche' | 'macher' | 'schnell' | 'benachrichtigungen')`, `useOverlay(name)`
- Geld immer in **Cent** (ganzzahlig). Datum `YYYY-MM-DD`, Zeitpunkte ISO.

## 5. UI

Nur Bausteine aus `@ui/index` und `@ui/objekt` verwenden (Seite, Karte, Liste, ListenZeile, Tabelle, Status, Button,
Eingabe, Auswahl, Dialog, Tabs, Filter, Leer, Meldung, Kennzahl …). Kein eigenes CSS außer minimalem Layout
(Inline-Styles oder eine kleine `<modul>.css` mit `--mm-*`-Tokens). Das finale Design passiert zentral.

Pflicht je Ansicht: Leerzustand (mit konkreter Handlung), Fehler/Validierung, Erfolgsmeldung (`useToast`),
funktioniert bei 390 px Breite. Texte: Deutsch, Du-Ansprache („du“, „dein“ klein), konkrete Verben, keine erfundenen Zahlen.
Status immer als Text (`<Status ton="achtung">Überfällig</Status>`), nie nur Farbe.

## 6. Prüfen

```
cd app && npx tsc -b && npx vitest run && npx vite build
```
