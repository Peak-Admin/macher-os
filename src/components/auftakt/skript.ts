/** Schlüssel in `localStorage`: Der Markenauftakt läuft einmal pro Gerät (Website und Software gemeinsam) – nicht bei jeder Sitzung. */
export const AUFTAKT_SCHLUESSEL = "mm-auftakt";

/** Ereignis, mit dem Macher OS meldet, dass die Software bereit ist (oder nicht starten kann). */
export const OS_BEREIT_EREIGNIS = "macher-os:bereit";

/**
 * Läuft im `<head>` vor dem ersten Bild: Nur beim allerersten Besuch auf diesem Gerät wird `data-auftakt="an"` gesetzt –
 * erst dann zeigt das CSS die Bühne. In der Software nur beim Erstkontakt (`/os/willkommen`), nie vor täglichen
 * Arbeitswegen wie `/os/heute`. Ohne JavaScript, bei automatisierten Browsern und bei späteren Aufrufen bleibt sie
 * unsichtbar, die Seite blitzt also nie kurz auf. `?auftakt` in der Adresse erzwingt den Auftakt (zum Ansehen).
 */
export const auftaktSkript = `(function(){try{var d=document.documentElement,p=location.pathname,app=p==="/os"||p.indexOf("/os/")===0,erlaubt=!app||p.indexOf("/os/willkommen")===0;if(/[?&]auftakt\\b/.test(location.search)||(erlaubt&&!navigator.webdriver&&!localStorage.getItem("${AUFTAKT_SCHLUESSEL}")))d.setAttribute("data-auftakt","an")}catch(e){}})()`;
