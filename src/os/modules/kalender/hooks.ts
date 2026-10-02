import { useEffect, useState } from 'react';

/** Schmaler Bildschirm (Handy) – Kalender zeigt dann eine Agenda-Liste statt eines Rasters */
export function useSchmal(grenze = 767): boolean {
  const abfrage = `(max-width: ${grenze}px)`;
  const [schmal, setSchmal] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(abfrage).matches : false));
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(abfrage);
    const f = () => setSchmal(mq.matches);
    f();
    mq.addEventListener?.('change', f);
    return () => mq.removeEventListener?.('change', f);
  }, [abfrage]);
  return schmal;
}

/** ICS-/Textdatei im Browser herunterladen */
export function herunterladen(dateiname: string, inhalt: string, mime = 'text/calendar;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([inhalt], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = dateiname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
