<!-- BEGIN:peak-vercel-build-budget -->
## Vercel-Kostenpflicht für alle Agenten

**Philipp, 16.10.2026: Wir sind ein Startup. Unnötige Vercel-Builds sind untersagt.** Gilt für Codex, Claude, andere Agenten, Automationen und delegierte Unteragenten in jedem Branch/Worktree. Diese Kostenregel ersetzt ältere pauschale Preview-/Deploy-Pflichten; bestehende Schutzregeln und erforderliche CI-Checks bleiben gültig.

- **Festes Standard:** `buildMachineSelection: fixed`, `buildMachineType: standard`. Kein Elastic, Enhanced, Turbo, `--turbo` oder Turbo-Commit-Marker. Mehrkosten nur mit ausdrücklicher, begrenzter Freigabe von Philipp; Function-/Runtime-Ressourcen nicht nebenbei ändern.
- **Lokal zuerst:** Dev-Server und passende lokale Prüfungen nutzen. Keine Remote-Deployments für Zwischenstände, Screenshots, kleine Text-/CSS-Korrekturen oder Statusmeldungen.
- **Vor Push/PR/Merge Auslöser prüfen:** Git-Pushes können kostenpflichtige Builds in mehreren Projekten starten. Änderungen bündeln; Draft-PRs oder `[skip ci]` nicht als sicheren Vercel-Kostenstopp behandeln.
- **Preview nur bei Bedarf:** Standard ist höchstens eine gezielte Preview je abgeschlossenem Arbeitspaket und Zielumgebung. Weitere Builds nur für materielle Änderungen, konkret behobene Fehler oder benötigte Abnahme, mit dokumentiertem Grund. Keine unveränderten Redeploy-/Retry-Schleifen.
- **Ein Auslöser pro Stand und Ziel:** Git **oder** CI/CLI; vorhandenes Deployment prüfen und wiederverwenden. Kein zusätzlicher CLI-/MCP-Deploy nach einem bereits deployenden Git-Push; keine unnötigen Staging-/Projektspiegel.
- **Release bündeln:** Merge, benötigte Version und Changelog in einem fertigen Release-Stand zusammenführen. Eingebaute Changelogs nicht blind ausfiltern. Keine separaten App-Deploys allein für Agenten-/Governance-Dokumentation.
- **Cache erhalten:** Kein routinemäßiges `--force`, Cache-Löschen oder kostenpflichtiges Überspringen der Warteschlange. Bei beauftragter Pipeline-Arbeit höchstens ein aktiver Preview-Build pro Branch und nur betroffene Projekte; fremde Releases/Produktionsjobs nicht abbrechen.
- **Prüfung passend zum Diff:** Bei reinen Agenten-/Governance-Markdownänderungen Diff, Links und Konsistenz prüfen; keine App-Builds oder Preview nur dafür. Für Code die erforderlichen Checks erhalten; laufzeitrelevante Markdown-Dateien sind keine automatische Ausnahme.
- **Vor kostenpflichtigem Build Standard verifizieren.** Bei fehlenden Rechten oder unklarer Maschine lokal weiterarbeiten und den kostenpflichtigen Schritt mit Grund zurückstellen. Kein stilles Hochstufen oder Rechteumgehen.
- **Ehrlich übergeben:** Tatsächliche Checks, ausgelöste Deployments samt Zweck, verifizierte Maschine und offene Einstellungen nennen. Diese Anweisung ändert Vercel-Konfiguration oder Ausgabenlimits nicht automatisch. Bei Delegation vollständig weitergeben.

Vollständige Richtlinie: [Vercel-Buildbudget im AI Agent OS](https://github.com/Peak-Admin/ai-agent-os/blob/main/08_GOVERNANCE/vercel-build-budget.md).
<!-- END:peak-vercel-build-budget -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
