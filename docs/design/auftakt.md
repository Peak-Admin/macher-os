# Markenauftakt (Preloader)

„Für ein neues Wirtschaftswunder“ – läuft **einmal pro Gerät beim Erstkontakt**: vor der Website (`/`) oder vor der Einrichtung
(`/os/willkommen`). Vor täglichen Arbeitswegen der Software (`/os/heute` usw.) erscheint er nie (UX-Spezifikation 6.6).
Code: `src/components/auftakt/` (`Markenauftakt.tsx`, `auftakt.css`, `skript.ts`), Dateien: `public/auftakt/`.

## Ablauf (ca. 6 s)

- 0–1 s: dunkle Bühne, Wald und Licht erscheinen.
- 0,75–3,9 s: Buchstaben finden aus Bewegung und Unschärfe zu „Für ein neues Wirtschaftswunder“ zusammen.
- 3,15–4,95 s: Die Originalunterschrift wird von links nach rechts aufgedeckt.
- 4,2–5,7 s: Das gemeinsame Logo Mission Mittelstand | Matthias Aumann erscheint.
- 6,1 s: Ausblenden in die Seite. In der Software bleibt das Schlussbild stehen, bis Macher OS bereit ist
  (Ereignis `macher-os:bereit` aus `src/os/MacherOs.tsx`), höchstens 8 s länger.

„Intro überspringen“ und Escape funktionieren jederzeit. Während des Auftakts ist die Seite dahinter `inert`.

## Regeln

- Ein Skript im `<head>` beider Root-Layouts entscheidet vor dem ersten Bild (`localStorage` `mm-auftakt`).
  Ohne JavaScript, ohne Speicher, bei automatisierten Browsern (`navigator.webdriver`), auf Arbeitswegen der Software
  und bei Folgeaufrufen – auch in neuen Sitzungen – erscheint nichts, Bilder und Ton werden dann nicht geladen.
- `?auftakt` in der Adresse erzwingt den Auftakt (zum Ansehen und Abnehmen).
- Reduzierte Bewegung: Schlussbild ohne Animation, nach 1,8 s weiter.
- Klang (`klang.mp3`, synthetisch komponiert, ohne Fremdsamples): startet **nie automatisch**, nur über den Knopf
  „Mit Ton“. Überspringen blendet aus, Tabwechsel stoppt.
- Schrift: Barlow/Poppins nach Playbook (der Entwurf nutzte Switzer – nicht übernommen).
- Bewusste Ausnahme von Playbook-Abschnitt 10 (Bewegung 120–180 ms): einmaliger Markenmoment, kein Arbeitsbereich.

## Quellen

Siehe `/bildnachweise` (`auftaktBilder` in `src/content/bilder.ts`).

- Wald: Daniel Rauber, „forest with thick fog“, Unsplash License.
- Unterschrift Matthias Aumann und gemeinsames Logo: Originaldateien von matthias-aumann.de / mission-mittelstand.de.
  **Nutzungsrechte für den Einsatz im Produkt sind vom Betreiber zu bestätigen.**
