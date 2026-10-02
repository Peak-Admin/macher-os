/** Schlüssel in `sessionStorage`: Der Markenauftakt läuft einmal pro Sitzung (Website und Software gemeinsam). */
export const AUFTAKT_SCHLUESSEL = "mm-auftakt";

/** Ereignis, mit dem Macher OS meldet, dass die Software bereit ist (oder nicht starten kann). */
export const OS_BEREIT_EREIGNIS = "macher-os:bereit";

/**
 * Läuft im `<head>` vor dem ersten Bild: Nur beim ersten Besuch einer Sitzung wird `data-auftakt="an"` gesetzt –
 * erst dann zeigt das CSS die Bühne. Ohne JavaScript, bei automatisierten Browsern und bei späteren Seitenaufrufen
 * bleibt sie unsichtbar, die Seite blitzt also nie kurz auf. `?auftakt` in der Adresse erzwingt den Auftakt (zum Ansehen).
 */
export const auftaktSkript = `(function(){try{var d=document.documentElement;if(/[?&]auftakt\\b/.test(location.search)||(!navigator.webdriver&&!sessionStorage.getItem("${AUFTAKT_SCHLUESSEL}")))d.setAttribute("data-auftakt","an")}catch(e){}})()`;
