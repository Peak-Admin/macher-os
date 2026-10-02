# Abschlussbericht Paket `heute`

## Gebaute Module und Ansichten

| Modul | Gewicht | Ansichten | Einhängung |
|---|---|---|---|
| `braucht-dich` Braucht dich | 95 | `/heute/braucht-dich` (Filter Art, Chef/Büro „Für mich / Ganzes Team“) | Hub-Widget ganz oben (max. 5), Kurzinfo |
| `naechster-einsatz` Nächster Einsatz | 90 | `/heute/naechster-einsatz`, `/heute/naechster-einsatz/:id` (Einsatzansicht für jeden Termin) | Hub-Widget, Hinweise, Aktionen, Automation, `ObjektPanels objekt="termine"` |
| `mein-tag` Mein Tag | 85 | `/heute/mein-tag` (Heute/Morgen; Chef/Büro zusätzlich Betrieb, „Wer ist wo“, alle Termine) | Hub-Widget, Kurzinfo, Automation |
| `schnell-erfassen` Schnell erfassen | 80 | globales Overlay `schnell` (Dialog = Bottom-Sheet auf Mobil) | `global`, `navigation: 'versteckt'` |
| `erledigt` Erledigt | 40 | `/heute/erledigt` (Heute / Woche / 30 Tage, Rückgängig) | Hub-Widget, Kurzinfo |

Rollen: Monteur/Azubi sehen nur eigene Termine, Aufgaben (eigene + unzugewiesene am heutigen Auftrag),
Hinweise und Erledigungen, die sie betreffen. Chef/Büro sehen zusätzlich „Wer ist wo“, Betriebszahlen,
alle Termine des Tages und können in „Braucht dich“ aufs ganze Team umschalten. Chef/Büro ohne eigenen Einsatz
bekommen kein leeres „Nächster Einsatz“-Widget.

Schnell erfassen: Auftrag wird vorausgewählt (Payload `auftragId` → laufende Zeit → heutiger Einsatz) und an die
Aktion durchgereicht. Ohne registrierte Aktionen erscheint ein Leerzustand (mit „Auftrag öffnen“).

Nächster Einsatz: Start ruft `einsatz.starten`, Ende `einsatz.beenden` (team); fehlen diese, setzt Heute den
Terminstatus (`unterwegs` / `vor_ort` / `erledigt`) selbst und feuert `einsatz.gestartet` / `einsatz.beendet`.
„Bericht schreiben“ erscheint nur, wenn `bericht.erstellen` registriert ist.

## Wichtigste Pain Points (Top 5 je Modul)

- **Mein Tag:** Morgens unklar, wo es hingeht (80) · Chef weiß nicht, wer wo ist (63) · Aufgaben verstreut (63) · Tagesplan per WhatsApp (54) · Zu viel Info auf dem Handy (40)
- **Braucht dich:** Wichtiges geht unter (90) · Chef als Flaschenhals (72) · Fristen zu spät gesehen (63) · Hinweis ohne Handlung (48) · Alles gleich laut (54)
- **Nächster Einsatz:** Zugangsinfo fehlt (63) · Adresse abtippen (60) · Unklar, was zu tun ist (56) · Zeiterfassung vergessen (56) · Telefonnummer suchen (48)
- **Schnell erfassen:** Foto landet im privaten Handy (80) · Erfassen dauert zu lange (72) · Material vergessen (64) · Auftrag suchen (54) · Zeiten nachtragen (56)
- **Erledigt:** Kein Vertrauen in die Automatik (64) · Nicht zurücknehmbar (36) · Erfundene Ersparnis (35) · Nutzen unsichtbar (35) · Status-Änderung nicht nachvollziehbar (36)

Details: `PAINPOINTS.md` in jedem Modulordner.

## Automationen

| ID | Was | Schätzung |
|---|---|---|
| `heute.tagesplan` | Ab 5 Uhr einmal täglich: jeder mit Terminen bekommt seinen Tag als Benachrichtigung | 2 Min. je Person |
| `heute.terminstatus` | Termine von gestern und früher mit erfassten Zeiten → „erledigt“, rückgängig über `heute.termin.status` | 1 Min. je Termin |

Hinweise (live): `einsatz-nicht-beendet:<termin>:<mitarbeiter>` (an jeden Eingeteilten, Aktion `heute.einsatz.beenden`),
`einsatz-nicht-gestartet:<termin>` (Chef/Büro, Aktion `heute.einsatz.starten`).
Aktionen: `heute.einsatz.starten`, `heute.einsatz.beenden`, `heute.termin.status`.

## Eigene Sammlungen

Keine. Alles läuft über `db.termine`, `db.aufgaben`, `db.abwesenheiten`, `db.zeiten`, `db.hinweise`,
`db.erledigungen`, `db.benachrichtigungen` und Einstellungen.

## Kernwünsche

1. `Erledigung.rueckgaengigAm` – bis dahin merkt sich Erledigt das als Einstellung `erledigt.rueckgaengig.<id>`.
2. `Button` mit `href` für externe Ziele (Maps, `tel:`) – aktuell eigener `<a className="mm-btn …">`.
3. `Button to` reicht `onClick` nicht weiter (Overlay schließen vor Navigation) – im Modul über `navigate` gelöst.
4. `aktionVorhanden(id)` im Kern (`modul.ts`), damit keine toten Knöpfe entstehen – liegt jetzt in `naechster-einsatz/logik.ts`.
5. Eigener Blatt-Baustein (Bottom-Sheet auch auf Desktop) – aktuell `Dialog`, der auf Mobil schon als Sheet erscheint.
6. Automation-`pruefen()` nach dem Onboarding erneut auslösen – Heute ruft seine Prüfungen dafür im `seed` auf.
7. Zugriff auf `schulungen` (team) für Mein Tag – bis dahin zählen Termine `art: 'schulung'` und Abwesenheiten `schulung`/`schule`.

## Offene Punkte

- Schnell-erfassen-Aktionen, `einsatz.starten`/`beenden`, `bericht.erstellen` kommen aus anderen Paketen; im Zusammenspiel prüfen.
- Hub listet unter „Mehr in diesem Bereich“ die Heute-Module noch einmal als Kacheln (Kern-Hub-Verhalten).
- Arbeitsanweisungen (akte) werden über Panels am Termin erwartet; Heute zeigt Beschreibung, Notiz und Aufgaben.

## Testergebnis

`npx tsc -b` ✓ · `npx vitest run` ✓ (21 Tests, davon 16 im Paket) · `npx vite build` ✓.
Browser (Playwright, 1440 px und 390 px, Chef und Monteur, auch mit simulierter Uhrzeit 10:00): alle Ansichten,
Schnell-erfassen-Blatt und Einsatz starten geprüft, keine Konsolenfehler.
