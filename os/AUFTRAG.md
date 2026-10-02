# Auftrag an jede Paket-Session

Du baust ein Paket (siehe deine Startnachricht: Paketname `<paket>`, Module, Hinweise) von Macher OS, einem Betriebssystem für Handwerksbetriebe (Zielgruppe: Chef, Büro, Monteure in kleinen Handwerksbetrieben, 1–50 Leute).

## Ausgangslage
Repo: Peak-Admin/macher-os, Startbranch `claude/fervent-pascal-joztaz` (bereits ausgecheckt). Das Fundament steht (Datenmodell, Datenschicht, Modul-Registry, Shell, UI-Bausteine, Kunden-Referenzmodul). Du baust parallel zu 13 anderen Paketen.

Lies zuerst vollständig: `CLAUDE.md`, `os/PAKETE.md` (deine Module, Verträge, Verantwortungen), `os/MODULE.md` (Bauregeln), `docs/produkt/module.md` (Produktlogik), `os/src/core/objects.ts`, `os/src/core/modul.ts`, `os/src/core/db.ts`, `os/src/core/macher.ts`, `os/src/ui/index.tsx`, `os/src/ui/objekt.tsx`, `os/src/core/seed.ts`, `os/src/modules/kunden/`.

## Deine Module
Siehe Startnachricht und die Tabelle in `os/PAKETE.md`.


## Vorgehen je Modul
1. **Pain-Point-Analyse zuerst:** Überlege aus Sicht des Handwerkers (Chef, Büro, Monteur auf der Baustelle mit dreckigen Händen am Handy), was in diesem Bereich im Alltag wehtut. Schreibe `os/src/modules/<id>/PAINPOINTS.md` mit den **Top 25 Pain Points**, jeweils mit Score 1–100 (Frequenz 1–10 × Intensität 1–10) und wer betroffen ist. Leite daraus ab: **Muss rein** (deckt die wichtigsten Pains), **Macher erledigt automatisch** (Automation statt Oberfläche), **bewusst weggelassen** (Pareto).
2. **Bauen:** Pareto – 20 % Oberfläche für 80 % Ergebnis. So wenig Interface wie möglich, so viel Automatik wie möglich. Max. 3–4 Hauptansichten je Modul. Exception-First: Probleme/Fristen/Entscheidungen als `hinweise` (Braucht dich) mit konkreter Aktion. Wiederkehrende Verwaltungsarbeit als `automationen` mit Eintrag in „Erledigt“ (`erledigt(...)`). Einhängen in andere Ansichten über `tabs`/`panels`/`schnell`/`erstellen`/`suche`.
3. **Jedes Objekt existiert genau einmal.** Nur `db.*` für Kernobjekte, nur die dir in PAKETE.md zugewiesenen eigenen Sammlungen, Verweise per ID, nie Daten kopieren. Keine Dateien außerhalb deiner Modulordner ändern. Keine neuen npm-Pakete. Fehlt dir etwas im Kern, löse es im Modul und notiere es unter „Kernwünsche“ in deinem Abschlussbericht.
4. **Sprache:** alles Deutsch, Handwerkersprache, Du-Ansprache (du/dein klein), konkrete Verben („Auftrag anlegen“), keine erfundenen Zahlen. Jede Ansicht hat Leer-, Fehler- und Erfolgszustand und funktioniert bei 390 px Breite.
5. **Design kommt ganz am Schluss zentral.** Nutze ausschließlich die UI-Bausteine (`@ui/index`, `@ui/objekt`), höchstens minimales Layout-CSS mit `--mm-*`-Tokens. Keine eigene Optik erfinden.
6. **Beispieldaten:** Nutze die Kern-Beispieldaten aus `seed.ts`; für eigene Sammlungen `seed` im Modul (mit `beispiel: true`), damit nach dem Onboarding sofort etwas sichtbar ist.
7. **Tests:** reine Logik (Berechnungen, Regeln, Automationen) mit vitest in `*.test.ts` im Modulordner.

## Prüfen (muss grün sein)
```
cd os && npm ci && npx tsc -b && npx vitest run && npx vite build
```
Dann im Browser prüfen: `npx vite preview --port 4173 &` und mit Playwright (Chromium liegt unter /opt/pw-browsers; `import { chromium } from 'playwright'` bzw. global unter `/opt/node22/lib/node_modules/playwright/index.mjs`) auf `/willkommen` „Beispielbetrieb einrichten“ klicken (oder das Onboarding durchlaufen, falls vorhanden), dann jede deiner Ansichten bei 1440 px und 390 px öffnen, auf Konsolenfehler prüfen und Screenshots ansehen. Behebe alles, was kaputt oder unverständlich ist.

## Abschluss
- Committe auf den Branch `claude/fervent-pascal-joztaz-<paket>` (anlegen: `git checkout -b claude/fervent-pascal-joztaz-<paket>`), aussagekräftige deutsche Commit-Messages, und pushe mit `git push -u origin claude/fervent-pascal-joztaz-<paket>`. **Keinen Pull Request anlegen.** Nicht auf andere Branches pushen.
- Lege `os/src/modules/_berichte/<paket>.md` an (einzige erlaubte Datei außerhalb deiner Modulordner) mit: gebaute Module und Ansichten, wichtigste Pain Points je Modul (Top 5), Automationen, eigene Sammlungen, Kernwünsche, offene Punkte, Testergebnis.
- Arbeite vollständig selbständig bis zum Push; stelle keine Rückfragen.
