/*
 * Lader für den Service Worker von Macher OS.
 * Der eigentliche Code steht in `src/sw.ts` und wird von Vite gebaut (Datei mit Hash unter /assets/).
 * Dieser Lader liegt im Wurzelverzeichnis, damit der Service Worker die ganze App (Scope „/“) steuert.
 * Die App registriert `/sw.js?v=/assets/sw-<hash>.js` – ein neuer Build ändert die Adresse und damit den Worker.
 */
var quelle = new URL(self.location.href).searchParams.get('v');
if (quelle && /^\/assets\/[\w.-]+\.js$/.test(quelle)) importScripts(quelle);
