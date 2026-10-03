# Markenauftakt (Preloader)

„Für ein neues Wirtschaftswunder“ – läuft **einmal pro Gerät beim Erstkontakt**: vor der Website oder vor der Einrichtung
(`/os/willkommen`). Vor täglichen Arbeitswegen der Software (`/os/heute` usw.) erscheint er nie (UX-Spezifikation 6.6).
Code: `src/components/auftakt/` (`Markenauftakt.tsx`, `auftakt.css`, `skript.ts`, `unterschrift-striche.ts`), Dateien: `public/auftakt/`.

## Ablauf (ca. 6 s)

- 0–1 s: dunkle Bühne, Wald und Licht erscheinen.
- 0,75–3,9 s: Buchstaben finden aus Bewegung und Unschärfe zu „Für ein neues Wirtschaftswunder“ zusammen.
- 2,9–5,3 s: Die Originalunterschrift wird Strich für Strich geschrieben. Die Mittellinien der Striche
  (`unterschrift-striche.ts`, aus `unterschrift.webp` gewonnen) werden als SVG-Maske nachgezogen und decken das Original auf;
  zum Schluss blendet das vollständige Original darüber.
- 4,2–5,7 s: Das gemeinsame Logo Mission Mittelstand | Matthias Aumann erscheint.
- 6,1 s: Ausblenden in die Seite. In der Software bleibt das Schlussbild stehen, bis Macher OS bereit ist
  (Ereignis `macher-os:bereit` aus `src/os/MacherOs.tsx`), höchstens 8 s länger.

„Intro überspringen“ und Escape funktionieren jederzeit. Während des Auftakts ist die Seite dahinter `inert`.

## Regeln

- Ein Skript im `<head>` beider Root-Layouts entscheidet vor dem ersten Bild (`localStorage` `mm-auftakt`) – auch neue
  Sitzungen zeigen ihn nicht noch einmal.
  Ohne JavaScript, bei automatisierten Browsern (`navigator.webdriver`) und bei Folgeaufrufen erscheint nichts,
  Bilder werden dann nicht geladen.
- `?auftakt` in der Adresse erzwingt den Auftakt (zum Ansehen und Abnehmen) und wird sofort aus der Adresse entfernt.
- `/preloader` spielt den Auftakt jederzeit neu ab (auch wenn er schon gesehen wurde) und geht danach normal auf der
  Startseite weiter – z. B. für mehrere Anläufe bei Videoaufnahmen einfach den Link erneut öffnen.
- Reduzierte Bewegung: Schlussbild ohne Animation, nach 1,8 s weiter.
- Kein Ton: Der Auftakt läuft stumm.
- Schrift: Barlow/Poppins nach Playbook (der Entwurf nutzte Switzer – nicht übernommen).
- Bewusste Ausnahme von Playbook-Abschnitt 10 (Bewegung 120–180 ms): einmaliger Markenmoment, kein Arbeitsbereich.

## Quellen

Siehe `/bildnachweise` (`auftaktBilder` in `src/content/bilder.ts`).

- Wald: Daniel Rauber, „forest with thick fog“, Unsplash License.
- Unterschrift Matthias Aumann und gemeinsames Logo: Originaldateien von matthias-aumann.de / mission-mittelstand.de.
  **Nutzungsrechte für den Einsatz im Produkt sind vom Betreiber zu bestätigen.**
