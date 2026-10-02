# Module bauen – Leitfaden

Verbindlich für jedes Modul in `src/os/modules/<id>/`.

## 1. Grundregeln

1. **Jedes Objekt existiert genau einmal.** Kernobjekte (Kunde, Ort, Anlage, Auftrag, Aufgabe, Termin, Mitarbeiter,
   Leistung, Artikel, Angebot, Rechnung, Zahlung, Beleg, Zeit, Material, Dokument, Nachricht, Betriebsmittel, Hinweis …)
   stehen in `src/os/core/objects.ts` und werden **nur** über `db.<sammlung>` gelesen/geschrieben.
   - Eine Anfrage ist ein `Auftrag` in Phase `anfrage`. Eine Besichtigung ist ein `Termin` mit `art: 'besichtigung'`.
     Ein Foto ist ein `Dokument`. Eine Wartung ist ein `Auftrag` mit `art: 'wartung'` + `Termin`. Usw.
   - **Niemals Daten kopieren** (kein `kundenName` im eigenen Objekt) – immer per ID verweisen und beim Anzeigen auflösen.
   - Neue Objekttypen nur, wenn es den Typ fachlich wirklich noch nicht gibt (z. B. Servicevertrag, Bewerber,
     Checklisten-Vorlage). Dann im eigenen Modul: `export const vertraege = defineCollection<Vertrag>('vertraege')`
     in `src/os/modules/<id>/daten.ts`. Der Name ist global eindeutig; doppelte Namen werfen einen Fehler.
     Vorher prüfen, ob ein anderes Modul diese Sammlung schon anbietet – dann deren Export importieren.
2. **Module sind Sichten.** Sie hängen sich über `defineModul` in die App: Routen, Tabs in fremden
   Detailansichten, Hinweise, Automationen, Suche, Erfassungsformulare, Beispieldaten.
   **Wo** ein Modul in der Oberfläche erscheint, entscheidet allein `src/os/shell/struktur.ts` (siehe Abschnitt 7).
3. **Keine Kerndateien ändern** (`src/os/core/*`, `src/os/ui/*`, `src/os/shell/*`). Fehlt dort etwas, im eigenen Modul lösen
   und im Abschlussbericht vermerken („Kernwunsch: …“).
4. **Pareto: 20 % Oberfläche, 80 % Ergebnis.** Höchstens 3–4 Hauptansichten je Modul. Was automatisch gehen kann,
   macht Macher (Automation) – der Mensch entscheidet nur, gibt frei oder macht Facharbeit.
5. **Exception-First.** Probleme, Fristen, Entscheidungen gehören als `hinweise` nach „Braucht dich“ – mit Gewicht
   (Pain-Score 1–100 = Frequenz × Intensität) und einer konkreten Aktion.

## 2. Anatomie

```
src/os/modules/<id>/
  index.tsx        export default defineModul({...})
  daten.ts         (optional) eigene Sammlungen + reine Logik
  *.tsx            Ansichten
  *.test.ts        Tests für Logik (vitest)
  PAINPOINTS.md    Top-25-Pain-Points und daraus abgeleitete Pflichtfunktionen
```

Siehe `src/os/modules/kunden/` als Referenz. Neue Module werden automatisch gefunden: `scripts/os-module.mjs`
schreibt vor `dev`, `build` und `test` die Liste `src/os/shell/module-liste.ts` neu.

## 3. defineModul – die wichtigsten Felder

| Feld | Zweck |
|---|---|
| `bereich`, `gruppe` | Bestimmt nur noch den URL-Präfix (`/<bereich>/<id>`). Der sichtbare Ort steht in `src/os/shell/struktur.ts`. |
| `gewicht` | Pain-Score 1–100 → Reihenfolge von Tabs, Hinweisen, Suche |
| `navigation` | ohne Wirkung auf die Navigation (Altfeld) |
| `routen` | relativ zu `/<bereich>/<id>` (bzw. `basisPfad`); `''` = Startansicht, `':id'` = Detail |
| `basisPfad` | optional: eigener Startpfad, z. B. `/betrieb/katalog/material`; alte Adressen per Weiterleitung erhalten |
| `vollbildRouten` | ohne App-Rahmen (z. B. Kundenbereich `/k/:token`, Onboarding `/willkommen`) |
| `hubWidget` | Altfeld, wird nicht mehr angezeigt (Heute und Betrieb sind fest gestaltet) |
| `kurzinfo` | 1 Statuszeile; ein Text mit `ton: 'achtung'` kann als einziger Hinweis auf der Betrieb-Kachel erscheinen |
| `detail` | dieses Modul besitzt die Detailansicht von Objekttyp X → `pfadZu(bezug)` findet sie |
| `tabs` / `panels` | in Detailansichten anderer Objekte einhängen (z. B. Tab „Fotos“ am Auftrag). Tabs werden in höchstens vier Bereiche gebündelt (`OBJEKT_BEREICHE` in `@ui/objekt`) – ein neuer Tab erzeugt nie einen fünften Bereich. |
| `hinweise` | live berechnete Punkte für „Braucht dich“ |
| `aktionen` | Funktionen für Hinweis-Buttons (`{ 'rechnung.mahnen': (payload) => ... }`) |
| `automationen` | Regeln, die automatisch laufen (`start()` registriert Event-Handler über `on()`) |
| `gateway` | Absichten und Aktionen für den Macher AI Gateway (`docs/os/KI-GATEWAY.md`) – nie selbst ein Modell aufrufen |
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

- `alsAkteur({ quelle: 'import', id: 'csv' }, () => …)` – Änderungen einem Akteur zuordnen (Abschnitt 8)
- Ereignisse, Webhooks, Audit und Rückgängig: `@core/ereignisse`, `@core/audit`; KI-Aktionen nur über `@core/gateway` (Abschnitt 8)

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
npm run typecheck && npm test && npm run build
```

## 7. Navigation und Wachstum (verbindlich)

Leitsatz: **Viele Fähigkeiten im Produkt. Wenige Entscheidungen auf jedem Screen.**

- Globale Navigation ist fest: **Heute · Aufträge · Planen · Betrieb**. Kein globales „+ Neu“, kein „Erfassen“-Menü,
  kein Plus in der unteren Navigation, kein Hamburger-Menü.
- Jedes Modul steht in `src/os/shell/struktur.ts` genau einmal – als **Ansicht** eines Ziels (höchstens vier je Ziel) oder
  als **Kontext** (geöffnet am Objekt, per Suche oder Link). `src/os/shell/struktur.test.ts` schlägt fehl, wenn ein Modul
  fehlt oder eine Ebene mehr als vier Ziele hat.
- Eine neue Funktion erzeugt **nie automatisch einen Menüpunkt**. Vor dem Einhängen beantworten: Welche Aufgabe löst sie?
  Zu welchem Bereich gehört sie? Gehört sie eigentlich an ein Objekt (meist den Auftrag)? Wie ist sie innerhalb der
  Vier-Punkte-Struktur erreichbar? Welche Rolle braucht sie wann? Welche bestehende Oberfläche lässt sich nutzen?
- Budgets je Screen: höchstens eine dominante Hauptaktion (`Seite aktion`), höchstens zwei zurückhaltende Aktionen,
  weitere über `AktionsMenue` (höchstens vier Einträge). Listenvorschauen höchstens drei Einträge plus „Alle …“.
- Erstellen passiert im Kontext mit konkretem Verb („Foto hinzufügen“, „Auftrag anlegen“), nie mit „Neu“ oder „+“ allein.
- Suchbegriffe für Funktionen (`stichworte` in `struktur.ts`) pflegen, damit Seltenes über die Suche auffindbar bleibt.

## 8. Ereignisse, Audit und Aktionen (Kern)

### 8.1 Ereignisse (`@core/events`, `@core/ereignisse`)

- **Datenereignisse** sendet die Datenschicht selbst: `<sammlung>.created|updated|removed|restored`.
- **Fachliche Ereignisse** heißen `<objekt>.<partizip>` (deutsch) und stehen mit Beschreibung, Objekttyp und
  englischem API-Namen im Katalog `EREIGNISSE` (`ereignisKatalog()`, `ereignisArt('invoice.paid')`, `apiName('rechnung.bezahlt')`).
  Beispiele: `kunde.angelegt` (customer.created), `anfrage.eingegangen` (request.created), `angebot.versendet` (quote.sent),
  `angebot.angenommen` (quote.accepted), `auftrag.angelegt` (job.created), `auftrag.eingeplant` (job.scheduled),
  `auftrag.gestartet` (job.started), `auftrag.abgeschlossen` (job.completed), `auftrag.schritt_gewechselt` (job.stage_changed),
  `rechnung.erstellt` (invoice.created), `rechnung.versendet` (invoice.sent), `rechnung.bezahlt` (invoice.paid),
  `rechnung.ueberfaellig` (invoice.overdue), `zahlung.eingegangen` (payment.received), `mitarbeiter.abwesend` (employee.absent),
  `material.knapp` (material.low_stock), `import.abgeschlossen` (import.completed) …
- **Ableitung:** Viele fachliche Ereignisse leitet der Kern zentral aus Datenereignissen ab (`herkunft: 'abgeleitet'`),
  z. B. Rechnung auf „bezahlt“ → `rechnung.bezahlt`, Auftrag auf „Erledigt“ → `auftrag.abgeschlossen`. Module müssen dafür
  nichts tun. Abgeleitete Ereignisse kommen als Microtask direkt nach der Änderung an (`abgeleitet: true`). Sendet ein Modul
  dasselbe Ereignis selbst – **synchron**, direkt neben der Änderung, mit demselben `objekt` –, wird die Ableitung verworfen.
  Neue Ereignisse: im selben Schema benennen und im Katalog ergänzen (Kern).
- **Senden:** `emit({ typ: 'import.abgeschlossen', sammlung: 'betrieb', objekt, daten: { anzahl } })` – `daten` klein halten (≤ 2 KB).
- **Ereignisprotokoll** (`ereignisprotokoll`): jedes fachliche Ereignis mit `zeit`, `quelle` (user/automation/ai/import/sync),
  `akteurId`, `mitarbeiterId`, `bezug`, `daten`. Lesen: `ereignisseSeit(seit?, { typ?, bezug? })`. Rotation: 90 Tage / 5000 Einträge
  auf dem Gerät (`protokollAufraeumen`), der Server behält alles. Fristen (`rechnung.ueberfaellig`) prüft `pruefeFristen()` beim
  Start und alle 30 Minuten.
- **Webhooks** (Vertrag für die Oberfläche in `schnittstellen`):
  - Sammlungen `webhooks` (`Webhook`: `name`, `url`, `ereignisse` = API-Namen oder `*`, `aktiv`, `zuletztZugestelltAm`, `letzterFehler`)
    und `webhook_auslieferungen` (`WebhookAuslieferung`: `webhookId`, `ereignisId`, `api`, `status` wartend/zugestellt/fehler/aufgegeben,
    `versuche`, `naechsterVersuch`, `antwortCode`, `fehler`).
  - `webhookAnlegen({ name, url, ereignisse })` (prüft `webhookUrlPruefen(url)`: nur https, lokal auch http://localhost),
    ändern/löschen über `webhooks.update/remove`.
  - Passende Ereignisse landen automatisch in der Warteschlange (Beispieldaten nie). `webhookNutzlast(ereignis)` baut das JSON
    (`id`, `type` = API-Name, `event`, `created_at`, `source`, `actor`, `object: { type, id, data }`, `data`).
  - Versand: `setzeWebhookVersender(fn)` bindet einen Versender an (Server/Edge-Funktion); `webhooksZustellen()` stellt fällige zu,
    `auslieferungErgebnis(id, { ok, code, fehler })` trägt Ergebnisse ein (Wiederholung nach 1, 5, 30, 120, 720 Minuten, danach
    „aufgegeben“). Im Browser ist kein Versender gesetzt – die Warteschlange wird mit dem Konto abgeglichen und kann serverseitig
    abgearbeitet werden. Das Signatur-Geheimnis steht nie im Webhook (`geheimnisGesetzt`, `geheimnisEnde` = letzte vier Zeichen);
    die Oberfläche (`schnittstellen`, Adapter `kernQuelle`) zeigt es beim Anlegen einmal und legt es für die Zustellung ab
    (`webhookGeheimnis(id)`). Abonniert werden deutsche Typen, API-Namen, `*` oder `rechnung.*` (`ereignisAbonniert`).
  - Gruppen für Auswahllisten: `ereignisGruppe(typ)` („Geld“, „Team“ …).

### 8.2 Audit und Rückgängig (`@core/audit`, `@core/akteur`)

- Jede Änderung über `db.*` landet automatisch im Verlauf des Objekts (`ereignisse`, Zeitstrahl): `quelle`, `akteurId`,
  `vonMitarbeiterId`, `aenderung` (created/updated/removed/restored) und bei Änderungen **nur die geänderten Felder** (`felder`
  mit `vorher`/`nachher`; sehr große Werte nur als `gekuerzt`). Der Text ist Klartext: „Geändert: Status (Entwurf → Versendet)
  – durch Macher“. Stille Änderungen (`{ leise: true }`) werden ebenfalls protokolliert, aber je Objekt und Akteur in einem
  Eintrag „Bearbeitet: …“ zusammengefasst (30 Minuten).
- **Akteur:** Standard ist der angemeldete Mensch. Automationen werden automatisch zugeordnet (Handler aus `start()` und
  `pruefen()` laufen als `{ quelle: 'automation', id }`). Für Importe, Abgleich oder eigene Hintergrundarbeit:
  `alsAkteur({ quelle: 'import', id: 'csv-kunden' }, () => …)` (gilt synchron; nach `await` erneut setzen).
- Systemsammlungen ohne Feldprotokoll: `auditAusnehmen('meine_sammlung')` (z. B. Caches, Chatverlauf).
- **Rückgängig:** `rueckgaengigGrund(ereignis)` (undefined = möglich), `rueckgaengig(ereignisId)` (Anlegen → Papierkorb, Löschen →
  wiederherstellen, Ändern → vorher-Stand, nur wenn das Feld seitdem nicht weiter geändert wurde), `allesRueckgaengig(ids)`.
  Sperren je Sammlung: `rueckgaengigSperre('rechnungen', (aktuell, e) => grund)` – festgeschriebene Rechnungen und Zahlungen
  sind gesperrt. `mitschneiden(fn)` liefert die Verlaufseinträge, die `fn` erzeugt hat.
- Sichtbar ist Audit nur als Verlauf am Objekt (`Zeitstrahl`) und unter Einstellungen › Papierkorb › „Letzte Änderungen“.
  Kein eigenes Audit-Modul. Rotation: automatische Einträge 365 Tage / 20 000 auf dem Gerät (`verlaufAufraeumen`).

### 8.3 Aktionen aus Sätzen – nur über den Gateway (`@core/gateway`)

Es gibt **einen** Weg von einem Satz zu einer Aktion: den Macher AI Gateway (`docs/os/KI-GATEWAY.md`). Die frühere
Action Engine (`@core/aktionen`, Feld `befehle`) ist darin aufgegangen und entfernt.

- **Module melden an:** `defineModul({ gateway: { aktionen } })` im Besitzer-Modul (`src/os/modules/<modul>/gateway.ts`),
  Absichten (`erkenne` → Plan) in `macher-fragen` (`assistent.ts`, `aktionen.ts`, `absichten.ts`). Eine Aktion ruft nur die
  bestehende Geschäftslogik des Moduls auf – keine kopierte Fachlogik.
- **Ablauf:** `frage()` → Absicht (Regeln, sonst Jev) → Rechte (`AbsichtDef.rechte` – ohne Recht keine Vorschau) → `Plan` als
  Vorschau (Texte über `PlanSchritt.textFeld` änderbar) → `pruefePlan` → Bestätigung → `fuehrePlanAus`/`fuehreAus`.
- **Risiko:** nur `lesen` / `schreiben` / `kritisch` (`risikoVon`). Geld zählt über das Recht `geld`; Senden, Löschen,
  Personal und Einstellungen machen eine Aktion automatisch `kritisch`. Keine zweite Klassifikation. `kritisch` bestätigt der
  Mensch im Chat ausdrücklich (Dialog).
- **Ausführen als Macher:** `fuehreAus` läuft in `alsAkteur({ quelle: 'ai', id: 'macher', mitarbeiterId })` und schneidet die
  Verlaufseinträge mit (`mitschneiden`) → Ergebnis `eintraege`. Der Akteur gilt synchron; was eine Aktion nach einem `await`
  schreibt (Senden), läuft als Mensch – solche Aktionen sind `endgueltig`.
- **Rückgängig:** `nimmZurueck(eintraege, kontext)` → `allesRueckgaengig` des Audits (mit allen Sperren, z. B. festgeschriebene
  Rechnungen), protokolliert als `zurueckgenommen`. Aktionen mit `endgueltig: '…'` (Nachricht, Angebot, Rechnung, Mahnung senden)
  bieten kein „Rückgängig“ an; der Satz steht in Vorschau und Ergebnis.
- **Links statt Versand:** Eine Aktion kann `oeffnen: [{ label, url }]` zurückgeben (mailto: …) – der Mensch öffnet sie selbst.

```ts
// src/os/modules/mahnungen/gateway.ts
export const MAHNUNG_AKTIONEN: AktionDef<{ rechnungId: ID }>[] = [{
  id: 'invoice.remind', titel: 'Zahlungserinnerung freigegeben', risiko: 'kritisch', rechte: ['geld', 'veroeffentlichen'],
  endgueltig: 'Was beim Kunden angekommen ist, lässt sich nicht zurückholen.',
  pruefe: (d, k) => …,                       // Fehlertext oder undefined
  fuehreAus: (d, k) => ({ bezug: { typ: 'rechnungen', id: d.rechnungId }, oeffnen: [{ label: 'E-Mail an …', url: 'mailto:…' }] }),
}];
```

**Zwei Protokolle, zwei Zwecke:**

| | `ki-protokoll` (Gateway) | `ereignisprotokoll` (Kern, 8.1) |
|---|---|---|
| Was | jede Frage und jede Aktion: Eingabe, Absicht, Sicherheit, Lane, Modell, bestätigt, verweigert/Fehler, zurückgenommen | fachliche Ereignisse des Betriebs |
| Wofür | KI-Kosten und Lanes, Qualität der Erkennung, Nachvollziehbarkeit der KI | Automationen, Integrationen, Webhooks |
| Verbindung | eine **ausgeführte** Aktion sendet genau ein Ereignis `macher.aktion_ausgefuehrt` (Bezug: das geänderte Objekt) | – |

Fragen, Vorschläge und Ablehnungen gehen nicht auf den Bus und landen nicht im Ereignisprotokoll. Was eine Aktion an Daten
ändert, steht wie jede Änderung im Verlauf am Objekt (8.2) – mit `quelle: 'ai'`.
